<?php

namespace App\Policies;

use App\Models\AcademicYear;
use App\Models\User;

class AcademicYearPolicy
{
    /**
     * Superadmins bypass all authorization checks.
     */
    public function before(User $user): ?bool
    {
        return $user->hasRole('superadmin') ? true : null;
    }

    /**
     * Determine whether the user can view any academic years.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('academic-years.view')
            || $user->hasRole(['academic_director', 'academic_administrator', 'member_coordinator', 'teacher', 'student']);
    }

    /**
     * Determine whether the user can view the academic year.
     */
    public function view(User $user, AcademicYear $academicYear): bool
    {
        return $this->viewAny($user);
    }

    /**
     * Determine whether the user can create academic years.
     */
    public function create(User $user): bool
    {
        return $user->can('academic-years.create')
            || $user->hasRole(['academic_director']);
    }

    /**
     * Determine whether the user can update the academic year.
     */
    public function update(User $user, AcademicYear $academicYear): bool
    {
        return $user->can('academic-years.update')
            || $user->hasRole(['academic_director']);
    }

    /**
     * Determine whether the user can delete the academic year.
     */
    public function delete(User $user, AcademicYear $academicYear): bool
    {
        return $user->can('academic-years.delete');
    }
}
