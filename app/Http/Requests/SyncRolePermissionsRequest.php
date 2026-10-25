<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Role;
use App\Models\Permission;

class SyncRolePermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $role = $this->route('role');
        if (! $user || ! $role instanceof Role || ! $user->can('assignPermissions', $role)) {
            return false;
        }

        if ($user->hasPermission('roles.manage')) {
            return true;
        }

        $permissionIds = (array) $this->input('permission_ids', []);
        $permissionNames = Permission::query()->whereIn('id', $permissionIds)->pluck('name');
        $delegableNames = $user->getAllPermissions()->pluck('name');

        return $permissionNames->count() === count(array_unique(array_map('intval', $permissionIds)))
            && $permissionNames->diff($delegableNames)->isEmpty();
    }
    public function rules(): array { return ['permission_ids' => ['present', 'array'], 'permission_ids.*' => ['integer', 'exists:permissions,id']]; }
}
