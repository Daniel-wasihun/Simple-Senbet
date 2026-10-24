<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest; use Illuminate\Validation\Rule;
class AssessmentResultRequest extends FormRequest { public function authorize(): bool{$subject=$this->route('assessment_result') ?? \App\Models\AssessmentResult::class; return $this->user()?->can($this->isMethod('POST') ? 'create' : 'update',$subject) ?? false;} public function rules():array{$result=$this->route('assessment_result'); return ['assessment_id'=>['required','exists:assessments,id'],'member_id'=>['required','exists:members,id',Rule::unique('assessment_results')->where(fn($q)=>$q->where('assessment_id',$this->input('assessment_id')))->ignore($result?->id)],'score'=>['required','numeric','min:0','max:999.99']];} }
