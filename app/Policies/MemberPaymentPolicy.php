<?php

namespace App\Policies;

use App\Models\MemberPayment;
use App\Models\User;

class MemberPaymentPolicy
{
    /**
     * Superadmins bypass all payment checks.
     */
    public function before(User $user): ?bool
    {
        return $user->hasRole('superadmin') ? true : null;
    }

    /**
     * Determine whether the user can view payment records and ledger.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('payments.view')
            || $user->hasRole(['academic_director', 'academic_administrator', 'finance_officer', 'teacher']);
    }

    /**
     * Determine whether the user can view the specific payment record.
     */
    public function view(User $user, ?MemberPayment $payment = null): bool
    {
        return $this->viewAny($user);
    }

    /**
     * Determine whether the user can record payment transactions.
     */
    public function create(User $user): bool
    {
        return $user->can('payments.record')
            || $user->hasRole(['academic_director', 'academic_administrator', 'finance_officer', 'teacher']);
    }

    /**
     * Determine whether the user can void payment transactions.
     */
    public function void(User $user, ?MemberPayment $payment = null): bool
    {
        return $user->can('payments.void')
            || $user->hasRole(['academic_director', 'academic_administrator', 'finance_officer']);
    }

    /**
     * Determine whether the user can export financial statements and CSV reports.
     */
    public function export(User $user): bool
    {
        return $user->can('payments.export')
            || $user->hasRole(['academic_director', 'academic_administrator', 'finance_officer', 'teacher']);
    }

    /**
     * Determine whether the user can manage and configure monthly payment rules.
     */
    public function manageRules(User $user): bool
    {
        return $user->can('payments.rules')
            || $user->hasRole(['academic_director', 'academic_administrator', 'finance_officer']);
    }
}
