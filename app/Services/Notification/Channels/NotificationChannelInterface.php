<?php

namespace App\Services\Notification\Channels;

use App\Models\Member;

interface NotificationChannelInterface
{
    /**
     * Send monthly payment reminder to the member.
     *
     * @param  array{
     *     billing_month: string,
     *     expected_amount: float,
     *     paid_amount: float,
     *     remaining_balance: float,
     *     due_date: string,
     *     ethiopian_month: string,
     *     school_name: string
     * }  $reminderData
     * @return array{success: bool, channel: string, message_id?: string, error?: string}
     */
    public function send(Member $member, array $reminderData): array;
}
