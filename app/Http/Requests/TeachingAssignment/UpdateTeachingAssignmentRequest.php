<?php

namespace App\Http\Requests\TeachingAssignment;

use App\Enums\Semester;
use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateTeachingAssignmentRequest extends BaseRequest
{
    public function authorize(): bool { return $this->authorizePolicy('update', \App\Models\TeachingAssignment::class, 'teachingAssignment'); }

    public function rules(): array
    {
        return [
            'teacher_id' => ['sometimes', 'integer', 'exists:users,id'],
            'course_id' => ['sometimes', 'integer', 'exists:courses,id'],
            'academic_year_id' => ['sometimes', 'integer', 'exists:academic_years,id'],
            'semester' => ['sometimes', new Enum(Semester::class)],
        ];
    }
}
