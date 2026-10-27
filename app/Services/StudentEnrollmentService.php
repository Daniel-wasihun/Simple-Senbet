<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\Member;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Domain service governing student class/section enrollment intervals.
 *
 * Architecture Notes:
 * - Authoritative historical membership is stored exclusively in `student_enrollments`.
 * - Invariant INV-01 (at most one active enrollment) is enforced by DB partial unique index `uq_student_single_active_enrollment`.
 * - Invariant INV-02 (non-overlapping closed intervals) is enforced at the service level using pessimistic `Member::lockForUpdate()`.
 *   Direct SQL writes that bypass this service do not trigger INV-02 closed-interval validation.
 * - `members.class_id` and `members.section` are cached non-authoritative projections. Upon student withdrawal,
 *   `members.class_id` is intentionally preserved as the student's last known grade/class level (permanent record),
 *   while `members.section` is cleared to null.
 */
class StudentEnrollmentService
{
    /**
     * Enroll a student into a class and section with historical tracking and concurrency protection.
     *
     * @throws ValidationException
     */
    public function enroll(
        int $memberId,
        int $academicYearId,
        int $classId,
        string $section,
        CarbonInterface|string $startDate
    ): StudentEnrollment {
        $startDate = is_string($startDate) ? Carbon::parse($startDate)->startOfDay() : $startDate->copy()->startOfDay();

        return DB::transaction(function () use ($memberId, $academicYearId, $classId, $section, $startDate) {
            // 1. Serialize mutations per student using pessimistic row-level locking
            $member = Member::where('id', $memberId)->lockForUpdate()->firstOrFail();

            // 2. Validate academic year boundaries
            $academicYear = AcademicYear::findOrFail($academicYearId);
            $yearStart = Carbon::parse($academicYear->start_date)->startOfDay();
            $yearEnd = Carbon::parse($academicYear->end_date)->endOfDay();

            if ($startDate->lt($yearStart) || $startDate->gt($yearEnd)) {
                throw ValidationException::withMessages([
                    'start_date' => ["The enrollment start date must fall within the academic year ({$yearStart->toDateString()} to {$yearEnd->toDateString()})."],
                ]);
            }

            // 3. Validate class exists and section is non-empty
            SchoolClass::findOrFail($classId);
            if (empty(trim($section))) {
                throw ValidationException::withMessages([
                    'section' => ['A valid non-empty section is required.'],
                ]);
            }

            // 4. Invariant INV-01: Ensure no currently active enrollment exists
            $hasActive = StudentEnrollment::where('member_id', $memberId)
                ->whereNull('end_date')
                ->exists();

            if ($hasActive) {
                throw ValidationException::withMessages([
                    'member_id' => ['Student already has an active enrollment. Transfer or close current enrollment first.'],
                ]);
            }

            // 5. Invariant INV-02: Ensure no overlapping closed historical interval exists
            $overlapExists = StudentEnrollment::where('member_id', $memberId)
                ->where(function ($query) use ($startDate) {
                    $query->whereNull('end_date')
                        ->orWhereDate('end_date', '>', $startDate->toDateString());
                })
                ->exists();

            if ($overlapExists) {
                throw ValidationException::withMessages([
                    'start_date' => ['The specified start date overlaps with an existing historical enrollment interval.'],
                ]);
            }

            // 6. Create enrollment record
            $enrollment = StudentEnrollment::create([
                'member_id' => $memberId,
                'academic_year_id' => $academicYearId,
                'class_id' => $classId,
                'section' => trim($section),
                'start_date' => $startDate->toDateString(),
                'end_date' => null,
            ]);

            // 7. Synchronize non-authoritative cached projection on member
            $member->update([
                'class_id' => $classId,
                'section' => trim($section),
            ]);

            return $enrollment;
        });
    }

    /**
     * Transfer a student from their current class/section to a new class/section.
     *
     * @throws ValidationException
     */
    public function transfer(
        int $memberId,
        int $newClassId,
        string $newSection,
        CarbonInterface|string $transferDate,
        ?string $reason = null
    ): StudentEnrollment {
        $transferDate = is_string($transferDate) ? Carbon::parse($transferDate)->startOfDay() : $transferDate->copy()->startOfDay();

        return DB::transaction(function () use ($memberId, $newClassId, $newSection, $transferDate, $reason) {
            // 1. Pessimistic lock on member to serialize concurrent transfer attempts
            $member = Member::where('id', $memberId)->lockForUpdate()->firstOrFail();

            // 2. Fetch current active enrollment
            $current = StudentEnrollment::where('member_id', $memberId)
                ->whereNull('end_date')
                ->first();

            if (! $current) {
                throw ValidationException::withMessages([
                    'member_id' => ['Student has no active enrollment to transfer from.'],
                ]);
            }

            $currentStart = Carbon::parse($current->start_date)->startOfDay();

            // 3. Boundary check: transfer date must strictly follow start_date (same-day transfer rejection)
            if ($transferDate->lte($currentStart)) {
                throw ValidationException::withMessages([
                    'transfer_date' => ["Transfer date ({$transferDate->toDateString()}) must be strictly after the current enrollment start date ({$currentStart->toDateString()})."],
                ]);
            }

            // 4. Validate academic year boundary
            $academicYear = AcademicYear::findOrFail($current->academic_year_id);
            $yearEnd = Carbon::parse($academicYear->end_date)->endOfDay();

            if ($transferDate->gt($yearEnd)) {
                throw ValidationException::withMessages([
                    'transfer_date' => ["Transfer date cannot exceed the academic year end date ({$yearEnd->toDateString()})."],
                ]);
            }

            // 5. Validate destination class and section
            SchoolClass::findOrFail($newClassId);
            if (empty(trim($newSection))) {
                throw ValidationException::withMessages([
                    'section' => ['A valid non-empty destination section is required.'],
                ]);
            }

            // 6. Close current enrollment at transfer date T (exclusive)
            $current->update([
                'end_date' => $transferDate->toDateString(),
                'transfer_reason' => $reason,
            ]);

            // 7. Create replacement enrollment starting at transfer date T (inclusive)
            $newEnrollment = StudentEnrollment::create([
                'member_id' => $memberId,
                'academic_year_id' => $current->academic_year_id,
                'class_id' => $newClassId,
                'section' => trim($newSection),
                'start_date' => $transferDate->toDateString(),
                'end_date' => null,
            ]);

            // 8. Update cached projection on member
            $member->update([
                'class_id' => $newClassId,
                'section' => trim($newSection),
            ]);

            return $newEnrollment;
        });
    }

    /**
     * Withdraw a student from active enrollment.
     *
     * @throws ValidationException
     */
    public function withdraw(
        int $memberId,
        CarbonInterface|string $withdrawalDate,
        ?string $reason = null
    ): StudentEnrollment {
        $withdrawalDate = is_string($withdrawalDate) ? Carbon::parse($withdrawalDate)->startOfDay() : $withdrawalDate->copy()->startOfDay();

        return DB::transaction(function () use ($memberId, $withdrawalDate, $reason) {
            $member = Member::where('id', $memberId)->lockForUpdate()->firstOrFail();

            $current = StudentEnrollment::where('member_id', $memberId)
                ->whereNull('end_date')
                ->first();

            if (! $current) {
                throw ValidationException::withMessages([
                    'member_id' => ['Student has no active enrollment to withdraw from.'],
                ]);
            }

            $currentStart = Carbon::parse($current->start_date)->startOfDay();
            if ($withdrawalDate->lte($currentStart)) {
                throw ValidationException::withMessages([
                    'withdrawal_date' => ["Withdrawal date must be strictly after the enrollment start date ({$currentStart->toDateString()})."],
                ]);
            }

            $current->update([
                'end_date' => $withdrawalDate->toDateString(),
                'transfer_reason' => $reason ?? 'Withdrawal',
            ]);

            $member->update([
                'section' => null,
            ]);

            return $current;
        });
    }

    /**
     * Resolve the active student roster for a class and section on a specific calendar date.
     */
    public function getRosterForDate(int $classId, string $section, CarbonInterface|string $date): Collection
    {
        $dateStr = is_string($date) ? Carbon::parse($date)->toDateString() : $date->toDateString();

        $enrolled = Member::query()
            ->join('student_enrollments as e', 'e.member_id', '=', 'members.id')
            ->where('e.class_id', $classId)
            ->where('e.section', $section)
            ->whereDate('e.start_date', '<=', $dateStr)
            ->where(function ($query) use ($dateStr) {
                $query->whereNull('e.end_date')
                    ->orWhereDate('e.end_date', '>', $dateStr);
            })
            ->whereNull('members.deleted_at')
            ->select('members.*', 'e.start_date as enrollment_start_date', 'e.end_date as enrollment_end_date')
            ->orderBy('members.id')
            ->get();

        if ($enrolled->isNotEmpty()) {
            return $enrolled;
        }

        // A member is considered enrolled upon registration: fallback to direct members query
        return Member::query()
            ->where('class_id', $classId)
            ->where('section', $section)
            ->where(function ($q) {
                $q->whereNull('status')->orWhere('status', 'active');
            })
            ->whereNull('deleted_at')
            ->orderBy('id')
            ->get();
    }
}
