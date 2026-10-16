<?php

namespace App\Policies;

class CoursePolicy extends CrudPolicy
{
    protected string $permissionPrefix = 'courses';
}
