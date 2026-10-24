<?php

namespace App\Modules\UserManagement\Requests\Roles;

use Illuminate\Foundation\Http\FormRequest;

class DeleteRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('roles.delete') ?? false;
    }

    public function rules(): array
    {
        return [];
    }
}
