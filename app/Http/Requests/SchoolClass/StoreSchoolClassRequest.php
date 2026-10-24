<?php

namespace App\Http\Requests\SchoolClass;

use App\Http\Requests\BaseRequest;

class StoreSchoolClassRequest extends BaseRequest
{
    public function authorize(): bool { return $this->authorizePolicy('create', \App\Models\SchoolClass::class); }

    public function rules(): array
    {
        return [
            'name' => $this->translatable(required: true, max: 100),
            'code' => ['required', 'string', 'max:50', 'unique:classes,code'],
            'number_of_sections' => ['sometimes', 'integer', 'min:1'],
            'passing_score' => ['sometimes', 'numeric', 'between:0,100'],
            'next_class_id' => ['sometimes', 'nullable', 'integer', 'exists:classes,id'],
        ];
    }
}
