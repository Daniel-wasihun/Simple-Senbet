<?php

namespace App\Services;

use App\Models\Member;
use App\Models\MemberPayment;
use App\Models\PaymentAuditLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MemberPaymentService
{
    public function __construct(protected PaymentRuleService $ruleService) {}

    /**
     * Record a member monthly payment transaction with idempotency and audit trail.
     *
     * @param  array{
     *     member_id: int,
     *     payment_month: string,
     *     amount: float|int|string,
     *     payment_date?: string,
     *     payment_method?: string,
     *     reference_number?: string,
     *     notes?: string,
     *     idempotency_key?: string
     * }  $data
     */
    public function recordPayment(array $data, User $recordedBy): MemberPayment
    {
        $memberId = (int) $data['member_id'];
        $paymentMonth = (string) ($data['payment_month'] ?? $data['billing_month'] ?? '');
        $amountPaid = round((float) $data['amount'], 2);

        if ($amountPaid <= 0.00) {
            throw ValidationException::withMessages([
                'amount' => ['Payment amount must be greater than zero.'],
            ]);
        }

        // Idempotency check: if request was already successfully processed with this key, return it
        if (! empty($data['idempotency_key'])) {
            $existing = MemberPayment::where('idempotency_key', $data['idempotency_key'])->first();
            if ($existing) {
                return $existing;
            }
        }

        // Explicit duplicate reference number validation
        $rawRef = ! empty($data['reference_number']) ? trim((string) $data['reference_number']) : (! empty($data['payment_reference']) ? trim((string) $data['payment_reference']) : null);
        if ($rawRef && MemberPayment::where('reference_number', $rawRef)->exists()) {
            throw ValidationException::withMessages([
                'reference_number' => ['The reference number has already been taken.'],
            ]);
        }

        $maxAttempts = 3;
        $attempt = 0;

        while ($attempt < $maxAttempts) {
            $attempt++;
            try {
                return DB::transaction(function () use ($memberId, $paymentMonth, $amountPaid, $data, $recordedBy, $rawRef) {
                    return $this->executeRecordPayment($memberId, $paymentMonth, $amountPaid, $data, $recordedBy, $rawRef);
                });
            } catch (UniqueConstraintViolationException|QueryException $e) {
                $isRefCollision = str_contains($e->getMessage(), 'uq_member_payments_reference_number')
                    || str_contains($e->getMessage(), 'reference_number')
                    || str_contains($e->getMessage(), 'UNIQUE constraint failed: member_payments.reference_number');

                if ($isRefCollision && empty($rawRef) && $attempt < $maxAttempts) {
                    usleep(50000 * $attempt);

                    continue;
                }
                throw $e;
            }
        }

        throw new \RuntimeException('Failed to record payment after maximum retry attempts.');
    }

    /**
     * Execute isolated payment record transaction.
     */
    protected function executeRecordPayment(
        int $memberId,
        string $paymentMonth,
        float $amountPaid,
        array $data,
        User $recordedBy,
        ?string $rawRef
    ): MemberPayment {
        $member = Member::where('id', $memberId)->lockForUpdate()->firstOrFail();

        // Evaluate member's obligation for this month
        $eval = $this->ruleService->evaluateMemberEligibility($member, $paymentMonth);
        $expectedAmount = (float) $eval['expected_amount'];
        $ruleId = $eval['rule']?->id;

        // Fetch prior valid payments for this month
        $priorPayments = MemberPayment::where('member_id', $memberId)
            ->where('payment_month', $paymentMonth)
            ->where('is_void', false)
            ->get();

        // Calculate durable net credit carried forward from earlier months
        $creditCarriedForward = $this->ruleService->calculateNetCreditForMember($member, $paymentMonth);

        $previouslyPaid = round((float) $priorPayments->sum('paid_amount') + $creditCarriedForward, 2);
        $newCumulativePaid = round($previouslyPaid + $amountPaid, 2);

        $remainingBalance = max(0.00, round($expectedAmount - $newCumulativePaid, 2));

        // Status determination
        if ($expectedAmount <= 0.00) {
            $status = 'OVERPAID'; // Paid even though expected was 0 (e.g. voluntary donation)
        } elseif ($newCumulativePaid >= $expectedAmount) {
            $status = ($newCumulativePaid > $expectedAmount) ? 'OVERPAID' : 'PAID';
        } else {
            $status = 'PARTIAL';
        }

        $paymentDate = ! empty($data['payment_date']) ? Carbon::parse($data['payment_date'])->toDateString() : now()->toDateString();
        $referenceNumber = ! empty($rawRef) ? $rawRef : $this->generateReferenceNumber($paymentMonth);

        // Create payment record
        $payment = MemberPayment::create([
            'member_id' => $memberId,
            'payment_rule_id' => $ruleId,
            'payment_month' => $paymentMonth,
            'expected_amount' => $expectedAmount,
            'paid_amount' => $amountPaid,
            'remaining_balance' => $remainingBalance,
            'payment_status' => $status,
            'payment_date' => $paymentDate,
            'payment_method' => strtoupper($data['payment_method'] ?? 'CASH'),
            'reference_number' => $referenceNumber,
            'notes' => $data['notes'] ?? null,
            'idempotency_key' => $data['idempotency_key'] ?? null,
            'recorded_by' => $recordedBy->id,
            'is_void' => false,
        ]);

        // Update remaining_balance on earlier payments of this month to reflect current cumulative state
        MemberPayment::where('member_id', $memberId)
            ->where('payment_month', $paymentMonth)
            ->where('is_void', false)
            ->where('id', '!=', $payment->id)
            ->update([
                'remaining_balance' => $remainingBalance,
                'payment_status' => $status,
            ]);

        // Create Audit Log
        PaymentAuditLog::create([
            'member_payment_id' => $payment->id,
            'action' => 'CREATED',
            'previous_payload' => null,
            'new_payload' => $payment->toArray(),
            'reason' => 'Payment recorded by '.$recordedBy->name,
            'performed_by' => $recordedBy->id,
        ]);

        return $payment;
    }

    /**
     * Void an erroneous or fraudulent payment with mandatory reason and audit entry.
     */
    public function voidPayment(MemberPayment $payment, string $reason, User $voidedBy): MemberPayment
    {
        if ($payment->is_void) {
            throw ValidationException::withMessages([
                'payment' => ['Payment is already voided.'],
            ]);
        }

        if (empty(trim($reason))) {
            throw ValidationException::withMessages([
                'reason' => ['A valid justification reason is required to void a payment.'],
            ]);
        }

        return DB::transaction(function () use ($payment, $reason, $voidedBy) {
            $lockedPayment = MemberPayment::where('id', $payment->id)->lockForUpdate()->firstOrFail();
            $oldPayload = $lockedPayment->toArray();

            $lockedPayment->update([
                'is_void' => true,
                'void_reason' => trim($reason),
                'voided_at' => now(),
                'voided_by' => $voidedBy->id,
            ]);

            // Recalculate cumulative balance for other active payments in this month
            $memberId = $lockedPayment->member_id;
            $month = $lockedPayment->payment_month;
            $expectedAmount = (float) $lockedPayment->expected_amount;

            $remainingPayments = MemberPayment::where('member_id', $memberId)
                ->where('payment_month', $month)
                ->where('is_void', false)
                ->get();

            $totalActivePaid = round((float) $remainingPayments->sum('paid_amount'), 2);
            $newBalance = max(0.00, round($expectedAmount - $totalActivePaid, 2));

            if ($totalActivePaid <= 0.00) {
                $status = ($expectedAmount > 0) ? 'UNPAID' : 'EXEMPT';
            } elseif ($totalActivePaid >= $expectedAmount && $expectedAmount > 0) {
                $status = ($totalActivePaid > $expectedAmount) ? 'OVERPAID' : 'PAID';
            } else {
                $status = 'PARTIAL';
            }

            MemberPayment::where('member_id', $memberId)
                ->where('payment_month', $month)
                ->where('is_void', false)
                ->update([
                    'remaining_balance' => $newBalance,
                    'payment_status' => $status,
                ]);

            PaymentAuditLog::create([
                'member_payment_id' => $lockedPayment->id,
                'action' => 'VOIDED',
                'previous_payload' => $oldPayload,
                'new_payload' => $lockedPayment->fresh()->toArray(),
                'reason' => 'Voided: '.trim($reason),
                'performed_by' => $voidedBy->id,
            ]);

            return $lockedPayment->fresh();
        });
    }

    /**
     * Get complete payment history for a member.
     */
    public function getMemberPaymentHistory(int $memberId): Collection
    {
        return MemberPayment::with(['rule', 'recordedByUser', 'auditLogs'])
            ->where('member_id', $memberId)
            ->orderByDesc('payment_month')
            ->orderByDesc('payment_date')
            ->get();
    }

    /**
     * Generate an auditable sequential receipt reference number.
     */
    public function generateReferenceNumber(string $paymentMonth): string
    {
        $cleanMonth = str_replace('-', '', $paymentMonth);
        $prefix = "RCP-{$cleanMonth}-";

        $latest = MemberPayment::where('reference_number', 'LIKE', $prefix.'%')
            ->lockForUpdate()
            ->orderByDesc('id')
            ->value('reference_number');

        $nextSeq = 1;
        if ($latest && preg_match('/RCP-\d{6}-(\d+)/', $latest, $matches)) {
            $nextSeq = ((int) $matches[1]) + 1;
        } else {
            $nextSeq = MemberPayment::where('payment_month', $paymentMonth)->count() + 1;
        }

        while (MemberPayment::where('reference_number', sprintf('RCP-%s-%04d', $cleanMonth, $nextSeq))->exists()) {
            $nextSeq++;
        }

        return sprintf('RCP-%s-%04d', $cleanMonth, $nextSeq);
    }
}
