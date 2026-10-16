<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\HandlesCachedCrud;
use App\Http\Controllers\Controller;
use App\Http\Resources\AssessmentResource;
use App\Models\Assessment;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AssessmentController extends Controller
{
    use HandlesCachedCrud;

    private function rules(?Assessment $assessment = null): array
    {
        return ['teaching_assignment_id' => ['required', 'exists:teaching_assignments,id'], 'name' => ['required', 'string', 'max:255', Rule::unique('assessments')->where(fn ($q) => $q->where('teaching_assignment_id', request('teaching_assignment_id')))->ignore($assessment?->id)], 'total_score' => ['required', 'numeric', 'gt:0', 'max:999.99'], 'weight_percentage' => ['required', 'numeric', 'between:0,100']];
    }

    public function index()
    {
        return $this->indexCrud(Assessment::class, AssessmentResource::class, [], true);
    }

    public function store(Request $r)
    {
        return $this->storeCrud($r, Assessment::class, AssessmentResource::class, $this->rules(), [], true);
    }

    public function show(Assessment $assessment)
    {
        return $this->showCrud($assessment, AssessmentResource::class, [], true);
    }

    public function update(Request $r, Assessment $assessment)
    {
        return $this->updateCrud($r, $assessment, AssessmentResource::class, $this->rules($assessment), [], true);
    }

    public function destroy(Assessment $assessment)
    {
        return $this->destroyCrud($assessment, true);
    }
}
