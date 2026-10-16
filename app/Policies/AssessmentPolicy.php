<?php

namespace App\Policies;

class AssessmentPolicy extends CrudPolicy
{
    protected string $permissionPrefix = 'assessments';
}
