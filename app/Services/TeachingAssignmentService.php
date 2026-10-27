<?php

namespace App\Services;

use App\Enums\Semester;
use App\Models\AcademicYear;
use App\Models\Course;
use App\Models\SchoolClass;
use App\Models\TeachingAssignment;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TeachingAssignmentService
{
    /**
     * Create a teaching assignment for a teacher, class, section, course, and semester.
     *
     * @throws ValidationException
     */
    public function assign(
        int $teacherId,
        int $academicYearId,
        int $classId,
        string $section,
        int $courseId,
        Semester|string $semester,
        CarbonInterface|string|null $startDate = null,
        CarbonInterface|string|null $endDate = null,
        bool $isPrimary = false
    ): TeachingAssignment {
        $semesterValue = $semester instanceof Semester ? $semester->value : $semester;
        if (! in_array($semesterValue, ['semester_1', 'semester_2'], true)) {
            throw ValidationException::withMessages([
                'semester' => ['Invalid semester specified.'],
            ]);
        }

        $cleanSection = trim($section);
        if (empty($cleanSection)) {
            throw ValidationException::withMessages([
                'section' => ['A valid non-empty section is required.'],
            ]);
        }

        return DB::transaction(function () use (
            $teacherId,
            $academicYearId,
            $classId,
            $cleanSection,
            $courseId,
            $semesterValue,
            $startDate,
            $endDate,
            $isPrimary
        ) {
            // Verify teacher exists
            User::findOrFail($teacherId);

            // Verify class exists
            SchoolClass::findOrFail($classId);

            // Verify course exists and belongs to the given class; acquire exclusive row lock to serialize competing assignments
            $course = Course::where('id', $courseId)->lockForUpdate()->firstOrFail();
            if ((int) $course->class_id !== (int) $classId) {
                throw ValidationException::withMessages([
                    'course_id' => ["The selected course ({$course->id}) does not belong to class ({$classId})."],
                ]);
            }

            // Verify academic year and date boundaries
            $academicYear = AcademicYear::find($academicYearId);
            if (! $academicYear) {
                $academicYear = AcademicYear::where('is_current', true)->first()
                    ?? AcademicYear::latest('id')->first();
                if (! $academicYear) {
                    $academicYear = AcademicYear::create([
                        'name' => ['en' => 'Academic Year ' . date('Y'), 'am' => 'የትምህርት ዘመን ' . date('Y')],
                        'start_date' => date('Y-01-01'),
                        'end_date' => date('Y-12-31'),
                        'is_current' => true,
                    ]);
                }
                $academicYearId = $academicYear->id;
            }
            $yearStart = Carbon::parse($academicYear->start_date)->startOfDay();
            $yearEnd = Carbon::parse($academicYear->end_date)->endOfDay();

            $parsedStart = $startDate !== null
                ? (is_string($startDate) ? Carbon::parse($startDate)->startOfDay() : $startDate->copy()->startOfDay())
                : $yearStart->copy();

            $parsedEnd = $endDate !== null
                ? (is_string($endDate) ? Carbon::parse($endDate)->startOfDay() : $endDate->copy()->startOfDay())
                : null;

            if ($parsedStart->lt($yearStart) || $parsedStart->gt($yearEnd)) {
                throw ValidationException::withMessages([
                    'start_date' => ["The start date must fall within the academic year ({$yearStart->toDateString()} to {$yearEnd->toDateString()})."],
                ]);
            }

            if ($parsedEnd !== null) {
                if ($parsedEnd->lte($parsedStart)) {
                    throw ValidationException::withMessages([
                        'end_date' => ["The end date ({$parsedEnd->toDateString()}) must be strictly after the start date ({$parsedStart->toDateString()})."],
                    ]);
                }
                if ($parsedEnd->gt($yearEnd->copy()->addDay())) {
                    throw ValidationException::withMessages([
                        'end_date' => ["The end date cannot exceed the academic year end date ({$yearEnd->toDateString()})."],
                    ]);
                }
            }

            $startDateStr = $parsedStart->toDateString();
            $endDateStr = $parsedEnd?->toDateString();

            // Check temporal overlap for the SAME teacher on the same course/class/section/semester
            $teacherOverlapQuery = TeachingAssignment::where('teacher_id', $teacherId)
                ->where('academic_year_id', $academicYearId)
                ->where('class_id', $classId)
                ->where('section', $cleanSection)
                ->where('course_id', $courseId)
                ->where('semester', $semesterValue);

            $this->applyIntervalOverlapFilter($teacherOverlapQuery, $startDateStr, $endDateStr);

            if ($teacherOverlapQuery->exists()) {
                throw ValidationException::withMessages([
                    'teacher_id' => ['This teacher already has an overlapping assignment for this course, section, and semester.'],
                ]);
            }

            // If primary teacher, check that no other primary teacher has an overlapping interval
            if ($isPrimary) {
                $primaryOverlapQuery = TeachingAssignment::where('academic_year_id', $academicYearId)
                    ->where('class_id', $classId)
                    ->where('section', $cleanSection)
                    ->where('course_id', $courseId)
                    ->where('semester', $semesterValue)
                    ->where('is_primary', true);

                $this->applyIntervalOverlapFilter($primaryOverlapQuery, $startDateStr, $endDateStr);

                if ($primaryOverlapQuery->exists()) {
                    throw ValidationException::withMessages([
                        'is_primary' => ['A primary teacher is already assigned to this class, section, course, and semester during the specified interval.'],
                    ]);
                }
            }

            return TeachingAssignment::create([
                'teacher_id' => $teacherId,
                'academic_year_id' => $academicYearId,
                'class_id' => $classId,
                'section' => $cleanSection,
                'course_id' => $courseId,
                'semester' => $semesterValue,
                'is_primary' => $isPrimary,
                'start_date' => $startDateStr,
                'end_date' => $endDateStr,
            ]);
        });
    }

    /**
     * Terminate or close an active teaching assignment.
     *
     * @throws ValidationException
     */
    public function endAssignment(int $assignmentId, CarbonInterface|string $endDate): TeachingAssignment
    {
        $parsedEnd = is_string($endDate) ? Carbon::parse($endDate)->startOfDay() : $endDate->copy()->startOfDay();

        return DB::transaction(function () use ($assignmentId, $parsedEnd) {
            $assignment = TeachingAssignment::lockForUpdate()->findOrFail($assignmentId);

            if ($assignment->start_date !== null) {
                $start = Carbon::parse($assignment->start_date)->startOfDay();
                if ($parsedEnd->lte($start)) {
                    throw ValidationException::withMessages([
                        'end_date' => ["End date must be strictly after the start date ({$start->toDateString()})."],
                    ]);
                }
            }

            $assignment->update([
                'end_date' => $parsedEnd->toDateString(),
            ]);

            return $assignment;
        });
    }

    /**
     * Resolve all expected teachers assigned to a class, section, course, and semester on a given date.
     */
    public function getExpectedTeachersForDate(
        int $classId,
        string $section,
        int $courseId,
        Semester|string $semester,
        CarbonInterface|string $date
    ): Collection {
        $semesterValue = $semester instanceof Semester ? $semester->value : $semester;
        $dateStr = is_string($date) ? Carbon::parse($date)->toDateString() : $date->toDateString();

        return TeachingAssignment::with('teacher')
            ->where('class_id', $classId)
            ->where('section', trim($section))
            ->where('course_id', $courseId)
            ->where('semester', $semesterValue)
            ->where(function ($q) use ($dateStr) {
                $q->whereNull('start_date')
                    ->orWhereDate('start_date', '<=', $dateStr);
            })
            ->where(function ($q) use ($dateStr) {
                $q->whereNull('end_date')
                    ->orWhereDate('end_date', '>', $dateStr);
            })
            ->orderByDesc('is_primary')
            ->orderBy('id')
            ->get();
    }

    /**
     * Apply half-open interval overlap condition: [s1, e1) overlaps [s2, e2) iff:
     * (s1 < e2 OR e2 is null) AND (s2 < e1 OR e1 is null)
     */
    private function applyIntervalOverlapFilter($query, string $startStr, ?string $endStr): void
    {
        if ($endStr !== null) {
            $query->where(function ($q) use ($endStr) {
                $q->whereNull('start_date')
                    ->orWhereDate('start_date', '<', $endStr);
            });
        }

        $query->where(function ($q) use ($startStr) {
            $q->whereNull('end_date')
                ->orWhereDate('end_date', '>', $startStr);
        });
    }
}
