<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePermissionRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()?->can('create', \App\Models\Permission::class) ?? false; }
    public function rules(): array { return ['name' => ['required', 'string', 'max:100', 'regex:/^[a-z]+(\.[a-z]+)*$/', 'unique:permissions,name'], 'group_name' => ['required', 'string', 'max:100'], 'label' => ['required', 'array'], 'label.en' => ['required', 'string'], 'label.*' => ['string'], 'description' => ['nullable', 'array'], 'description.*' => ['nullable', 'string']]; }

    protected function prepareForValidation(): void
    {
        $label = $this->input('label', []);
        if (is_string($label)) {
            $label = ['en' => $label];
        }
        if (is_array($label) && empty($label['en'])) {
            $label['en'] = $label['am'] ?? $label['om'] ?? null;
        }
        $this->merge(['label' => $label]);
    }
}
