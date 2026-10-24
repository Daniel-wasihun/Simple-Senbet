<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Promotion\PromotionCommitRequest;
use App\Http\Requests\Promotion\PromotionDryRunRequest;
use App\Http\Responses\ApiResponse;
use App\Models\AcademicYear;
use App\Models\Member;
use App\Services\PromotionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PromotionController extends Controller
{
    public function __construct(protected PromotionService $promotionService) {}

    /**
     * Evaluate a single student's promotion status for an academic year.
     */
    public function evaluateStudent(Request $request, Member $student): JsonResponse
    {
        $this->authorize('promotion.evaluate-student', $student);

        // 2. Resolve Academic Year
        $academicYearId = (int) $request->query('academic_year_id');
        if (! $academicYearId) {
            $currentYear = AcademicYear::where('is_current', true)->first();
            $academicYearId = (int) ($currentYear?->id ?? AcademicYear::latest('id')->firstOrFail()->id);
        }

        $evaluationMode = (string) $request->query('evaluation_mode', 'annual');

        $evaluation = $this->promotionService->evaluateStudent($student->id, $academicYearId, $evaluationMode);

        return ApiResponse::success($evaluation, 'Student promotion evaluation calculated successfully.');
    }

    /**
     * Run a dry-run promotion simulation across an academic year cohort without modifying the database.
     */
    public function dryRun(PromotionDryRunRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $simulation = $this->promotionService->dryRunPromotion(
            (int) $validated['current_academic_year_id'],
            (int) $validated['next_academic_year_id'],
            isset($validated['class_id']) ? (int) $validated['class_id'] : null,
            (string) ($validated['evaluation_mode'] ?? 'annual'),
            $validated['class_mappings'] ?? []
        );

        return ApiResponse::success($simulation, 'Promotion simulation executed successfully.');
    }

    /**
     * Commit the year-end promotion and retention rollover atomically.
     */
    public function commit(PromotionCommitRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $result = $this->promotionService->commitPromotion(
            (int) $validated['current_academic_year_id'],
            (int) $validated['next_academic_year_id'],
            isset($validated['class_id']) ? (int) $validated['class_id'] : null,
            (string) ($validated['evaluation_mode'] ?? 'annual'),
            $validated['class_mappings'] ?? [],
            $validated['overrides'] ?? []
        );

        return ApiResponse::success($result, 'Year-end promotion and retention committed successfully.');
    }
}
