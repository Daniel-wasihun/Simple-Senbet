<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SchoolClassRequest;
use App\Http\Resources\SchoolClassResource;
use App\Models\SchoolClass;
use App\Services\SchoolClassService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class SchoolClassController extends Controller
{
    public function __construct(protected SchoolClassService $classService) {}

    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', SchoolClass::class);

        return SchoolClassResource::collection($this->classService->paginate());
    }

    public function store(SchoolClassRequest $request): JsonResponse
    {
        $this->authorize('create', SchoolClass::class);
        $class = $this->classService->create($request->validated());

        return response()->json(['data' => SchoolClassResource::make($class)], 201);
    }

    public function show(SchoolClass $schoolClass): SchoolClassResource
    {
        $this->authorize('view', $schoolClass);

        return SchoolClassResource::make($this->classService->find($schoolClass));
    }

    public function update(SchoolClassRequest $request, SchoolClass $schoolClass): array
    {
        $this->authorize('update', $schoolClass);
        $updatedClass = $this->classService->update($schoolClass, $request->validated());

        return ['data' => SchoolClassResource::make($updatedClass)];
    }

    public function destroy(SchoolClass $schoolClass): Response
    {
        $this->authorize('delete', $schoolClass);
        $this->classService->delete($schoolClass);

        return response()->noContent();
    }
}
