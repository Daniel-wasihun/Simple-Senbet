<?php

namespace App\Policies;

use App\Enums\AttendanceStatus;
use App\Models\AttendanceSession;
use App\Models\TeachingAssignment;
use App\Models\User;

class AttendanceSessionPolicy
{
    /**
     * Determine whether the user can view any attendance sessions.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasRole('superadmin')
            || $user->hasRole(['academic_director', 'academic_administrator'])
            || $user->hasRole('teacher');
    }

    /**
     * Determine whether the user can view the attendance session.
     */
    public function view(User $user, AttendanceSession $session): bool
    {
        if ($user->hasRole('superadmin') || $user->hasRole(['academic_director', 'academic_administrator'])) {
            return true;
        }

        return $this->isTeacherAssignedToSession($user, $session);
    }

    /**
     * Determine whether the user can create attendance sessions.
     *
     * Supports contextual verification when class, course, and date are provided.
     */
    public function create(User $user, ?int $classId = null, ?int $courseId = null, ?string $date = null): bool
    {
        if ($user->hasRole('superadmin') || $user->hasRole(['academic_director', 'academic_administrator'])) {
            return true;
        }

        if (! $user->hasRole('teacher')) {
            return false;
        }

        // Apply deny-by-default when assignment context cannot be verified
        if ($classId === null) {
            return false;
        }

        $query = TeachingAssignment::query()
            ->where('teacher_id', $user->id)
            ->where('class_id', $classId);

        if ($courseId !== null) {
            $query->where('course_id', $courseId);
        }

        if ($date !== null) {
            $query->activeForDate($date);
        }

        return $query->exists();
    }

    /**
     * Determine whether the user can submit the attendance session.
     *
     * Requires the session to be in draft state and the user to be an assigned teacher or superadmin.
     */
    public function submit(User $user, AttendanceSession $session): bool
    {
        if (! $session->isDraft()) {
            return false;
        }

        if ($user->hasRole('superadmin') || $user->hasRole(['academic_director', 'academic_administrator'])) {
            return true;
        }

        return $this->isTeacherAssignedToSession($user, $session);
    }

    /**
     * Determine whether the user can correct marks for the attendance session.
     *
     * Requires the session to be submitted.
     * Within the D-S1-02 24-hour window: allowed for assigned teachers and superadmins.
     * Past the 24-hour window: strictly requires administrative override authority (superadmin).
     */
    public function correct(User $user, AttendanceSession $session): bool
    {
        if ($session->status !== AttendanceStatus::Submitted) {
            return false;
        }

        if ($session->isTeacherEditable()) {
            if ($user->hasRole('superadmin') || $user->hasRole(['academic_director', 'academic_administrator'])) {
                return true;
            }

            return $this->isTeacherAssignedToSession($user, $session);
        }

        // 24-hour deadline has passed: only administrative override authority is permitted
        return $user->hasRole('superadmin');
    }

    /**
     * Determine whether the user can close the attendance session.
     *
     * Requires the session to be submitted and user to be an administrator.
     * Ordinary teachers cannot close sessions.
     */
    public function close(User $user, AttendanceSession $session): bool
    {
        if ($session->status !== AttendanceStatus::Submitted) {
            return false;
        }

        return $user->hasRole('superadmin') || $user->hasRole(['academic_director', 'academic_administrator']);
    }

    /**
     * Determine whether the user can delete the attendance session.
     */
    public function delete(User $user, AttendanceSession $session): bool
    {
        if ($session->isClosed()) {
            return false;
        }

        return $user->hasRole('superadmin');
    }

    /**
     * Determine if a teacher has an active teaching assignment for the session's class, course, and date.
     */
    protected function isTeacherAssignedToSession(User $user, AttendanceSession $session): bool
    {
        if (! $user->hasRole('teacher')) {
            return false;
        }

        if ($session->class_id === null || $session->date === null) {
            return false;
        }

        $query = TeachingAssignment::query()
            ->where('teacher_id', $user->id)
            ->where('class_id', $session->class_id);

        if ($session->course_id !== null) {
            $query->where('course_id', $session->course_id);
        }

        $query->activeForDate($session->date);

        return $query->exists();
    }
}
