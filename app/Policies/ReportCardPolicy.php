<?php

namespace App\Policies;

use App\Models\Member;
use App\Models\SchoolClass;
use App\Models\TeachingAssignment;
use App\Models\User;

class ReportCardPolicy
{
    public function viewStudent(User $user, Member $student): bool
    {
        if (! $user->hasPermission('reports.view')) {
            return false;
        }

        if ($user->hasPermission('reports.view.all')) {
            return true;
        }

        if (! $user->hasRole('teacher')) {
            return false;
        }

        return TeachingAssignment::query()
            ->where('teacher_id', $user->id)
            ->where('class_id', $student->class_id)
            ->when($student->section, fn ($query, $section) => $query->where(fn ($q) => $q->whereNull('section')->orWhere('section', $section)))
            ->exists();
    }

    public function viewClass(User $user, SchoolClass $schoolClass): bool
    {
        if (! $user->hasPermission('reports.view')) {
            return false;
        }

        return $user->hasPermission('reports.view.all')
            || ($user->hasRole('teacher')
                && TeachingAssignment::query()->where('teacher_id', $user->id)->where('class_id', $schoolClass->id)->exists());
    }

    public function exportClass(User $user, SchoolClass $schoolClass): bool
    {
        if (! $user->hasPermission('reports.export')) {
            return false;
        }

        return $user->hasPermission('reports.export.all')
            || ($user->hasRole('teacher')
                && TeachingAssignment::query()->where('teacher_id', $user->id)->where('class_id', $schoolClass->id)->exists());
    }
}
