<?php

namespace App\Services\Notification;

use App\Models\Member;
use App\Models\MemberPayment;
use App\Models\PaymentAuditLog;
use App\Services\EthiopianDateService;
use App\Services\Notification\Channels\NotificationChannelInterface;
use App\Services\PaymentRuleService;
use Carbon\Carbon;

class PaymentReminderService
{
    public function __construct(
        protected PaymentRuleService $ruleService,
        protected EthiopianDateService $ethiopianDateService,
        protected NotificationChannelInterface $channel
    ) {}

    public function setChannel(NotificationChannelInterface $channel): void
    {
        $this->channel = $channel;
    }

    /**
     * Process monthly dues reminder dispatch with idempotency and audit logs.
     *
     * @param  string  $billingMonth  Format: YYYY-MM
     * @return array{
     *     billing_month: string,
     *     is_dry_run: bool,
     *     total_evaluated: int,
     *     eligible_count: int,
     *     settled_count: int,
     *     exempt_count: int,
     *     already_notified_count: int,
     *     queued_count: int,
     *     sent_count: int,
     *     failed_count: int,
     *     details: array<int, array{member_id: int, status: string, remaining_balance: float}>
     * }
     */
    public function processMonthlyReminders(string $billingMonth, bool $dryRun = false, ?int $classId = null): array
    {
        $monthDate = Carbon::parse($billingMonth.'-01')->startOfDay();
        $ethDate = $this->ethiopianDateService->toEthiopian($monthDate);

        $membersQuery = Member::with('schoolClass')
            ->when($classId, fn ($q, $cid) => $q->where('class_id', $cid))
            ->orderBy('id');

        $members = $membersQuery->get();

        $eligibleCount = 0;
        $settledCount = 0;
        $exemptCount = 0;
        $alreadyNotifiedCount = 0;
        $queuedCount = 0;
        $sentCount = 0;
        $failedCount = 0;
        $details = [];

        foreach ($members as $member) {
            $eval = $this->ruleService->evaluateMemberEligibility($member, $billingMonth);
            $expectedAmount = (float) $eval['expected_amount'];
            $isEligible = (bool) $eval['eligible'];

            if (! $isEligible || $expectedAmount <= 0.00) {
                $exemptCount++;
                $details[] = [
                    'member_id' => $member->id,
                    'status' => 'EXEMPT',
                    'reason' => $eval['reason'],
                    'remaining_balance' => 0.00,
                ];

                continue;
            }

            $eligibleCount++;

            // Calculate paid cash and carry-forward credit
            $payments = MemberPayment::where('member_id', $member->id)
                ->where('payment_month', $billingMonth)
                ->where('is_void', false)
                ->get();

            $paidCash = round((float) $payments->sum('paid_amount'), 2);
            $credit = $this->ruleService->calculateNetCreditForMember($member, $billingMonth);
            $totalCovered = round($paidCash + $credit, 2);

            $remainingBalance = max(0.00, round($expectedAmount - $totalCovered, 2));

            // Exclude fully settled members
            if ($remainingBalance <= 0.00) {
                $settledCount++;
                $details[] = [
                    'member_id' => $member->id,
                    'status' => 'SETTLED',
                    'remaining_balance' => 0.00,
                ];

                continue;
            }

            // Member has outstanding dues
            if ($dryRun) {
                $queuedCount++;
                $details[] = [
                    'member_id' => $member->id,
                    'status' => 'DRY_RUN_QUEUED',
                    'remaining_balance' => $remainingBalance,
                ];

                continue;
            }

            // Idempotency check: has a reminder already been dispatched for this member and billing month?
            $alreadySent = PaymentAuditLog::where('action', 'REMINDER_DISPATCHED')
                ->where('reason', 'LIKE', "Dues reminder for {$billingMonth} (Member #{$member->id})%")
                ->exists();

            if ($alreadySent) {
                $alreadyNotifiedCount++;
                $details[] = [
                    'member_id' => $member->id,
                    'status' => 'ALREADY_NOTIFIED',
                    'remaining_balance' => $remainingBalance,
                ];

                continue;
            }

            // Dispatch reminder
            $reminderPayload = [
                'billing_month' => $billingMonth,
                'expected_amount' => $expectedAmount,
                'paid_amount' => $paidCash,
                'credit_applied' => $credit,
                'remaining_balance' => $remainingBalance,
                'due_date' => $monthDate->endOfMonth()->toDateString(),
                'ethiopian_month' => $ethDate['month_name_am'].' '.$ethDate['year'],
                'school_name' => 'Simple Senbet Sunday School',
            ];

            $result = $this->channel->send($member, $reminderPayload);

            if ($result['success']) {
                $sentCount++;

                PaymentAuditLog::create([
                    'member_payment_id' => $payments->first()?->id,
                    'action' => 'REMINDER_DISPATCHED',
                    'previous_payload' => null,
                    'new_payload' => [
                        'member_id' => $member->id,
                        'billing_month' => $billingMonth,
                        'remaining_balance' => $remainingBalance,
                        'channel' => $result['channel'],
                        'message_id' => $result['message_id'] ?? null,
                    ],
                    'reason' => "Dues reminder for {$billingMonth} (Member #{$member->id}) via {$result['channel']}",
                    'performed_by' => null,
                ]);

                $details[] = [
                    'member_id' => $member->id,
                    'status' => 'SENT',
                    'remaining_balance' => $remainingBalance,
                ];
            } else {
                $failedCount++;
                $details[] = [
                    'member_id' => $member->id,
                    'status' => 'FAILED',
                    'error' => $result['error'] ?? 'Unknown error',
                    'remaining_balance' => $remainingBalance,
                ];
            }
        }

        return [
            'billing_month' => $billingMonth,
            'is_dry_run' => $dryRun,
            'total_evaluated' => $members->count(),
            'eligible_count' => $eligibleCount,
            'settled_count' => $settledCount,
            'exempt_count' => $exemptCount,
            'already_notified_count' => $alreadyNotifiedCount,
            'queued_count' => $queuedCount,
            'sent_count' => $sentCount,
            'failed_count' => $failedCount,
            'details' => $details,
        ];
    }
}
