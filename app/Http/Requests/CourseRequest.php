<?php

namespace App\Http\Requests;

use App\Models\Course;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        $subject = $this->route('course') ?? Course::class;

        return $this->user()?->can($this->isMethod('POST') ? 'create' : 'update', $subject) ?? false;
    }

    public function rules(): array
    {
        $courseParam = $this->route('course');
        $courseId = $courseParam instanceof Course ? $courseParam->id : $courseParam;

        return [
            'name' => ['required', 'array'],
            'name.en' => ['required', 'string', 'max:255'],
            'name.am' => ['nullable', 'string', 'max:255'],
            'name.om' => ['nullable', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', Rule::unique('courses', 'code')->ignore($courseId)],
            'description' => ['sometimes', 'nullable', 'array'],
            'description.en' => ['nullable', 'string', 'max:5000'],
            'description.am' => ['nullable', 'string', 'max:5000'],
            'description.om' => ['nullable', 'string', 'max:5000'],
            'credit_hour' => ['required', 'integer', 'min:1'],
            'class_id' => ['required', 'exists:classes,id'],
        ];
    }

    protected function prepareForValidation(): void
    {
        foreach (['name', 'description'] as $attribute) {
            $value = $this->input($attribute);
            if (is_string($value)) $value = $value === '' ? [] : ['en' => $value];
            if (!is_array($value)) $value = [];
            $course = $this->route('course');
            if ($course instanceof Course) {
                foreach (['en', 'am', 'om'] as $locale) {
                    if (!isset($value[$locale]) || $value[$locale] === '') {
                        $stored = $course->getTranslations($attribute);
                        if (isset($stored[$locale])) $value[$locale] = $stored[$locale];
                    }
                }
            }
            $this->merge([$attribute => $value]);
        }
    }
}
