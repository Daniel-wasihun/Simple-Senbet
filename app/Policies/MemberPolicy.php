<?php

namespace App\Policies;

class MemberPolicy extends CrudPolicy
{
    protected string $permissionPrefix = 'members';
}
