<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', \App\Models\Role::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100', 'regex:/^[a-z][a-z0-9_-]*$/', Rule::unique('roles')->where('guard_name', 'web')],
            'label' => ['nullable', 'array'],
            'label.en' => ['required_with:label', 'string', 'max:120'],
            'label.am' => ['nullable', 'string', 'max:120'],
            'label.om' => ['nullable', 'string', 'max:120'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $label = $this->input('label');
        if (is_string($label)) {
            $label = ['en' => $label];
        }
        if (is_array($label)) {
            if (empty($label['en'])) {
                $label['en'] = $label['am'] ?? $label['om'] ?? null;
            }
            $this->merge(['label' => $label]);
        }
    }
}
