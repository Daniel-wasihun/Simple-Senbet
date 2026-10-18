<?php

namespace App\Http\Requests;

use App\Models\Assessment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AssessmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $assessmentParam = $this->route('assessment');
        $assessmentId = $assessmentParam instanceof Assessment ? $assessmentParam->id : $assessmentParam;

        return [
            'teaching_assignment_id' => ['required', 'exists:teaching_assignments,id'],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('assessments')->where(function ($query) {
                    return $query->where('teaching_assignment_id', $this->input('teaching_assignment_id'));
                })->ignore($assessmentId),
            ],
            'total_score' => ['required', 'numeric', 'gt:0', 'max:999.99'],
            'weight_percentage' => ['required', 'numeric', 'between:0,100'],
        ];
    }
}
