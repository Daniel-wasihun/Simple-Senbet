<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy extends CrudPolicy
{
    protected string $permissionPrefix = 'users';

    /**
     * Determine whether the user can register new users.
     */
    public function register(User $user): bool
    {
        return $user->can('users.register') || $user->can('users.create');
    }
}
