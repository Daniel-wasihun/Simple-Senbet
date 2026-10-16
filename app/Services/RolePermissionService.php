<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\Role;

class RolePermissionService
{
    public function grouped(Role $role): array
    {
        return $role->permissions()->orderBy('group_name')->get()->groupBy('group_name')->map(fn ($permissions, $group) => ['group_name' => $group, 'permissions' => $permissions])->values()->all();
    }
    public function sync(Role $role, array $permissionIds): Role
    {
        $role->syncPermissions(Permission::whereIn('id', $permissionIds)->get());
        return $role->fresh()->load('permissions');
    }
}
