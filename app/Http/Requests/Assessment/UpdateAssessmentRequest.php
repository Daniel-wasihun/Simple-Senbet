<?php

namespace App\Http\Requests\Assessment;

use App\Http\Requests\BaseRequest;

class UpdateAssessmentRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'teaching_assignment_id' => ['sometimes', 'integer', 'exists:teaching_assignments,id'],
            'name' => $this->translatable(required: false, max: 200),
            'total_score' => ['sometimes', 'numeric', 'min:0.01'],
            'weight_percentage' => ['sometimes', 'numeric', 'between:0,100'],
        ];
    }
}
