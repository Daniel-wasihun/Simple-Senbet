<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AssessmentRequest;
use App\Http\Resources\AssessmentResource;
use App\Models\Assessment;
use App\Services\AssessmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class AssessmentController extends Controller
{
    public function __construct(protected AssessmentService $assessmentService) {}

    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Assessment::class);

        return AssessmentResource::collection($this->assessmentService->paginate());
    }

    public function store(AssessmentRequest $request): JsonResponse
    {
        $this->authorize('create', Assessment::class);
        $assessment = $this->assessmentService->create($request->validated());

        return response()->json(['data' => AssessmentResource::make($assessment)], 201);
    }

    public function show(Assessment $assessment): AssessmentResource
    {
        $this->authorize('view', $assessment);

        return AssessmentResource::make($this->assessmentService->find($assessment));
    }

    public function update(AssessmentRequest $request, Assessment $assessment): array
    {
        $this->authorize('update', $assessment);
        $updatedAssessment = $this->assessmentService->update($assessment, $request->validated());

        return ['data' => AssessmentResource::make($updatedAssessment)];
    }

    public function destroy(Assessment $assessment): Response
    {
        $this->authorize('delete', $assessment);
        $this->assessmentService->delete($assessment);

        return response()->noContent();
    }
}
