<?php

namespace App\Http\Requests\SchoolClass;

use App\Http\Requests\BaseRequest;

class UpdateSchoolClassRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'name' => $this->translatable(required: false, max: 100),
            'code' => ['sometimes', 'string', 'max:50', $this->uniqueIgnore('classes', 'code')],
            'number_of_sections' => ['sometimes', 'integer', 'min:1'],
            'passing_score' => ['sometimes', 'numeric', 'between:0,100'],
            'next_class_id' => ['sometimes', 'nullable', 'integer', 'exists:classes,id'],
        ];
    }
}
