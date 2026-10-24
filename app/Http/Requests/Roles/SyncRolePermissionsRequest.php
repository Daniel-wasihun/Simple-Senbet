<?php

namespace App\Modules\UserManagement\Requests\Roles;

use Illuminate\Foundation\Http\FormRequest;

class SyncRolePermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('permissions.assign') ?? false;
    }

    public function rules(): array
    {
        return [
            'permission_ids' => [
                'present',
                'array',
                'max:500',
            ],

            'permission_ids.*' => [
                'required',
                'integer',
                'distinct',
                'min:1',
                'exists:permissions,id',
            ],
        ];
    }
}
