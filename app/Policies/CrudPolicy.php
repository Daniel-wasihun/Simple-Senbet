<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

abstract class CrudPolicy
{
    protected string $permissionPrefix;

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
