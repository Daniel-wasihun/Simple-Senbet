<?php

namespace App\Policies;

class UserPolicy extends CrudPolicy
{
    protected string $permissionPrefix = 'users';
}
