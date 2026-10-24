<?php

namespace App\Policies;

use App\Models\Role;
use App\Models\User;

class RolePolicy
{
    /**
     * Superadmins bypass all role checks.
     */
    public function before(User $user): ?bool
    {
        return $user->hasRole('superadmin') ? true : null;
    }

    /**
     * Determine whether the user can view roles.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('roles.view')
            || $user->can('roles.manage');
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
        return $user->can('roles.manage');
    }

    /**
     * Determine whether the user can update roles.
     */
    public function update(User $user, Role $role): bool
    {
        return $user->can('roles.manage');
    }

    /**
     * Determine whether the user can delete roles.
     */
    public function delete(User $user, Role $role): bool
    {
        return $user->can('roles.manage');
    }
}
