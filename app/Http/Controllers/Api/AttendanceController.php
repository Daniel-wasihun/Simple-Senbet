<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Attendance\CorrectAttendanceMarksRequest;
use App\Http\Requests\Attendance\CreateAttendanceSessionRequest;
use App\Http\Requests\Attendance\SubmitAttendanceSessionRequest;
use App\Http\Resources\Attendance\AttendanceSessionResource;
use App\Http\Responses\ApiResponse;
use App\Models\AttendanceSession;
use App\Services\AttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function __construct(
        protected AttendanceService $attendanceService
    ) {}

    /**
     * Create a new draft attendance session.
     */
    public function store(CreateAttendanceSessionRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $session = $this->attendanceService->createSession(
            academicYearId: (int) $validated['academic_year_id'],
            termId: (int) $validated['term_id'],
            classId: (int) $validated['class_id'],
            courseId: isset($validated['course_id']) ? (int) $validated['course_id'] : null,
            date: (string) $validated['date'],
            timeSlot: (string) $validated['time_slot'],
            creatorId: $request->user()?->id,
        );

        $session->load(['schoolClass', 'course', 'academicYear']);

        return ApiResponse::created(
            new AttendanceSessionResource($session),
            'Attendance session created successfully'
        );
    }

    /**
     * List attendance sessions accessible to the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AttendanceSession::class);

        $user = $request->user();
        $query = AttendanceSession::query();

        // 1. Scoped query visibility: non-admins only see sessions for classes/courses they teach
        if (! ($user->hasRole('superadmin') || $user->hasRole(['academic_director', 'academic_administrator']))) {
            $query->where(function ($q) use ($user) {
                $q->whereExists(function ($sub) use ($user) {
                    $sub->selectRaw(1)
                        ->from('teaching_assignments')
                        ->where('teacher_id', $user->id)
                        ->whereColumn('teaching_assignments.class_id', 'attendance_sessions.class_id')
                        ->where(function ($cq) {
                            $cq->whereNull('attendance_sessions.course_id')
                               ->orWhereColumn('teaching_assignments.course_id', 'attendance_sessions.course_id');
                        })
                        ->where(function ($tq) {
                            $tq->whereNull('teaching_assignments.start_date')
                               ->orWhereColumn('teaching_assignments.start_date', '<=', 'attendance_sessions.date');
                        })
                        ->where(function ($tq) {
                            $tq->whereNull('teaching_assignments.end_date')
                               ->orWhereColumn('teaching_assignments.end_date', '>', 'attendance_sessions.date');
                        });
                });
            });
        }

        // 2. Optional filters
        if ($request->filled('date')) {
            $query->whereDate('date', (string) $request->query('date'));
        }

        if ($request->filled('class_id')) {
            $query->where('class_id', (int) $request->query('class_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', (string) $request->query('status'));
        }

        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', (int) $request->query('academic_year_id'));
        }

        // 3. Eager load and paginate
        $perPage = min((int) $request->query('per_page', 15), 100);
        if ($perPage < 1) {
            $perPage = 15;
        }

        $paginator = $query->with(['schoolClass', 'course', 'academicYear'])
            ->orderByDesc('date')
            ->orderBy('time_slot')
            ->orderBy('id')
            ->paginate($perPage);

        // Transform paginated collection through AttendanceSessionResource
        $transformedCollection = AttendanceSessionResource::collection($paginator->getCollection())->collection;
        $paginator->setCollection($transformedCollection);

        return ApiResponse::paginated($paginator, 'Attendance sessions retrieved successfully');
    }

    /**
     * View details of a specific attendance session.
     */
    public function show(Request $request, AttendanceSession $session): JsonResponse
    {
        $this->authorize('view', $session);

        $session->load([
            'schoolClass',
            'course',
            'academicYear',
            'studentRecords.student',
            'teacherRecords.teacher',
        ]);

        return ApiResponse::success(
            new AttendanceSessionResource($session),
            'Attendance session retrieved successfully'
        );
    }

    /**
     * Submit an attendance session roster.
     */
    public function submit(SubmitAttendanceSessionRequest $request, AttendanceSession $session): JsonResponse
    {
        $submittedSession = $this->attendanceService->submitSession(
            session: $session,
            studentMarks: $request->getStudentMarks(),
            teacherMarks: $request->getTeacherMarks(),
            submitter: $request->user(),
            section: $request->getSection(),
            semester: $request->getSemester(),
        );

        $submittedSession->load([
            'schoolClass',
            'course',
            'academicYear',
            'studentRecords',
            'teacherRecords',
        ]);

        return ApiResponse::success(
            new AttendanceSessionResource($submittedSession),
            'Attendance session submitted successfully'
        );
    }

    /**
     * Correct attendance marks for a submitted session.
     */
    public function correct(CorrectAttendanceMarksRequest $request, AttendanceSession $session): JsonResponse
    {
        $updatedSession = $this->attendanceService->correctMarks(
            session: $session,
            correctedStudentMarks: $request->getCorrectedStudentMarks(),
            editor: $request->user(),
            isOverride: $request->isOverride(),
            overrideReason: $request->getOverrideReason(),
        );

        $updatedSession->load([
            'schoolClass',
            'course',
            'academicYear',
            'studentRecords',
            'teacherRecords',
        ]);

        return ApiResponse::success(
            new AttendanceSessionResource($updatedSession),
            'Attendance marks corrected successfully'
        );
    }

    /**
     * Permanently close an attendance session.
     */
    public function close(Request $request, AttendanceSession $session): JsonResponse
    {
        $this->authorize('close', $session);

        $closedSession = $this->attendanceService->closeSession(
            session: $session,
            closer: $request->user(),
        );

        $closedSession->load([
            'schoolClass',
            'course',
            'academicYear',
            'studentRecords',
            'teacherRecords',
        ]);

        return ApiResponse::success(
            new AttendanceSessionResource($closedSession),
            'Attendance session closed successfully'
        );
    }
}
