<?php

namespace App\Policies;

use App\Models\Permission;
use App\Models\User;

class PermissionPolicy
{
    /**
     * Superadmins bypass all permission checks.
     */
    public function before(User $user): ?bool
    {
        return $user->hasRole('superadmin') ? true : null;
    }

    /**
     * Determine whether the user can view permissions.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('roles.view')
            || $user->can('roles.manage');
    }

    /**
     * Determine whether the user can create permissions.
     */
    public function create(User $user): bool
    {
        return $user->can('roles.manage');
    }

    /**
     * Determine whether the user can update permissions.
     */
    public function update(User $user, Permission $permission): bool
    {
        return $user->can('roles.manage');
    }

    /**
     * Determine whether the user can delete permissions.
     */
    public function delete(User $user, Permission $permission): bool
    {
        return $user->can('roles.manage');
    }
}
