<?php

namespace App\Http\Resources\Attendance;

use App\Http\Resources\BaseJsonResource;
use Illuminate\Http\Request;

class AttendanceSessionResource extends BaseJsonResource
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
            'academic_year_id' => $this->academic_year_id,
            'term_id' => $this->term_id,
            'class_id' => $this->class_id,
            'course_id' => $this->course_id,
            'date' => $this->date?->format('Y-m-d') ?? (string) $this->date,
            'time_slot' => $this->time_slot,
            'status' => $this->status?->value ?? (string) $this->status,
            'submitted_by' => $this->submitted_by,
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'closed_at' => $this->closed_at?->toIso8601String(),
            'is_draft' => $this->isDraft(),
            'is_closed' => $this->isClosed(),
            'is_teacher_editable' => $this->isTeacherEditable(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),

            'academic_year' => $this->whenLoaded('academicYear', function () {
                return [
                    'id' => $this->academicYear->id,
                    'name' => $this->academicYear->name,
                ];
            }),
            'school_class' => $this->whenLoaded('schoolClass', function () {
                return [
                    'id' => $this->schoolClass->id,
                    'name' => $this->schoolClass->name,
                    'code' => $this->schoolClass->code,
                ];
            }),
            'course' => $this->whenLoaded('course', function () {
                return $this->course ? [
                    'id' => $this->course->id,
                    'name' => $this->course->name,
                    'code' => $this->course->code,
                ] : null;
            }),
            'student_records' => SessionStudentRecordResource::collection($this->whenLoaded('studentRecords')),
            'teacher_records' => SessionTeacherRecordResource::collection($this->whenLoaded('teacherRecords')),
        ];
    }
}
