<?php

namespace App\Http\Requests;

use App\Models\SchoolClass;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SchoolClassRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $classParam = $this->route('school_class');
        $classId = $classParam instanceof SchoolClass ? $classParam->id : $classParam;

        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', Rule::unique('classes', 'code')->ignore($classId)],
            'number_of_sections' => ['required', 'integer', 'min:1'],
            'passing_score' => ['required', 'numeric', 'between:0,100'],
            'next_class_id' => ['sometimes', 'nullable', 'integer', 'exists:classes,id'],
        ];
    }
}
