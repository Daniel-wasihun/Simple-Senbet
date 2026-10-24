<?php

namespace App\Policies;

use App\Models\TeachingAssignment;
use App\Models\User;

class TeachingAssignmentPolicy
{
    /**
     * Superadmins bypass all authorization checks.
     */
    public function before(User $user): ?bool
    {
        return $user->hasRole('superadmin') ? true : null;
    }

    /**
     * Determine whether the user can view any teaching assignments.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('teaching-assignments.view')
            || $user->hasRole(['academic_director', 'academic_administrator', 'attendance_officer', 'teacher']);
    }

    /**
     * Determine whether the user can view the teaching assignment.
     */
    public function view(User $user, TeachingAssignment $assignment): bool
    {
        if ($user->can('teaching-assignments.view') || $user->hasRole(['academic_director', 'academic_administrator'])) {
            return true;
        }

        return (int) $assignment->teacher_id === (int) $user->id;
    }

    /**
     * Determine whether the user can create teaching assignments.
     */
    public function create(User $user): bool
    {
        return $user->can('teaching-assignments.create')
            || $user->hasRole(['academic_director', 'academic_administrator']);
    }

    /**
     * Determine whether the user can update the teaching assignment.
     */
    public function update(User $user, TeachingAssignment $assignment): bool
    {
        return $user->can('teaching-assignments.update')
            || $user->hasRole(['academic_director', 'academic_administrator']);
    }

    /**
     * Determine whether the user can delete the teaching assignment.
     */
    public function delete(User $user, TeachingAssignment $assignment): bool
    {
        return $user->can('teaching-assignments.delete')
            || $user->hasRole(['academic_director']);
    }

    /**
     * Determine whether the user can end a teaching assignment.
     */
    public function end(User $user, TeachingAssignment $assignment): bool
    {
        return $this->update($user, $assignment);
    }
}
