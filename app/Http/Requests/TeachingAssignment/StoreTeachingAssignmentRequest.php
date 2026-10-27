<?php

namespace App\Http\Requests\TeachingAssignment;

use App\Enums\Semester;
use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rules\Enum;

class StoreTeachingAssignmentRequest extends BaseRequest
{
    public function authorize(): bool { return $this->authorizePolicy('create', \App\Models\TeachingAssignment::class); }

    public function rules(): array
    {
        return [
            'teacher_id' => ['required', 'integer', 'exists:users,id'],
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'academic_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
            'semester' => ['required', new Enum(Semester::class)],
        ];
    }
}
