<?php

namespace App\Http\Requests\Promotion;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rule;

class PromotionDryRunRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'current_academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'next_academic_year_id' => ['required', 'integer', 'exists:academic_years,id', 'different:current_academic_year_id'],
            'class_id' => ['sometimes', 'nullable', 'integer', 'exists:classes,id'],
            'evaluation_mode' => ['sometimes', 'string', Rule::in(['annual', 'semester_1', 'semester_2'])],
            'class_mappings' => ['sometimes', 'array'],
            'class_mappings.*' => ['integer', 'exists:classes,id'],
        ];
    }
}
