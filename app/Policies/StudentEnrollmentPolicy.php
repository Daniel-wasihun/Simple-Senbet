<?php

namespace App\Policies;

use App\Models\StudentEnrollment;
use App\Models\User;

class StudentEnrollmentPolicy
{
    /**
     * Superadmins bypass all authorization checks.
     */
    public function before(User $user): ?bool
    {
        return $user->hasRole('superadmin') ? true : null;
    }

    /**
     * Determine whether the user can view any student enrollments.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('student-enrollments.view')
            || $user->hasRole(['academic_director', 'academic_administrator', 'member_coordinator', 'teacher']);
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
        return $user->can('student-enrollments.create')
            || $user->hasRole(['academic_director', 'academic_administrator', 'member_coordinator']);
    }

    /**
     * Determine whether the user can update the student enrollment.
     */
    public function update(User $user, StudentEnrollment $enrollment): bool
    {
        return $user->can('student-enrollments.update')
            || $user->hasRole(['academic_director', 'academic_administrator', 'member_coordinator']);
    }

    /**
     * Determine whether the user can transfer students.
     */
    public function transfer(User $user): bool
    {
        return $user->can('student-enrollments.update')
            || $user->hasRole(['academic_director', 'academic_administrator', 'member_coordinator']);
    }

    /**
     * Determine whether the user can withdraw students.
     */
    public function withdraw(User $user): bool
    {
        return $user->can('student-enrollments.delete')
            || $user->hasRole(['academic_director', 'academic_administrator', 'member_coordinator']);
    }

    /**
     * Determine whether the user can delete the student enrollment.
     */
    public function delete(User $user, StudentEnrollment $enrollment): bool
    {
        return $user->can('student-enrollments.delete')
            || $user->hasRole(['academic_director']);
    }
}
