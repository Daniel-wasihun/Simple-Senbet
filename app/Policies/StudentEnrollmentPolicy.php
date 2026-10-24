<?php

namespace App\Policies;

use App\Models\StudentEnrollment;
use App\Models\User;

class StudentEnrollmentPolicy
{
    /**
     * Determine whether the user can view any student enrollments.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('student-enrollments.view');
    }

    /**
     * Determine whether the user can view the student enrollment.
     */
    public function view(User $user, StudentEnrollment $enrollment): bool
    {
        return $this->viewAny($user);
    }

    /**
     * Determine whether the user can create student enrollments.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('student-enrollments.create');
    }

    /**
     * Determine whether the user can update the student enrollment.
     */
    public function update(User $user, StudentEnrollment $enrollment): bool
    {
        return $user->hasPermission('student-enrollments.update');
    }

    /**
     * Determine whether the user can transfer students.
     */
    public function transfer(User $user): bool
    {
        return $user->hasPermission('student-enrollments.update');
    }

    /**
     * Determine whether the user can withdraw students.
     */
    public function withdraw(User $user): bool
    {
        return $user->hasPermission('student-enrollments.delete');
    }

    /**
     * Determine whether the user can delete the student enrollment.
     */
    public function delete(User $user, StudentEnrollment $enrollment): bool
    {
        return $user->hasPermission('student-enrollments.delete');
    }
}
