<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MemberResource;
use App\Http\Resources\StudentEnrollmentResource;
use App\Http\Responses\ApiResponse;
use App\Models\Member;
use App\Models\StudentEnrollment;
use App\Services\StudentEnrollmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentEnrollmentController extends Controller
{
    public function __construct(
        protected StudentEnrollmentService $enrollmentService
    ) {}

    /**
     * List student enrollments with filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', StudentEnrollment::class);

        $query = StudentEnrollment::with(['member', 'schoolClass', 'academicYear']);

        if ($request->filled('member_id')) {
            $query->where('member_id', (int) $request->query('member_id'));
        }

        if ($request->filled('class_id')) {
            $query->where('class_id', (int) $request->query('class_id'));
        }

        if ($request->filled('section')) {
            $query->where('section', (string) $request->query('section'));
        }

        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', (int) $request->query('academic_year_id'));
        }

        if ($request->boolean('active_only')) {
            $query->active();
        }

        $perPage = min((int) $request->query('per_page', 25), 100);
        if ($perPage < 1) {
            $perPage = 25;
        }

        $paginator = $query->orderByDesc('id')->paginate($perPage);

        return ApiResponse::paginated(
            $paginator->setCollection(StudentEnrollmentResource::collection($paginator->getCollection())->collection),
            'Student enrollments retrieved successfully'
        );
    }

    /**
     * Enroll a student into a class and section.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', StudentEnrollment::class);

        $validated = $request->validate([
            'member_id' => ['required', 'integer', 'exists:members,id'],
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'class_id' => ['required', 'integer', 'exists:classes,id'],
            'section' => ['required', 'string', 'max:20'],
            'start_date' => ['required', 'date'],
        ]);

        $enrollment = $this->enrollmentService->enroll(
            memberId: (int) $validated['member_id'],
            academicYearId: (int) $validated['academic_year_id'],
            classId: (int) $validated['class_id'],
            section: (string) $validated['section'],
            startDate: (string) $validated['start_date']
        );

        $enrollment->load(['member', 'schoolClass', 'academicYear']);

        return ApiResponse::created(
            new StudentEnrollmentResource($enrollment),
            'Student enrolled successfully'
        );
    }

    /**
     * Show a specific enrollment record.
     */
    public function show(Request $request, StudentEnrollment $enrollment): JsonResponse
    {
        $this->authorize('view', $enrollment);

        $enrollment->load(['member', 'schoolClass', 'academicYear']);

        return ApiResponse::success(
            new StudentEnrollmentResource($enrollment),
            'Enrollment record retrieved successfully'
        );
    }

    /**
     * Transfer an enrolled student to a new class/section.
     */
    public function transfer(Request $request, Member $member): JsonResponse
    {
        $this->authorize('transfer', StudentEnrollment::class);

        $validated = $request->validate([
            'new_class_id' => ['required', 'integer', 'exists:classes,id'],
            'new_section' => ['required', 'string', 'max:20'],
            'transfer_date' => ['required', 'date'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $newEnrollment = $this->enrollmentService->transfer(
            memberId: $member->id,
            newClassId: (int) $validated['new_class_id'],
            newSection: (string) $validated['new_section'],
            transferDate: (string) $validated['transfer_date'],
            reason: $validated['reason'] ?? null
        );

        $newEnrollment->load(['member', 'schoolClass', 'academicYear']);

        return ApiResponse::success(
            new StudentEnrollmentResource($newEnrollment),
            'Student transferred successfully'
        );
    }

    /**
     * Withdraw a student from active enrollment.
     */
    public function withdraw(Request $request, Member $member): JsonResponse
    {
        $this->authorize('withdraw', StudentEnrollment::class);

        $validated = $request->validate([
            'withdrawal_date' => ['required', 'date'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $withdrawnEnrollment = $this->enrollmentService->withdraw(
            memberId: $member->id,
            withdrawalDate: (string) $validated['withdrawal_date'],
            reason: $validated['reason'] ?? null
        );

        $withdrawnEnrollment->load(['member', 'schoolClass', 'academicYear']);

        return ApiResponse::success(
            new StudentEnrollmentResource($withdrawnEnrollment),
            'Student withdrawn successfully'
        );
    }

    /**
     * Resolve active student roster for a class and section on a specific date.
     */
    public function roster(Request $request): JsonResponse
    {
        $this->authorize('viewAny', StudentEnrollment::class);

        $validated = $request->validate([
            'class_id' => ['required', 'integer', 'exists:classes,id'],
            'section' => ['required', 'string', 'max:20'],
            'date' => ['required', 'date'],
        ]);

        $students = $this->enrollmentService->getRosterForDate(
            classId: (int) $validated['class_id'],
            section: (string) $validated['section'],
            date: (string) $validated['date']
        );

        return ApiResponse::success(
            MemberResource::collection($students),
            'Active roster retrieved successfully'
        );
    }
}
