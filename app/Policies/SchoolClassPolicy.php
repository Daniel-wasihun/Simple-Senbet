<?php

namespace App\Policies;

class SchoolClassPolicy extends CrudPolicy
{
    protected string $permissionPrefix = 'school-classes';
}
