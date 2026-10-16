<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest; use Illuminate\Validation\Rule;
class AssessmentRequest extends FormRequest { public function authorize(): bool{return true;} public function rules():array{$assessment=$this->route('assessment'); return ['teaching_assignment_id'=>['required','exists:teaching_assignments,id'],'name'=>['required','string','max:255',Rule::unique('assessments')->where(fn($q)=>$q->where('teaching_assignment_id',$this->input('teaching_assignment_id')))->ignore($assessment?->id)],'total_score'=>['required','numeric','gt:0','max:999.99'],'weight_percentage'=>['required','numeric','between:0,100']];} }
