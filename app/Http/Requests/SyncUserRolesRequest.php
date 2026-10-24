<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class SyncUserRolesRequest extends BaseRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $target = $this->route('user');

        return $user !== null
            && $target !== null
            && $user->can('assignRoles', [$target, (array) $this->input('role_ids', [])]);
    }

    public function rules(): array
    {
        return [
            'role_ids' => ['required', 'array', 'min:1', 'max:100'],
            'role_ids.*' => ['required', 'integer', 'distinct', Rule::exists('roles', 'id')->where('guard_name', 'web')],
        ];
    }
}
