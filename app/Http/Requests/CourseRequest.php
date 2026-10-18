<?php

namespace App\Http\Requests;

use App\Models\Course;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $courseParam = $this->route('course');
        $courseId = $courseParam instanceof Course ? $courseParam->id : $courseParam;

        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', Rule::unique('courses', 'code')->ignore($courseId)],
            'description' => ['nullable', 'string'],
            'credit_hour' => ['required', 'integer', 'min:1'],
            'class_id' => ['required', 'exists:classes,id'],
        ];
    }
}
