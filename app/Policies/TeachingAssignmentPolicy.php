<?php

namespace App\Policies;

use App\Models\TeachingAssignment;
use App\Models\User;

class TeachingAssignmentPolicy
{
    /**
     * Perform pre-authorization checks.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('superadmin') || $user->primaryRole?->name === 'superadmin' || ($user->role ?? null) === 'superadmin') {
            return true;
        }

        return null;
    }

    /**
     * Determine whether the user can view any teaching assignments.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('teaching-assignments.view');
    }

    /**
     * Determine whether the user can view the teaching assignment.
     */
    public function view(User $user, TeachingAssignment $assignment): bool
    {
        if ($user->hasPermission('teaching-assignments.view') && ! $user->hasRole('teacher')) {
            return true;
        }

        return $user->hasPermission('teaching-assignments.view')
            && $user->hasRole('teacher')
            && (int) $assignment->teacher_id === (int) $user->id;
    }

    /**
     * Determine whether the user can create teaching assignments.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('teaching-assignments.create');
    }

    /**
     * Determine whether the user can update the teaching assignment.
     */
    public function update(User $user, TeachingAssignment $assignment): bool
    {
        return $user->hasPermission('teaching-assignments.update');
    }

    /**
     * Determine whether the user can delete the teaching assignment.
     */
    public function delete(User $user, TeachingAssignment $assignment): bool
    {
        return $user->hasPermission('teaching-assignments.delete');
    }

    /**
     * Determine whether the user can end a teaching assignment.
     */
    public function end(User $user, TeachingAssignment $assignment): bool
    {
        return $this->update($user, $assignment);
    }
}
