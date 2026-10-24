<?php

namespace App\Modules\UserManagement\Requests\Roles;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('roles.create') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('roles', 'name'),
            ],

            'slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('roles', 'slug'),
            ],

            'description' => [
                'sometimes',
                'nullable',
                'string',
                'max:5000',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'A role with this name already exists.',
            'slug.unique' => 'A role with this slug already exists.',
            'slug.regex' => 'The slug must contain lowercase letters, numbers and hyphens.',
        ];
    }
}
