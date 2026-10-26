<?php

namespace App\Http\Requests;

use App\Models\Assessment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AssessmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $subject = $this->route('assessment') ?? Assessment::class;

        return $this->user()?->can($this->isMethod('POST') ? 'create' : 'update', $subject) ?? false;
    }

    public function rules(): array
    {
        $assessmentParam = $this->route('assessment');
        $assessmentId = $assessmentParam instanceof Assessment ? $assessmentParam->id : $assessmentParam;

        return [
            'teaching_assignment_id' => ['required', 'exists:teaching_assignments,id'],
            'name' => [
                'required',
                function ($attribute, $value, $fail) use ($assessmentId) {
                    $extracted = is_array($value) ? ($value['en'] ?? $value['am'] ?? reset($value)) : $value;
                    if (!is_string($extracted) || trim($extracted) === '') {
                        $fail('The name field is required.');
                        return;
                    }
                    $trimmed = trim($extracted);
                    $assignmentId = $this->input('teaching_assignment_id');
                    $exists = Assessment::where('teaching_assignment_id', $assignmentId)
                        ->where(function ($q) use ($trimmed) {
                            $q->where('name->en', $trimmed)
                              ->orWhere('name->am', $trimmed)
                              ->orWhereRaw("name#>>'{}' = ?", [$trimmed]);
                        })
                        ->when($assessmentId, fn ($q) => $q->where('id', '!=', $assessmentId))
                        ->exists();

                    if ($exists) {
                        $fail('The name has already been taken.');
                    }
                },
            ],
            'total_score' => ['required', 'numeric', 'gt:0', 'max:999.99'],
            'weight_percentage' => ['required', 'numeric', 'between:0,100'],
        ];
    }
}
