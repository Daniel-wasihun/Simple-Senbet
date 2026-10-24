<?php

namespace App\Http\Requests\Course;

use App\Http\Requests\BaseRequest;

class UpdateCourseRequest extends BaseRequest
{
    public function authorize(): bool { return $this->authorizePolicy('update', \App\Models\Course::class, 'course'); }

    public function rules(): array
    {
        return [
            'name' => $this->translatable(required: false, max: 150),
            'code' => ['sometimes', 'string', 'max:50', $this->uniqueIgnore('courses', 'code')],
            'description' => $this->translatable(required: false, max: 1000),
            'credit_hour' => ['sometimes', 'integer', 'min:1'],
            'class_id' => ['sometimes', 'integer', 'exists:classes,id'],
        ];
    }
}
