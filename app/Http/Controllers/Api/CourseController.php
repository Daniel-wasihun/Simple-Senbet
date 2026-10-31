<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CourseRequest;
use App\Http\Resources\CourseResource;
use App\Models\Course;
use App\Services\CourseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class CourseController extends Controller
{
    public function __construct(protected CourseService $courseService) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Course::class);

        $perPage = min(max($request->integer('per_page', 20), 1), 250);
        $query = Course::query()->with(['schoolClass']);

        if ($request->filled('class_id') && $request->input('class_id') !== 'all') {
            $query->where('class_id', $request->input('class_id'));
        }

        if ($request->filled('search')) {
            $term = $request->string('search')->trim();
            $query->where(function ($q) use ($term) {
                $q->where('code', 'like', "%{$term}%")
                  ->orWhere('name->en', 'like', "%{$term}%")
                  ->orWhere('name->am', 'like', "%{$term}%")
                  ->orWhere('name->om', 'like', "%{$term}%")
                  ->orWhere('name', 'like', "%{$term}%")
                  ->orWhere('description->en', 'like', "%{$term}%")
                  ->orWhere('description->am', 'like', "%{$term}%")
                  ->orWhere('description->om', 'like', "%{$term}%");
            });
        }

        if ($request->boolean('all')) {
            return CourseResource::collection($query->latest()->get());
        }

        return CourseResource::collection($query->latest()->paginate($perPage));
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
