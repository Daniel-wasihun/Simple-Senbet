<?php

namespace App\Http\Requests\AssessmentResult;

use App\Http\Requests\BaseRequest;

class StoreAssessmentResultRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'assessment_id' => ['required', 'integer', 'exists:assessments,id'],
            'member_id' => ['required', 'integer', 'exists:members,id'],
            'score' => ['required', 'numeric', 'min:0'],
            'remarks' => $this->translatable(required: false, max: 1000),
        ];
    }
}
