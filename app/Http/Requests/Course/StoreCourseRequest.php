<?php

namespace App\Http\Requests\Course;

use App\Http\Requests\BaseRequest;

class StoreCourseRequest extends BaseRequest
{
    public function authorize(): bool { return $this->authorizePolicy('create', \App\Models\Course::class); }

    public function rules(): array
    {
        return [
            'name' => $this->translatable(required: true, max: 150),
            'code' => ['required', 'string', 'max:50', 'unique:courses,code'],
            'description' => $this->translatable(required: false, max: 1000),
            'credit_hour' => ['sometimes', 'integer', 'min:1'],
            'class_id' => ['required', 'integer', 'exists:classes,id'],
        ];
    }
}
