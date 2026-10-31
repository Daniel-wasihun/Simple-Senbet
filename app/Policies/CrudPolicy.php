<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

abstract class CrudPolicy
{
    protected string $permissionPrefix;

    /**
     * Superadmin pre-authorization bypass.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('superadmin') || $user->primaryRole?->name === 'superadmin' || ($user->role ?? null) === 'superadmin') {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return $user->hasPermission("{$this->permissionPrefix}.view");
    }

    public function view(User $user, Model $model): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission("{$this->permissionPrefix}.create");
    }

    public function update(User $user, Model $model): bool
    {
        return $user->hasPermission("{$this->permissionPrefix}.update");
    }

    public function delete(User $user, Model $model): bool
    {
        return $user->hasPermission("{$this->permissionPrefix}.delete");
    }
}
