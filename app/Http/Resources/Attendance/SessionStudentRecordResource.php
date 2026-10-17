<?php

namespace App\Http\Resources\Attendance;

use App\Http\Resources\BaseJsonResource;
use Illuminate\Http\Request;

class SessionStudentRecordResource extends BaseJsonResource
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
            'attendance_session_id' => $this->attendance_session_id,
            'student_id' => $this->student_id,
            'mark' => $this->mark?->value ?? (string) $this->mark,
            'remarks' => $this->remarks,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'student' => $this->whenLoaded('student', function () {
                return [
                    'id' => $this->student->id,
                    'full_name' => $this->student->full_name,
                ];
            }),
        ];
    }
}
