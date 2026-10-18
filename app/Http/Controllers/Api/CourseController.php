<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CourseRequest;
use App\Http\Resources\CourseResource;
use App\Models\Course;
use App\Services\CourseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class CourseController extends Controller
{
    public function __construct(protected CourseService $courseService) {}

    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Course::class);

        return CourseResource::collection($this->courseService->paginate());
    }

    public function store(CourseRequest $request): JsonResponse
    {
        $this->authorize('create', Course::class);
        $course = $this->courseService->create($request->validated());

        return response()->json(['data' => CourseResource::make($course)], 201);
    }

    public function show(Course $course): CourseResource
    {
        $this->authorize('view', $course);

        return CourseResource::make($this->courseService->find($course));
    }

    public function update(CourseRequest $request, Course $course): array
    {
        $this->authorize('update', $course);
        $updatedCourse = $this->courseService->update($course, $request->validated());

        return ['data' => CourseResource::make($updatedCourse)];
    }

    public function destroy(Course $course): Response
    {
        $this->authorize('delete', $course);
        $this->courseService->delete($course);

        return response()->noContent();
    }
}
