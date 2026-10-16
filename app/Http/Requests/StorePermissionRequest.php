<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePermissionRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array { return ['name' => ['required', 'string', 'max:100', 'regex:/^[a-z]+(\.[a-z]+)*$/', 'unique:permissions,name'], 'group_name' => ['required', 'string', 'max:100'], 'label' => ['required', 'array'], 'label.en' => ['required', 'string'], 'label.*' => ['string'], 'description' => ['nullable', 'array'], 'description.*' => ['nullable', 'string']]; }
}
