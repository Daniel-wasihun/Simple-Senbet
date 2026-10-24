<?php

namespace App\Policies;

use App\Models\Permission;
use App\Models\User;

class PermissionPolicy
{
    /**
     * Determine whether the user can view permissions.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('permissions.view')
            || $user->hasPermission('roles.view');
    }

    /**
     * Determine whether the user can create permissions.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('permissions.create');
    }

    /**
     * Determine whether the user can update permissions.
     */
    public function update(User $user, Permission $permission): bool
    {
        return $user->hasPermission('permissions.update');
    }

    /**
     * Determine whether the user can delete permissions.
     */
    public function delete(User $user, Permission $permission): bool
    {
        return $user->hasPermission('permissions.delete');
    }
}
