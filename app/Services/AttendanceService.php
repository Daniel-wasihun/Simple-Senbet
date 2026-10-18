<?php

namespace App\Services;

use App\Enums\AttendanceAuditAction;
use App\Enums\AttendanceMark;
use App\Enums\AttendanceStatus;
use App\Enums\Semester;
use App\Models\AcademicYear;
use App\Models\AttendanceAuditLog;
use App\Models\AttendanceSession;
use App\Models\Course;
use App\Models\Member;
use App\Models\SchoolClass;
use App\Models\SessionStudentRecord;
use App\Models\SessionTeacherRecord;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Domain Service governing Attendance Sessions, Roster Validation, Atomic Submission,
 * 24-Hour Correction Policies, Administrative Overrides, and Immutable Audit Logging.
 */
class AttendanceService
{
    public function __construct(
        protected StudentEnrollmentService $enrollmentService,
        protected TeachingAssignmentService $teachingAssignmentService
    ) {}

    /**
     * Create a new attendance session in Draft status with initial audit log.
     *
     * @throws ValidationException
     */
    public function createSession(
        int $academicYearId,
        int $termId,
        int $classId,
        ?int $courseId,
        DateTimeInterface|string $date,
        string $timeSlot,
        ?int $creatorId = null
    ): AttendanceSession {
        $dateStr = is_string($date) ? Carbon::parse($date)->toDateString() : Carbon::instance($date)->toDateString();
        $parsedDate = Carbon::parse($dateStr)->startOfDay();

        // 1. Validate Academic Year
        $academicYear = AcademicYear::findOrFail($academicYearId);
        $yearStart = Carbon::parse($academicYear->start_date)->startOfDay();
        $yearEnd = Carbon::parse($academicYear->end_date)->endOfDay();

        if ($parsedDate->lt($yearStart) || $parsedDate->gt($yearEnd)) {
            throw ValidationException::withMessages([
                'date' => ["The session date ({$dateStr}) must fall within the academic year ({$yearStart->toDateString()} to {$yearEnd->toDateString()})."],
            ]);
        }

        // 2. Validate Class
        $schoolClass = SchoolClass::findOrFail($classId);

        // 3. Validate Course Compatibility (if course-specific session)
        if ($courseId !== null) {
            $course = Course::findOrFail($courseId);
            if ((int) $course->class_id !== $classId) {
                throw ValidationException::withMessages([
                    'course_id' => ["The course '{$course->code}' does not belong to the selected class '{$schoolClass->code}'."],
                ]);
            }
        }

        // 4. Validate Creator (if provided)
        if ($creatorId !== null) {
            User::findOrFail($creatorId);
        }

        // 5. Check for Existing Session (including soft-deleted records)
        $existingSession = AttendanceSession::withTrashed()
            ->where('academic_year_id', $academicYearId)
            ->where('term_id', $termId)
            ->where('class_id', $classId)
            ->where('course_id', $courseId)
            ->whereDate('date', $dateStr)
            ->where('time_slot', trim($timeSlot))
            ->first();

        if ($existingSession) {
            $statusLabel = $existingSession->trashed() ? 'an archived/soft-deleted' : 'an active';
            throw ValidationException::withMessages([
                'time_slot' => ["An attendance session already exists for this slot ({$statusLabel} session ID: {$existingSession->id}). Duplicate slots are forbidden."],
            ]);
        }

        // 6. Create Session and Audit Log atomically
        return DB::transaction(function () use ($academicYearId, $termId, $classId, $courseId, $dateStr, $timeSlot, $creatorId) {
            $session = AttendanceSession::create([
                'academic_year_id' => $academicYearId,
                'term_id' => $termId,
                'class_id' => $classId,
                'course_id' => $courseId,
                'date' => $dateStr,
                'time_slot' => trim($timeSlot),
                'status' => AttendanceStatus::Draft,
                'submitted_by' => null,
                'submitted_at' => null,
                'closed_at' => null,
            ]);

            AttendanceAuditLog::create([
                'attendance_session_id' => $session->id,
                'actor_id' => $creatorId ?? User::first()?->id ?? 1,
                'action' => AttendanceAuditAction::SessionCreated,
                'previous_state' => null,
                'new_state' => [
                    'status' => AttendanceStatus::Draft->value,
                    'academic_year_id' => $academicYearId,
                    'term_id' => $termId,
                    'class_id' => $classId,
                    'course_id' => $courseId,
                    'date' => $dateStr,
                    'time_slot' => trim($timeSlot),
                ],
                'created_at' => now(),
            ]);

            return $session;
        });
    }

    /**
     * Submit an attendance session with validated student and teacher marks atomically.
     *
     * @param  list<array{student_id: int, mark: AttendanceMark|string, remarks?: string|null}>  $studentMarks
     * @param  list<array{teacher_id: int, mark: AttendanceMark|string, remarks?: string|null}>  $teacherMarks
     *
     * @throws ValidationException
     */
    public function submitSession(
        AttendanceSession $session,
        array $studentMarks,
        array $teacherMarks,
        User $submitter,
        ?string $section = null,
        Semester|string|null $semester = null
    ): AttendanceSession {
        return DB::transaction(function () use ($session, $studentMarks, $teacherMarks, $submitter, $section, $semester) {
            // 1. Pessimistic row-locking to serialize concurrent submissions
            /** @var AttendanceSession $lockedSession */
            $lockedSession = AttendanceSession::where('id', $session->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! $lockedSession->isDraft()) {
                throw ValidationException::withMessages([
                    'status' => ["Only draft sessions can be submitted. Current status: {$lockedSession->status->value}."],
                ]);
            }

            // 2. Validate Student Roster using Stage 0 StudentEnrollmentService
            $expectedStudents = $this->resolveExpectedStudents($lockedSession, $section);
            $expectedStudentIds = $expectedStudents->pluck('id')->all();

            $submittedStudentIds = [];
            $validatedStudentMarks = [];

            foreach ($studentMarks as $index => $item) {
                if (! isset($item['student_id'])) {
                    throw ValidationException::withMessages([
                        "student_marks.{$index}.student_id" => ['Missing required student_id.'],
                    ]);
                }

                $studentId = (int) $item['student_id'];
                if (in_array($studentId, $submittedStudentIds, true)) {
                    throw ValidationException::withMessages([
                        "student_marks.{$index}.student_id" => ["Duplicate student mark provided for student ID: {$studentId}."],
                    ]);
                }
                $submittedStudentIds[] = $studentId;

                if (! in_array($studentId, $expectedStudentIds, true)) {
                    throw ValidationException::withMessages([
                        "student_marks.{$index}.student_id" => ["Student ID {$studentId} is not enrolled in this roster on {$lockedSession->date->toDateString()}."],
                    ]);
                }

                $mark = $this->parseMark($item['mark'] ?? null, "student_marks.{$index}.mark");
                $validatedStudentMarks[] = [
                    'student_id' => $studentId,
                    'mark' => $mark,
                    'remarks' => $item['remarks'] ?? null,
                ];
            }

            // Ensure every expected student was marked
            $missingStudentIds = array_diff($expectedStudentIds, $submittedStudentIds);
            if (! empty($missingStudentIds)) {
                $missingList = implode(', ', $missingStudentIds);
                throw ValidationException::withMessages([
                    'student_marks' => ["Attendance marks are missing for expected student(s): [{$missingList}]. All enrolled students must be marked."],
                ]);
            }

            // 3. Validate Teacher Marks (if course session)
            $validatedTeacherMarks = [];
            $submittedTeacherIds = [];

            if ($lockedSession->course_id !== null && $section !== null && $semester !== null) {
                $expectedTeachers = $this->teachingAssignmentService->getExpectedTeachersForDate(
                    $lockedSession->class_id,
                    $section,
                    $lockedSession->course_id,
                    $semester,
                    $lockedSession->date
                );

                $expectedTeacherIds = $expectedTeachers->pluck('teacher_id')->all();

                foreach ($teacherMarks as $index => $item) {
                    if (! isset($item['teacher_id'])) {
                        throw ValidationException::withMessages([
                            "teacher_marks.{$index}.teacher_id" => ['Missing required teacher_id.'],
                        ]);
                    }

                    $teacherId = (int) $item['teacher_id'];
                    if (in_array($teacherId, $submittedTeacherIds, true)) {
                        throw ValidationException::withMessages([
                            "teacher_marks.{$index}.teacher_id" => ["Duplicate teacher mark provided for teacher ID: {$teacherId}."],
                        ]);
                    }
                    $submittedTeacherIds[] = $teacherId;

                    if (! empty($expectedTeacherIds) && ! in_array($teacherId, $expectedTeacherIds, true)) {
                        throw ValidationException::withMessages([
                            "teacher_marks.{$index}.teacher_id" => ["Teacher ID {$teacherId} is not assigned to this course on {$lockedSession->date->toDateString()}."],
                        ]);
                    }

                    $mark = $this->parseMark($item['mark'] ?? null, "teacher_marks.{$index}.mark");
                    $validatedTeacherMarks[] = [
                        'teacher_id' => $teacherId,
                        'mark' => $mark,
                        'remarks' => $item['remarks'] ?? null,
                    ];
                }

                // If expected teachers exist, verify they were marked
                $missingTeacherIds = array_diff($expectedTeacherIds, $submittedTeacherIds);
                if (! empty($missingTeacherIds)) {
                    $missingList = implode(', ', $missingTeacherIds);
                    throw ValidationException::withMessages([
                        'teacher_marks' => ["Attendance marks are missing for assigned teacher(s): [{$missingList}]."],
                    ]);
                }
            } else {
                // For sessions without section/semester or homeroom sessions, validate format of any supplied teacher marks
                foreach ($teacherMarks as $index => $item) {
                    $teacherId = (int) ($item['teacher_id'] ?? 0);
                    User::findOrFail($teacherId);

                    if (in_array($teacherId, $submittedTeacherIds, true)) {
                        throw ValidationException::withMessages([
                            "teacher_marks.{$index}.teacher_id" => ["Duplicate teacher mark for teacher ID: {$teacherId}."],
                        ]);
                    }
                    $submittedTeacherIds[] = $teacherId;

                    $mark = $this->parseMark($item['mark'] ?? null, "teacher_marks.{$index}.mark");
                    $validatedTeacherMarks[] = [
                        'teacher_id' => $teacherId,
                        'mark' => $mark,
                        'remarks' => $item['remarks'] ?? null,
                    ];
                }
            }

            // 4. Persist Student Records
            $submissionTime = now();
            foreach ($validatedStudentMarks as $v) {
                SessionStudentRecord::create([
                    'attendance_session_id' => $lockedSession->id,
                    'student_id' => $v['student_id'],
                    'mark' => $v['mark'],
                    'marked_by' => $submitter->id,
                    'marked_at' => $submissionTime,
                    'remarks' => $v['remarks'],
                ]);
            }

            // 5. Persist Teacher Records
            foreach ($validatedTeacherMarks as $v) {
                SessionTeacherRecord::create([
                    'attendance_session_id' => $lockedSession->id,
                    'teacher_id' => $v['teacher_id'],
                    'mark' => $v['mark'],
                    'marked_by' => $submitter->id,
                    'marked_at' => $submissionTime,
                    'remarks' => $v['remarks'],
                ]);
            }

            // 6. Update Session State
            $lockedSession->update([
                'status' => AttendanceStatus::Submitted,
                'submitted_by' => $submitter->id,
                'submitted_at' => $submissionTime,
            ]);

            // 7. Write Immutable Audit Log
            AttendanceAuditLog::create([
                'attendance_session_id' => $lockedSession->id,
                'actor_id' => $submitter->id,
                'action' => AttendanceAuditAction::SessionSubmitted,
                'previous_state' => ['status' => AttendanceStatus::Draft->value],
                'new_state' => [
                    'status' => AttendanceStatus::Submitted->value,
                    'submitted_by' => $submitter->id,
                    'submitted_at' => $submissionTime->toIso8601String(),
                    'student_records_count' => count($validatedStudentMarks),
                    'teacher_records_count' => count($validatedTeacherMarks),
                ],
                'created_at' => $submissionTime,
            ]);

            return $lockedSession->fresh(['studentRecords', 'teacherRecords', 'auditLogs']);
        });
    }

    /**
     * Correct attendance marks on a submitted session under D-S1-02 24-hour window or authorized administrative override.
     *
     * @param  list<array{student_id: int, mark: AttendanceMark|string, remarks?: string|null}>  $correctedStudentMarks
     *
     * @throws ValidationException
     */
    public function correctMarks(
        AttendanceSession $session,
        array $correctedStudentMarks,
        User $editor,
        bool $isOverride = false,
        ?string $overrideReason = null,
        ?DateTimeInterface $now = null
    ): AttendanceSession {
        return DB::transaction(function () use ($session, $correctedStudentMarks, $editor, $isOverride, $overrideReason, $now) {
            /** @var AttendanceSession $lockedSession */
            $lockedSession = AttendanceSession::where('id', $session->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedSession->isClosed()) {
                throw ValidationException::withMessages([
                    'status' => ['Closed attendance sessions cannot be modified.'],
                ]);
            }

            if (! $lockedSession->isTeacherEditable($now)) {
                // Window expired: check administrative override authorization
                if (! $isOverride) {
                    throw ValidationException::withMessages([
                        'submitted_at' => ['The 24-hour teacher correction window has expired. An authorized administrative override with reason is required.'],
                    ]);
                }

                // Verify administrative authorization
                if (! $editor->hasRole('superadmin')) {
                    throw ValidationException::withMessages([
                        'authorization' => ['Only users with the superadmin role are authorized to execute an administrative override.'],
                    ]);
                }

                // Verify non-empty reason
                if (empty(trim((string) $overrideReason)) || strlen(trim((string) $overrideReason)) < 5) {
                    throw ValidationException::withMessages([
                        'override_reason' => ['A meaningful override reason (minimum 5 characters) is required for administrative overrides.'],
                    ]);
                }
            }

            if (empty($correctedStudentMarks)) {
                throw ValidationException::withMessages([
                    'marks' => ['At least one student mark must be provided for correction.'],
                ]);
            }

            $existingRecords = SessionStudentRecord::where('attendance_session_id', $lockedSession->id)
                ->get()
                ->keyBy('student_id');

            $previousState = [];
            $newState = [];
            $processedStudentIds = [];

            foreach ($correctedStudentMarks as $index => $item) {
                $studentId = (int) ($item['student_id'] ?? 0);

                if (in_array($studentId, $processedStudentIds, true)) {
                    throw ValidationException::withMessages([
                        "marks.{$index}.student_id" => ["Duplicate student ID {$studentId} in correction payload."],
                    ]);
                }
                $processedStudentIds[] = $studentId;

                /** @var SessionStudentRecord|null $existingRecord */
                $existingRecord = $existingRecords->get($studentId);

                if (! $existingRecord) {
                    throw ValidationException::withMessages([
                        "marks.{$index}.student_id" => ["Student ID {$studentId} does not have an existing attendance record in this session."],
                    ]);
                }

                $newMark = $this->parseMark($item['mark'] ?? null, "marks.{$index}.mark");

                $previousState[] = [
                    'student_id' => $studentId,
                    'mark' => $existingRecord->mark->value,
                    'remarks' => $existingRecord->remarks,
                ];

                $existingRecord->update([
                    'mark' => $newMark,
                    'remarks' => array_key_exists('remarks', $item) ? $item['remarks'] : $existingRecord->remarks,
                    'marked_by' => $editor->id,
                    'marked_at' => now(),
                ]);

                $newState[] = [
                    'student_id' => $studentId,
                    'mark' => $newMark->value,
                    'remarks' => $existingRecord->fresh()->remarks,
                ];
            }

            // Write Immutable Audit Log
            AttendanceAuditLog::create([
                'attendance_session_id' => $lockedSession->id,
                'actor_id' => $editor->id,
                'action' => AttendanceAuditAction::MarkCorrected,
                'previous_state' => ['marks' => $previousState],
                'new_state' => [
                    'marks' => $newState,
                    'is_override' => $isOverride,
                    'override_reason' => $overrideReason,
                ],
                'created_at' => now(),
            ]);

            return $lockedSession->fresh(['studentRecords', 'teacherRecords', 'auditLogs']);
        });
    }

    /**
     * Permanently close a submitted session.
     *
     * @throws ValidationException
     */
    public function closeSession(AttendanceSession $session, User $closer): AttendanceSession
    {
        return DB::transaction(function () use ($session, $closer) {
            /** @var AttendanceSession $lockedSession */
            $lockedSession = AttendanceSession::where('id', $session->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedSession->isClosed()) {
                throw ValidationException::withMessages([
                    'status' => ['The attendance session is already closed.'],
                ]);
            }

            if ($lockedSession->isDraft()) {
                throw ValidationException::withMessages([
                    'status' => ['Draft sessions cannot be closed directly. Submit the session first.'],
                ]);
            }

            $closureTime = now();
            $lockedSession->update([
                'status' => AttendanceStatus::Closed,
                'closed_at' => $closureTime,
            ]);

            AttendanceAuditLog::create([
                'attendance_session_id' => $lockedSession->id,
                'actor_id' => $closer->id,
                'action' => AttendanceAuditAction::SessionClosed,
                'previous_state' => ['status' => AttendanceStatus::Submitted->value],
                'new_state' => [
                    'status' => AttendanceStatus::Closed->value,
                    'closed_at' => $closureTime->toIso8601String(),
                ],
                'created_at' => $closureTime,
            ]);

            return $lockedSession->fresh(['studentRecords', 'teacherRecords', 'auditLogs']);
        });
    }

    /**
     * Resolve expected students for a session and optional section using Stage 0 enrollment service.
     */
    public function resolveExpectedStudents(AttendanceSession $session, ?string $section = null): Collection
    {
        if ($section !== null) {
            return $this->enrollmentService->getRosterForDate(
                $session->class_id,
                trim($section),
                $session->date
            );
        }

        // Whole-class fallback: query active enrollments across all sections on the session date
        $dateStr = $session->date->toDateString();

        return Member::query()
            ->join('student_enrollments as e', 'e.member_id', '=', 'members.id')
            ->where('e.class_id', $session->class_id)
            ->whereDate('e.start_date', '<=', $dateStr)
            ->where(function ($query) use ($dateStr) {
                $query->whereNull('e.end_date')
                    ->orWhereDate('e.end_date', '>', $dateStr);
            })
            ->whereNull('members.deleted_at')
            ->select('members.*', 'e.start_date as enrollment_start_date', 'e.end_date as enrollment_end_date', 'e.section as enrollment_section')
            ->orderBy('members.id')
            ->get();
    }

    /**
     * Parse and validate an attendance mark into AttendanceMark enum.
     *
     * @throws ValidationException
     */
    protected function parseMark(mixed $value, string $fieldKey): AttendanceMark
    {
        if ($value instanceof AttendanceMark) {
            return $value;
        }

        if (is_string($value)) {
            $parsed = AttendanceMark::tryFrom($value);
            if ($parsed !== null) {
                return $parsed;
            }
        }

        throw ValidationException::withMessages([
            $fieldKey => ['Invalid attendance mark. Allowed values: present, absent, late, excused.'],
        ]);
    }

    /**
     * Retrieve a date-filtered attendance summary and absentee list scoped to user visibility.
     *
     * @return array{
     *     date: string,
     *     class_id: int|null,
     *     total_sessions: int,
     *     submitted_sessions: int,
     *     counts: array{present: int, absent: int, late: int, excused: int, total: int},
     *     attendance_rate: float,
     *     absentees: list<array<string, mixed>>
     * }
     */
    public function getAttendanceSummary(
        string $date,
        ?int $classId = null,
        ?User $user = null
    ): array {
        $parsedDate = Carbon::parse($date)->toDateString();

        $sessionQuery = AttendanceSession::query()->whereDate('date', $parsedDate);

        if ($classId !== null) {
            $sessionQuery->where('class_id', $classId);
        }

        // Apply role scoping if teacher
        if ($user && ! ($user->hasRole('superadmin') || $user->hasRole(['academic_director', 'academic_administrator']))) {
            $sessionQuery->where(function ($q) use ($user, $parsedDate) {
                $q->whereExists(function ($sub) use ($user, $parsedDate) {
                    $sub->selectRaw(1)
                        ->from('teaching_assignments')
                        ->where('teacher_id', $user->id)
                        ->whereColumn('teaching_assignments.class_id', 'attendance_sessions.class_id')
                        ->where(function ($cq) {
                            $cq->whereNull('attendance_sessions.course_id')
                                ->orWhereColumn('teaching_assignments.course_id', 'attendance_sessions.course_id');
                        })
                        ->where(function ($tq) use ($parsedDate) {
                            $tq->whereNull('teaching_assignments.start_date')
                                ->orWhereDate('teaching_assignments.start_date', '<=', $parsedDate);
                        })
                        ->where(function ($tq) use ($parsedDate) {
                            $tq->whereNull('teaching_assignments.end_date')
                                ->orWhereDate('teaching_assignments.end_date', '>', $parsedDate);
                        });
                });
            });
        }

        $sessions = $sessionQuery->with(['schoolClass', 'course'])->get();
        $totalSessions = $sessions->count();
        $submittedSessions = $sessions->where('status', AttendanceStatus::Submitted)->count()
            + $sessions->where('status', AttendanceStatus::Closed)->count();

        $sessionIds = $sessions->pluck('id')->all();

        $counts = [
            'present' => 0,
            'absent' => 0,
            'late' => 0,
            'excused' => 0,
            'total' => 0,
        ];
        $absentees = [];

        if (! empty($sessionIds)) {
            $records = SessionStudentRecord::whereIn('attendance_session_id', $sessionIds)
                ->with(['student', 'attendanceSession.schoolClass', 'attendanceSession.course'])
                ->get();

            foreach ($records as $record) {
                $markVal = $record->mark instanceof AttendanceMark ? $record->mark->value : (string) $record->mark;
                if (isset($counts[$markVal])) {
                    $counts[$markVal]++;
                }
                $counts['total']++;

                if ($markVal === AttendanceMark::Absent->value) {
                    $student = $record->student;
                    $absentees[] = [
                        'student_id' => $record->student_id,
                        'student_name' => $student?->name ?? trim(($student?->first_name ?? '') . ' ' . ($student?->last_name ?? '')) ?: "Student #{$record->student_id}",
                        'class_id' => $record->attendanceSession?->class_id,
                        'class_name' => $record->attendanceSession?->schoolClass?->name ?? $record->attendanceSession?->schoolClass?->code,
                        'course_id' => $record->attendanceSession?->course_id,
                        'course_title' => $record->attendanceSession?->course?->name ?? $record->attendanceSession?->course?->code ?? 'Homeroom',
                        'session_id' => $record->attendance_session_id,
                        'remarks' => $record->remarks,
                    ];
                }
            }
        }

        $rate = $counts['total'] > 0
            ? round((($counts['present'] + $counts['late']) / $counts['total']) * 100, 2)
            : 0.0;

        return [
            'date' => $parsedDate,
            'class_id' => $classId,
            'total_sessions' => $totalSessions,
            'submitted_sessions' => $submittedSessions,
            'counts' => $counts,
            'attendance_rate' => $rate,
            'absentees' => $absentees,
        ];
    }
}

