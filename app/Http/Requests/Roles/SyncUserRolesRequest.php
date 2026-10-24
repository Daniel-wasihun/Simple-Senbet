<?php

namespace App\Modules\UserManagement\Requests\Roles;

use Illuminate\Foundation\Http\FormRequest;

class SyncUserRolesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('roles.assign') ?? false;
    }

    public function rules(): array
    {
        return [
            'role_ids' => [
                'required',
                'array',
                'min:1',
                'max:100',
            ],

            'role_ids.*' => [
                'required',
                'integer',
                'distinct',
                'min:1',
                'exists:roles,id',
            ],
        ];
    }
}
