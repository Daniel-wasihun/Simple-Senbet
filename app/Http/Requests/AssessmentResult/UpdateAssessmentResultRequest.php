<?php

namespace App\Http\Requests\AssessmentResult;

use App\Http\Requests\BaseRequest;

class UpdateAssessmentResultRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'assessment_id' => ['sometimes', 'integer', 'exists:assessments,id'],
            'member_id' => ['sometimes', 'integer', 'exists:members,id'],
            'score' => ['sometimes', 'numeric', 'min:0'],
            'remarks' => $this->translatable(required: false, max: 1000),
        ];
    }
}
