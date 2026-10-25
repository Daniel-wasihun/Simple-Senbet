<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Role;

class UserPolicy
{
    public function register(User $actor): bool
    {
        return ($actor->hasPermission('users.register') || $actor->hasPermission('users.create'))
            && $actor->hasPermission('roles.assign');
    }

    public function viewAny(User $actor): bool
    {
        return $actor->hasPermission('users.view');
    }

    public function view(User $actor, User $target): bool
    {
        return $actor->is($target)
            ? $actor->hasPermission('profile.view')
            : $actor->hasPermission('users.view');
    }

    public function create(User $actor): bool
    {
        // User creation can assign a role, so require role management too.
        return $actor->hasPermission('users.create') && $actor->hasPermission('roles.assign');
    }

    public function update(User $actor, User $target): bool
    {
        return $actor->is($target)
            ? $actor->hasPermission('profile.update')
            : $actor->hasPermission('users.update');
    }

    public function assignRoleName(User $actor, string $roleName): bool
    {
        if (! $actor->hasPermission('roles.assign')
            || ($roleName === 'superadmin' && ! $actor->hasPermission('roles.assign-system'))) {
            return false;
        }

        if ($actor->hasPermission('roles.manage')) {
            return true;
        }

        $role = Role::query()->where('guard_name', 'web')->where('name', $roleName)->first();
        if (! $role) {
            return false;
        }

        $delegable = $actor->getAllPermissions()->pluck('name')->all();

        return $role->permissions()->whereNotIn('name', $delegable)->doesntExist();
    }

    public function assignRoleTo(User $actor, User $target, string $roleName): bool
    {
        // Prevent self role changes and protect existing or newly assigned system administrators.
        return ! $actor->is($target)
            && (! $target->hasRole('superadmin') || $actor->hasPermission('roles.assign-system'))
            && $this->assignRoleName($actor, $roleName);
    }

    /**
     * Determine whether the actor can replace a user's assigned role set.
     */
    public function assignRoles(User $actor, User $target, array $roleIds = []): bool
    {
        if ($actor->is($target) || ! $actor->hasPermission('roles.assign') || $roleIds === []) {
            return false;
        }

        $roleIds = array_values(array_unique(array_map('intval', $roleIds)));
        $roles = Role::query()->where('guard_name', 'web')->whereIn('id', $roleIds)->get();

        if ($roles->count() !== count($roleIds)
            || ($roles->contains(fn (Role $role): bool => $role->name === 'superadmin')
                && ! $actor->hasPermission('roles.assign-system'))) {
            return false;
        }

        if ($actor->hasPermission('roles.manage')) {
            return true;
        }

        $delegable = $actor->getAllPermissions()->pluck('name')->all();

        return $roles->every(fn (Role $role): bool => $role->permissions()->whereNotIn('name', $delegable)->doesntExist());
    }

    public function delete(User $actor, User $target): bool
    {
        // A user must not delete their own account or another superadmin.
        return ! $actor->is($target)
            && $actor->hasPermission('users.delete')
            && (! $target->hasRole('superadmin') || $actor->hasPermission('roles.assign-system'));
    }
}
