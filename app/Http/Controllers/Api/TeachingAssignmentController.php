<?php

namespace App\Http\Controllers\Api;

use App\Enums\Semester;
use App\Http\Controllers\Controller;
use App\Http\Resources\TeachingAssignmentResource;
use App\Http\Responses\ApiResponse;
use App\Models\AcademicYear;
use App\Models\TeachingAssignment;
use App\Services\TeachingAssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TeachingAssignmentController extends Controller
{
    public function __construct(
        protected TeachingAssignmentService $assignmentService
    ) {}

    /**
     * List teaching assignments, scoped by role and filterable by criteria.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', TeachingAssignment::class);

        $user = $request->user();
        $isSuperAdmin = $user->hasRole('superadmin') || $user->primaryRole?->name === 'superadmin' || ($user->role ?? null) === 'superadmin';
        $isAdmin = $isSuperAdmin || ! $user->hasRole('teacher') || $user->hasRole('admin');

        $query = TeachingAssignment::with(['teacher', 'schoolClass', 'course', 'academicYear', 'assessments']);

        // Non-admin teachers can only view their own assignments
        if (! $isAdmin) {
            $query->where('teacher_id', $user->id);
        } elseif ($request->filled('teacher_id')) {
            $query->where('teacher_id', (int) $request->query('teacher_id'));
        }

        if ($request->filled('class_id')) {
            $query->where('class_id', (int) $request->query('class_id'));
        }

        if ($request->filled('course_id')) {
            $query->where('course_id', (int) $request->query('course_id'));
        }

        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', (int) $request->query('academic_year_id'));
        }

        if ($request->filled('section')) {
            $query->where('section', (string) $request->query('section'));
        }

        if ($request->filled('semester')) {
            $query->where('semester', (string) $request->query('semester'));
        }

        if ($request->boolean('active_only')) {
            $query->activeForDate(now()->toDateString());
        }

        $perPage = min((int) $request->query('per_page', 25), 100);
        if ($perPage < 1) {
            $perPage = 25;
        }

        $paginator = $query->orderByDesc('id')->paginate($perPage);

        return ApiResponse::paginated(
            $paginator->setCollection(TeachingAssignmentResource::collection($paginator->getCollection())->collection),
            'Teaching assignments retrieved successfully'
        );
    }

    /**
     * Create a new teaching assignment.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', TeachingAssignment::class);

        $validated = $request->validate([
            'teacher_id' => ['required', 'integer', 'exists:users,id'],
            'academic_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
            'class_id' => ['nullable', 'integer', 'exists:classes,id'],
            'section' => ['nullable', 'string', 'max:20'],
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'semester' => ['required', Rule::enum(Semester::class)],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'is_primary' => ['sometimes', 'boolean'],
        ]);

        $course = \App\Models\Course::findOrFail((int) $validated['course_id']);
        $classId = (int) ($validated['class_id'] ?? $course->class_id);
        $section = (string) ($validated['section'] ?? 'A');

        $academicYearId = (int) ($validated['academic_year_id'] ?? 0);
        if ($academicYearId <= 0) {
            $currentYear = AcademicYear::where('is_current', true)->first()
                ?? AcademicYear::latest('id')->first();
            if (! $currentYear) {
                $currentYear = AcademicYear::create([
                    'name' => ['en' => 'Academic Year ' . date('Y'), 'am' => 'የትምህርት ዘመን ' . date('Y')],
                    'start_date' => date('Y-01-01'),
                    'end_date' => date('Y-12-31'),
                    'is_current' => true,
                ]);
            }
            $academicYearId = $currentYear->id;
        }

        $assignment = $this->assignmentService->assign(
            teacherId: (int) $validated['teacher_id'],
            academicYearId: $academicYearId,
            classId: $classId,
            section: $section,
            courseId: (int) $validated['course_id'],
            semester: $validated['semester'],
            startDate: $validated['start_date'] ?? null,
            endDate: $validated['end_date'] ?? null,
            isPrimary: (bool) ($validated['is_primary'] ?? false)
        );

        $assignment->load(['teacher', 'schoolClass', 'course', 'academicYear']);

        return ApiResponse::created(
            new TeachingAssignmentResource($assignment),
            'Teaching assignment created successfully'
        );
    }

    /**
     * Show a specific teaching assignment.
     */
    public function show(Request $request, TeachingAssignment $teachingAssignment): JsonResponse
    {
        $this->authorize('view', $teachingAssignment);

        $teachingAssignment->load(['teacher', 'schoolClass', 'course', 'academicYear', 'assessments']);

        return ApiResponse::success(
            new TeachingAssignmentResource($teachingAssignment),
            'Teaching assignment retrieved successfully'
        );
    }

    /**
     * End an active teaching assignment.
     */
    public function end(Request $request, TeachingAssignment $teachingAssignment): JsonResponse
    {
        $this->authorize('end', $teachingAssignment);

        $validated = $request->validate([
            'end_date' => ['required', 'date'],
        ]);

        $assignment = $this->assignmentService->endAssignment($teachingAssignment->id, $validated['end_date']);
        $assignment->load(['teacher', 'schoolClass', 'course', 'academicYear']);

        return ApiResponse::success(
            new TeachingAssignmentResource($assignment),
            'Teaching assignment ended successfully'
        );
    }

    /**
     * Delete a teaching assignment.
     */
    public function destroy(Request $request, TeachingAssignment $teachingAssignment): JsonResponse
    {
        $this->authorize('delete', $teachingAssignment);

        $teachingAssignment->delete();

        return ApiResponse::success(null, 'Teaching assignment deleted successfully');
    }

    /**
     * Query expected teachers assigned to a class, section, and course on a given date.
     */
    public function expectedTeachers(Request $request): JsonResponse
    {
        $this->authorize('viewAny', TeachingAssignment::class);

        $validated = $request->validate([
            'class_id' => ['required', 'integer', 'exists:classes,id'],
            'section' => ['required', 'string', 'max:20'],
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'semester' => ['required', Rule::enum(Semester::class)],
            'date' => ['required', 'date'],
        ]);

        $teachers = $this->assignmentService->getExpectedTeachersForDate(
            classId: (int) $validated['class_id'],
            section: (string) $validated['section'],
            courseId: (int) $validated['course_id'],
            semester: $validated['semester'],
            date: (string) $validated['date']
        );

        return ApiResponse::success(
            TeachingAssignmentResource::collection($teachers),
            'Expected teachers retrieved successfully'
        );
    }
}
