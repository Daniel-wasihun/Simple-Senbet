<?php

namespace App\Services\Notification\Channels;

use App\Models\Member;

class InMemoryNotificationChannel implements NotificationChannelInterface
{
    /**
     * @var array<int, array{member: Member, data: array}>
     */
    protected array $dispatched = [];

    protected bool $shouldFail = false;

    public function setShouldFail(bool $shouldFail): void
    {
        $this->shouldFail = $shouldFail;
    }

    public function send(Member $member, array $reminderData): array
    {
        if ($this->shouldFail) {
            return [
                'success' => false,
                'channel' => 'in_memory',
                'error' => 'Simulated provider gateway error.',
            ];
        }

        $messageId = 'MEM-'.uniqid();
        $this->dispatched[] = [
            'member' => $member,
            'data' => $reminderData,
            'message_id' => $messageId,
        ];

        return [
            'success' => true,
            'channel' => 'in_memory',
            'message_id' => $messageId,
        ];
    }

    /**
     * @return array<int, array{member: Member, data: array, message_id: string}>
     */
    public function getDispatched(): array
    {
        return $this->dispatched;
    }

    public function reset(): void
    {
        $this->dispatched = [];
        $this->shouldFail = false;
    }
}
