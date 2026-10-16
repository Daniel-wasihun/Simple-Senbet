<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest; use Illuminate\Validation\Rule;
class CourseRequest extends FormRequest { public function authorize(): bool{return true;} public function rules():array{$course=$this->route('course'); return ['name'=>['required','string','max:255'],'code'=>['required','string','max:50',Rule::unique('courses')->ignore($course?->id)],'description'=>['nullable','string'],'credit_hour'=>['required','integer','min:1'],'class_id'=>['required','exists:classes,id']];} }
