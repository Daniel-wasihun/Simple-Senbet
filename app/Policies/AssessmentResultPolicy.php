<?php

namespace App\Policies;

class AssessmentResultPolicy extends CrudPolicy
{
    protected string $permissionPrefix = 'assessment-results';
}
