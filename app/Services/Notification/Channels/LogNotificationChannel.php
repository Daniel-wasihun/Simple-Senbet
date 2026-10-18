<?php

namespace App\Services\Notification\Channels;

use App\Models\Member;
use Illuminate\Support\Facades\Log;

class LogNotificationChannel implements NotificationChannelInterface
{
    /**
     * Dispatch notification to application log without leaking secrets or sensitive raw data.
     */
    public function send(Member $member, array $reminderData): array
    {
        $safePhone = $member->phone_number ? substr($member->phone_number, 0, 4).'***'.substr($member->phone_number, -2) : 'NONE';
        $messageId = 'LOG-'.uniqid();

        Log::info('Payment reminder dispatched', [
            'message_id' => $messageId,
            'member_id' => $member->id,
            'masked_phone' => $safePhone,
            'billing_month' => $reminderData['billing_month'],
            'remaining_balance' => $reminderData['remaining_balance'],
            'channel' => 'log',
        ]);

        return [
            'success' => true,
            'channel' => 'log',
            'message_id' => $messageId,
        ];
    }
}
