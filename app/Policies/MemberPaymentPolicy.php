<?php

namespace App\Policies;

use App\Models\MemberPayment;
use App\Models\User;

class MemberPaymentPolicy
{
    /**
     * Determine whether the user can view payment records and ledger.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('payments.view');
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
        return $user->hasPermission('payments.record');
    }

    /**
     * Determine whether the user can void payment transactions.
     */
    public function void(User $user, ?MemberPayment $payment = null): bool
    {
        return $user->hasPermission('payments.void');
    }

    /**
     * Determine whether the user can export financial statements and CSV reports.
     */
    public function export(User $user): bool
    {
        return $user->hasPermission('payments.export');
    }

    /**
     * Determine whether the user can manage and configure monthly payment rules.
     */
    public function manageRules(User $user): bool
    {
        return $user->hasPermission('payments.rules');
    }
}
