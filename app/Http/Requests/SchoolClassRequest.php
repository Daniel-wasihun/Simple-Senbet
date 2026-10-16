<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest; use Illuminate\Validation\Rule;
class SchoolClassRequest extends FormRequest { public function authorize(): bool{return true;} public function rules():array{$class=$this->route('school_class'); return ['name'=>['required','string','max:255'],'code'=>['required','string','max:50',Rule::unique('classes')->ignore($class?->id)],'number_of_sections'=>['required','integer','min:1'],'passing_score'=>['required','numeric','between:0,100']];} }
