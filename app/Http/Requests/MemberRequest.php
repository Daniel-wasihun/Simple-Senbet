<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class MemberRequest extends FormRequest { public function authorize(): bool{return true;} public function rules():array{return ['full_name'=>['required','string','max:255'],'christian_name'=>['nullable','string','max:255'],'date_of_birth'=>['required','date','before:today'],'gender'=>['required','string','max:20'],'emergency_contact_name'=>['nullable','string','max:255'],'emergency_contact_phone'=>['nullable','string','max:50'],'phone_number'=>['nullable','string','max:50'],'membership_date'=>['nullable','date'],'sol_father_name'=>['nullable','string','max:255'],'class_id'=>['required','exists:classes,id'],'section'=>['nullable','string','max:50']];} }
