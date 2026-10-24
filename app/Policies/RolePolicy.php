<?php

namespace App\Policies;
 
use App\Models\User;
use App\Models\Role;

class RolePolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->hasPermission('roles.view');
    } 

    public function view(User $actor, Role $role): bool
    {
        return $actor->hasPermission('roles.view');
    }

    public function create(User $actor): bool
    {
        return $actor->hasPermission('roles.create');
    }

    public function update(User $actor, Role $role): bool
    {
        return $actor->hasPermission('roles.update')
            && (! $role->is_system || $actor->hasPermission('roles.assign-system'));
    }

    public function delete(User $actor, Role $role): bool
    {
        return $actor->hasPermission('roles.delete')
            && ! $role->is_system
            && ! $role->users()->exists();
           
    }

    public function assignPermissions(
        User $actor,
        Role $role
    ): bool {
        return $actor->hasPermission('permissions.assign')
            && (! $role->is_system || $actor->hasPermission('roles.assign-system'));
    }
}
