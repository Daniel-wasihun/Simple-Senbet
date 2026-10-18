<?php

namespace App\Services;

use App\Models\Member;
use App\Models\MemberPayment;
use App\Models\SchoolClass;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;

class PaymentDashboardService
{
    public function __construct(protected PaymentRuleService $ruleService) {}

    /**
     * Compute reconciled payment dashboard metrics for a specified month.
     *
     * @param  string  $paymentMonth  Format: YYYY-MM
     */
    public function getDashboardSummary(string $paymentMonth, ?int $classId = null): array
    {
        $membersQuery = Member::with('schoolClass')
            ->when($classId, fn ($q, $cid) => $q->where('class_id', $cid));

        $members = $membersQuery->get();

        $totalExpected = 0.00;
        $totalCollected = 0.00;
        $totalCollectedEligible = 0.00;
        $totalRemaining = 0.00;

        $fullyPaidCount = 0;
        $partiallyPaidCount = 0;
        $unpaidCount = 0;
        $overpaidCount = 0;
        $exemptCount = 0;

        foreach ($members as $member) {
            $eval = $this->ruleService->evaluateMemberEligibility($member, $paymentMonth);
            $expected = (float) $eval['expected_amount'];
            $isEligible = (bool) $eval['eligible'];

            // Fetch active payments for this member and month
            $payments = MemberPayment::where('member_id', $member->id)
                ->where('payment_month', $paymentMonth)
                ->where('is_void', false)
                ->get();

            $totalPaid = round((float) $payments->sum('paid_amount'), 2);
            $totalCollected += $totalPaid;

            if (! $isEligible) {
                // Ineligible or exempt members: obligation is 0, do not count as unpaid
                $exemptCount++;
                continue;
            }

            $totalExpected += $expected;
            $remaining = max(0.00, round($expected - $totalPaid, 2));
            $totalRemaining += $remaining;

            // Collected towards eligible obligations (capped at expected to avoid inflation)
            $totalCollectedEligible += min($totalPaid, $expected);

            if ($totalPaid <= 0.00) {
                $unpaidCount++;
            } elseif ($totalPaid < $expected) {
                $partiallyPaidCount++;
            } elseif ($totalPaid > $expected) {
                $overpaidCount++;
            } else {
                $fullyPaidCount++;
            }
        }

        $totalExpected = round($totalExpected, 2);
        $totalCollected = round($totalCollected, 2);
        $totalRemaining = round($totalRemaining, 2);

        $collectionRate = ($totalExpected > 0.00)
            ? round(($totalCollectedEligible / $totalExpected) * 100, 2)
            : 0.00;

        $activeRules = \App\Models\MonthlyPaymentRule::where('is_active', true)->get();

        return [
            'payment_month' => $paymentMonth,
            'billing_month' => $paymentMonth,
            'filter_class_id' => $classId,
            'metrics' => [
                'expected_amount' => $totalExpected,
                'collected_amount' => $totalCollected,
                'remaining_amount' => $totalRemaining,
                'collection_rate' => $collectionRate,
                'total_members' => $members->count(),
                'fully_paid_count' => $fullyPaidCount,
                'partially_paid_count' => $partiallyPaidCount,
                'unpaid_count' => $unpaidCount,
                'overpaid_count' => $overpaidCount,
                'exempt_count' => $exemptCount,
            ],
            'financial_summary' => [
                'total_expected' => $totalExpected,
                'total_collected' => $totalCollected,
                'total_remaining' => $totalRemaining,
                'total_overpaid' => 0.00,
                'collection_rate_percent' => $collectionRate,
            ],
            'member_counts' => [
                'total_members' => $members->count(),
                'eligible_members' => $members->count() - $exemptCount,
                'paid_members' => $fullyPaidCount,
                'partial_members' => $partiallyPaidCount,
                'unpaid_members' => $unpaidCount,
                'overpaid_members' => $overpaidCount,
                'exempt_members' => $exemptCount,
            ],
            'active_rules' => $activeRules,
        ];
    }

    /**
     * Get searchable, paginated member payment table rows with status calculation.
     */
    public function getMembersLedger(string $paymentMonth, array $filters = []): LengthAwarePaginator
    {
        $classId = isset($filters['class_id']) && $filters['class_id'] !== '' ? (int) $filters['class_id'] : null;
        $statusFilter = ! empty($filters['status']) ? strtoupper((string) $filters['status']) : null;
        $search = ! empty($filters['search']) ? trim((string) $filters['search']) : null;
        $page = isset($filters['page']) ? (int) $filters['page'] : 1;
        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 15;

        $query = Member::with('schoolClass')
            ->when($classId, fn ($q, $cid) => $q->where('class_id', $cid))
            ->when($search, function ($q, $s) {
                $q->where(function ($sub) use ($s) {
                    $sub->where('id', $s)
                        ->orWhere('full_name->en', 'like', "%{$s}%")
                        ->orWhere('full_name->am', 'like', "%{$s}%")
                        ->orWhere('phone_number', 'like', "%{$s}%");
                });
            })
            ->orderBy('id');

        $allMembers = $query->get();

        $rows = [];
        foreach ($allMembers as $member) {
            $eval = $this->ruleService->evaluateMemberEligibility($member, $paymentMonth);
            $expected = (float) $eval['expected_amount'];
            $isEligible = (bool) $eval['eligible'];

            $payments = MemberPayment::where('member_id', $member->id)
                ->where('payment_month', $paymentMonth)
                ->where('is_void', false)
                ->latest('payment_date')
                ->get();

            $totalPaid = round((float) $payments->sum('paid_amount'), 2);
            $remaining = max(0.00, round($expected - $totalPaid, 2));

            // Status determination
            if (! $isEligible) {
                $status = ($totalPaid > 0) ? 'OVERPAID' : 'EXEMPT';
            } elseif ($totalPaid <= 0.00) {
                $status = 'UNPAID';
            } elseif ($totalPaid < $expected) {
                $status = 'PARTIAL';
            } elseif ($totalPaid > $expected) {
                $status = 'OVERPAID';
            } else {
                $status = 'PAID';
            }

            // Apply status filter if set
            if ($statusFilter && $statusFilter !== 'ALL' && $status !== $statusFilter) {
                continue;
            }

            $lastPayment = $payments->first();

            $fullName = is_array($member->full_name) ? ($member->full_name['en'] ?? $member->full_name['am'] ?? '') : (string) $member->full_name;
            $christianName = is_array($member->christian_name) ? ($member->christian_name['en'] ?? $member->christian_name['am'] ?? '') : (string) ($member->christian_name ?? '');
            $className = $member->schoolClass ? (is_array($member->schoolClass->name) ? ($member->schoolClass->name['en'] ?? $member->schoolClass->name['am'] ?? '') : (string) $member->schoolClass->name) : null;
            $overpaidAmount = max(0.00, round($totalPaid - $expected, 2));

            $rows[] = [
                'member' => [
                    'id' => $member->id,
                    'full_name' => $member->full_name,
                    'christian_name' => $member->christian_name,
                    'phone_number' => $member->phone_number,
                ],
                'member_id' => $member->id,
                'member_code' => 'MEM-'.str_pad((string) $member->id, 4, '0', STR_PAD_LEFT),
                'full_name' => $fullName,
                'christian_name' => $christianName,
                'phone_number' => $member->phone_number,
                'class_id' => $member->class_id,
                'class_name' => $className,
                'age' => $eval['age'],
                'class' => $member->schoolClass ? [
                    'id' => $member->schoolClass->id,
                    'name' => $member->schoolClass->name,
                    'code' => $member->schoolClass->code,
                ] : null,
                'section' => $member->section,
                'eligibility' => [
                    'is_eligible' => $isEligible,
                    'status' => $eval['status'],
                    'reason' => $eval['reason'],
                    'description' => $eval['description'],
                ],
                'expected_amount' => $expected,
                'paid_amount' => $totalPaid,
                'remaining_balance' => $remaining,
                'overpaid_amount' => $overpaidAmount,
                'status' => $status,
                'payment_status' => $status,
                'payments_count' => $payments->count(),
                'last_payment_date' => $lastPayment?->payment_date?->toDateString(),
                'last_reference_number' => $lastPayment?->reference_number,
                'last_receipt_number' => $lastPayment?->reference_number,
            ];
        }

        $totalItems = count($rows);
        $offset = ($page - 1) * $perPage;
        $itemsForPage = array_slice($rows, $offset, $perPage);

        return new LengthAwarePaginator(
            $itemsForPage,
            $totalItems,
            $perPage,
            $page,
            ['path' => request()->url(), 'query' => request()->query()]
        );
    }
}
