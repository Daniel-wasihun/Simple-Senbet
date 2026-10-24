<?php

namespace App\Modules\UserManagement\Requests\Roles;

use Illuminate\Foundation\Http\FormRequest;

class ViewRolesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('roles.view') ?? false;
    }

    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}
