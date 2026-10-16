<?php

namespace App\Http\Requests\Assessment;

use App\Http\Requests\BaseRequest;

class StoreAssessmentRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'teaching_assignment_id' => ['required', 'integer', 'exists:teaching_assignments,id'],
            'name' => $this->translatable(required: true, max: 200),
            'total_score' => ['required', 'numeric', 'min:0.01'],
            'weight_percentage' => ['required', 'numeric', 'between:0,100'],
        ];
    }
}
