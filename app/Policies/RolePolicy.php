<?php

namespace App\Policies;

use App\Models\Role;
use App\Models\User;

class RolePolicy
{
    /**
     * Determine whether the user can view roles.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('roles.view');
    }

    /**
     * Determine whether the user can view the specific role.
     */
    public function view(User $user, Role $role): bool
    {
        return $this->viewAny($user);
    }

    /**
     * Determine whether the user can create roles.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('roles.create');
    }

    /**
     * Determine whether the user can update roles.
     */
    public function update(User $user, Role $role): bool
    {
        return $role->name !== 'superadmin' && $user->hasPermission('roles.update');
    }

    /**
     * Determine whether the user can delete roles.
     */
    public function delete(User $user, Role $role): bool
    {
        return $role->name !== 'superadmin'
            && $user->hasPermission('roles.delete')
            && ! $role->users()->exists();
    }

    /**
     * Changing a role's permission set is a separate sensitive operation.
     */
    public function assignPermissions(User $user, Role $role): bool
    {
        return $role->name !== 'superadmin' && $user->hasPermission('permissions.assign');
    }
}
