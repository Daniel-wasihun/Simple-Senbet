<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class TeachingAssignmentResource extends BaseJsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'teacher_id' => $this->teacher_id,
            'teacher' => $this->whenLoaded('teacher', function () {
                return [
                    'id' => $this->teacher->id,
                    'name' => $this->teacher->name,
                    'email' => $this->teacher->email,
                ];
            }),
            'class_id' => $this->class_id,
            'class' => new SchoolClassResource($this->whenLoaded('schoolClass')),
            'course_id' => $this->course_id,
            'course' => new CourseResource($this->whenLoaded('course')),
            'academic_year_id' => $this->academic_year_id,
            'academic_year' => new AcademicYearResource($this->whenLoaded('academicYear')),
            'section' => $this->section,
            'semester' => $this->semester?->value ?? $this->semester,
            'is_primary' => (bool) $this->is_primary,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
