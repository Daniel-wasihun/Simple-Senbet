<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\HandlesCachedCrud;
use App\Http\Controllers\Controller;
use App\Http\Resources\AssessmentResultResource;
use App\Models\Assessment;
use App\Models\AssessmentResult;
use App\Models\Member;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AssessmentResultController extends Controller
{
    use HandlesCachedCrud;

    private function rules(?AssessmentResult $result = null): array
    {
        return [
            'assessment_id' => ['required', 'exists:assessments,id'],
            'member_id' => ['required', 'exists:members,id', Rule::unique('assessment_results')->where(fn ($query) => $query->where('assessment_id', request('assessment_id')))->ignore($result?->id), function (string $attribute, mixed $value, \Closure $fail): void {
                $assessment = Assessment::with('teachingAssignment.course')->find(request('assessment_id'));
                $member = Member::find($value);
                if ($assessment && $member && $assessment->teachingAssignment->course->class_id !== $member->class_id) {
                    $fail('The member must belong to the assessment course class.');
                }
            }],
            'score' => ['required', 'numeric', 'min:0', 'max:999.99', function (string $attribute, mixed $value, \Closure $fail): void {
                $assessment = Assessment::find(request('assessment_id'));
                if ($assessment && $value > $assessment->total_score) {
                    $fail('The score may not exceed the assessment total score.');
                }
            }],
        ];
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', AssessmentResult::class);

        $query = AssessmentResult::with(['assessment', 'member.schoolClass']);

        if ($request->filled('teaching_assignment_id')) {
            $query->whereHas('assessment', function ($q) use ($request) {
                $q->where('teaching_assignment_id', (int) $request->query('teaching_assignment_id'));
            });
            return AssessmentResultResource::collection($query->get());
        }

        if ($request->filled('assessment_id')) {
            $query->where('assessment_id', (int) $request->query('assessment_id'));
            return AssessmentResultResource::collection($query->get());
        }

        return $this->indexCrud(AssessmentResult::class, AssessmentResultResource::class, ['assessment', 'member.schoolClass'], false);
    }

    public function batchStore(Request $request)
    {
        $this->authorize('create', AssessmentResult::class);

        $validated = $request->validate([
            'results' => ['required', 'array'],
            'results.*.assessment_id' => ['required', 'exists:assessments,id'],
            'results.*.member_id' => ['required', 'exists:members,id'],
            'results.*.score' => ['required', 'numeric', 'min:0', 'max:999.99'],
            'results.*.remarks' => ['nullable'],
        ]);

        $saved = [];
        foreach ($validated['results'] as $item) {
            $result = AssessmentResult::updateOrCreate(
                [
                    'assessment_id' => $item['assessment_id'],
                    'member_id' => $item['member_id'],
                ],
                [
                    'score' => $item['score'],
                    'remarks' => $item['remarks'] ?? null,
                ]
            );
            $saved[] = $result;
        }

        return response()->json([
            'message' => 'Assessment results saved successfully.',
            'count' => count($saved),
            'data' => AssessmentResultResource::collection(collect($saved)->load(['assessment', 'member'])),
        ]);
    }

    public function store(Request $request)
    {
        return $this->storeCrud($request, AssessmentResult::class, AssessmentResultResource::class, $this->rules(), ['assessment', 'member.schoolClass'], true);
    }

    public function show(AssessmentResult $assessmentResult)
    {
        return $this->showCrud($assessmentResult, AssessmentResultResource::class, ['assessment', 'member.schoolClass'], true);
    }

    public function update(Request $request, AssessmentResult $assessmentResult)
    {
        return $this->updateCrud($request, $assessmentResult, AssessmentResultResource::class, $this->rules($assessmentResult), ['assessment', 'member.schoolClass'], true);
    }

    public function destroy(AssessmentResult $assessmentResult)
    {
        return $this->destroyCrud($assessmentResult, true);
    }
}
