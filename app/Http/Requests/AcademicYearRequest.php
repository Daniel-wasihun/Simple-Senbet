<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest; use Illuminate\Validation\Rule;
class AcademicYearRequest extends FormRequest { public function authorize(): bool{return true;} public function rules():array{$year=$this->route('academic_year'); return ['name'=>['required','string','max:100',Rule::unique('academic_years')->ignore($year?->id)],'start_date'=>['required','date'],'end_date'=>['required','date','after:start_date'],'is_current'=>['sometimes','boolean']];} }
