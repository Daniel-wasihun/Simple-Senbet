<?php

namespace App\Http\Requests\Member;

use App\Http\Requests\BaseRequest;

class StoreMemberRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'full_name' => $this->translatable(required: true, max: 255),
            'christian_name' => $this->translatable(required: false, max: 255),
            'date_of_birth' => ['required', 'date', 'before:today'],
            'gender' => ['required', 'string', 'in:male,female,other'],
            'emergency_contact_name' => $this->translatable(required: false, max: 255),
            'emergency_contact_phone' => ['nullable', 'string', 'max:50'],
            'phone_number' => ['nullable', 'string', 'max:50'],
            'membership_date' => ['nullable', 'date'],
            'sol_father_name' => $this->translatable(required: false, max: 255),
            'class_id' => ['required', 'integer', 'exists:classes,id'],
            'section' => ['nullable', 'string', 'max:50'],
        ];
    }
}
