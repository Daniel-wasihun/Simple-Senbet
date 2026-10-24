<?php

namespace App\Policies;

use App\Models\Member;
use App\Models\TeachingAssignment;
use App\Models\User;

class PromotionPolicy
{
    public function evaluateStudent(User $user, Member $student): bool
    {
        if ($user->hasPermission('promotions.manage')) {
            return true;
        }

        if (! $user->hasPermission('reports.view') || ! $user->hasRole('teacher')) {
            return false;
        }

        return TeachingAssignment::query()
            ->where('teacher_id', $user->id)
            ->where('class_id', $student->class_id)
            ->when($student->section, fn ($query, $section) => $query->where(fn ($q) => $q->whereNull('section')->orWhere('section', $section)))
            ->exists();
    }

    public function dryRun(User $user): bool
    {
        return $user->hasPermission('promotions.manage');
    }

    public function commit(User $user): bool
    {
        return $user->hasPermission('promotions.manage');
    }
}
