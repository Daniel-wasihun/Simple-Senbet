<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\HandlesCachedCrud;
use App\Http\Controllers\Controller;
use App\Http\Resources\CourseResource;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CourseController extends Controller
{
    use HandlesCachedCrud;

    private function rules(?Course $course = null): array
    {
        return ['name' => ['required', 'string', 'max:255'], 'code' => ['required', 'string', 'max:50', Rule::unique('courses')->ignore($course?->id)], 'description' => ['nullable', 'string'], 'credit_hour' => ['required', 'integer', 'min:1'], 'class_id' => ['required', 'exists:classes,id']];
    }

    public function index()
    {
        return $this->indexCrud(Course::class, CourseResource::class, ['schoolClass'], true);
    }

    public function store(Request $r)
    {
        return $this->storeCrud($r, Course::class, CourseResource::class, $this->rules(), ['schoolClass'], true);
    }

    public function show(Course $course)
    {
        return $this->showCrud($course, CourseResource::class, ['schoolClass'], true);
    }

    public function update(Request $r, Course $course)
    {
        return $this->updateCrud($r, $course, CourseResource::class, $this->rules($course), ['schoolClass'], true);
    }

    public function destroy(Course $course)
    {
        return $this->destroyCrud($course, true);
    }
}
