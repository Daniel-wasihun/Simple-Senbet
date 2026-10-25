<?php

namespace App\Http\Requests;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->route('role');

        return $role instanceof Role && ($this->user()?->can('update', $role) ?? false);
    }

    public function rules(): array
    {
        $role = $this->route('role');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:100', 'regex:/^[a-z][a-z0-9_-]*$/', Rule::unique('roles')->where('guard_name', 'web')->ignore($role?->id)],
            'label' => ['sometimes', 'array'],
            'label.en' => ['required_with:label', 'string', 'max:120'],
            'label.am' => ['nullable', 'string', 'max:120'],
            'label.om' => ['nullable', 'string', 'max:120'],
        ];
    }
}
