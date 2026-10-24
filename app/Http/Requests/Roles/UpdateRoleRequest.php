<?php

namespace App\Modules\UserManagement\Requests\Roles;

use App\Modules\UserManagement\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('roles.update') ?? false;
    }

    public function rules(): array
    {
        $role = $this->route('role');

        $roleId = $role instanceof Role
            ? $role->getKey()
            : (is_scalar($role) ? $role : null);

        $nameRules = [
            'sometimes',
            'required',
            'string',
            'max:100',
        ];

        $uniqueName = Rule::unique('roles', 'name');

        if ($roleId !== null) {
            $uniqueName->ignore($roleId);
        }

        $nameRules[] = $uniqueName;

        return [
            'name' => $nameRules,

            'description' => [
                'sometimes',
                'nullable',
                'string',
                'max:5000',
            ],
        ];
    }
}
