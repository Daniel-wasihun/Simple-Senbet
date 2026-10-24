<?php

namespace App\Modules\UserManagement\Requests\Permissions;

use Illuminate\Foundation\Http\FormRequest;

class IndexPermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('permissions.view') ?? false;
    }

    public function rules(): array
    {
        return [
            'module' => ['sometimes', 'nullable', 'string', 'max:100'],
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}
