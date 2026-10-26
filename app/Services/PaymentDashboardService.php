<?php

namespace App\Services;

use App\Models\Member;
use App\Models\MemberPayment;
use App\Models\MonthlyPaymentRule;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PaymentDashboardService
{
    public function __construct(protected PaymentRuleService $ruleService) {}

    /**
     * Compute reconciled payment dashboard metrics for a specified month.
     *
     * @param  string  $paymentMonth  Format: YYYY-MM
     */
    public function getDashboardSummary(string $paymentMonth, ?int $classId = null, ?array $allowedClassIds = null): array
    {
        $membersQuery = Member::with('schoolClass')
            ->when($classId, fn ($q, $cid) => $q->where('class_id', $cid))
            ->when($allowedClassIds !== null, fn ($q) => $q->whereIn('class_id', $allowedClassIds));

        $members = $membersQuery->get();

        if ($members->isEmpty()) {
            return $this->emptyDashboardSummary($paymentMonth, $classId);
        }

        $context = $this->buildBatchContext($members, $paymentMonth);

        $totalExpected = 0.00;
        $totalCollected = 0.00;
        $totalCollectedEligible = 0.00;
        $totalRemaining = 0.00;
        $totalOverpaid = 0.00;

        $fullyPaidCount = 0;
        $partiallyPaidCount = 0;
        $unpaidCount = 0;
        $overpaidCount = 0;
        $exemptCount = 0;

        foreach ($members as $member) {
            $eval = $this->ruleService->evaluateMemberEligibility($member, $paymentMonth, $context);
            $expected = (float) $eval['expected_amount'];
            $isEligible = (bool) $eval['eligible'];

            $payments = $context['payments']->get($member->id, collect());
            $credit = $this->ruleService->calculateNetCreditForMember($member, $paymentMonth, $context);
            $paidThisMonth = round((float) $payments->sum('paid_amount'), 2);
            $effectivePaid = round($paidThisMonth + $credit, 2);
            $totalCollected += $paidThisMonth;

            if (! $isEligible) {
                // Ineligible or exempt members: obligation is 0, do not count as unpaid
                $exemptCount++;
                if ($paidThisMonth > 0) {
                    $totalOverpaid += $paidThisMonth;
                }

                continue;
            }

            $totalExpected += $expected;
            $remaining = max(0.00, round($expected - $effectivePaid, 2));
            $totalRemaining += $remaining;

            // Collected towards eligible obligations (capped at expected to avoid inflation)
            $totalCollectedEligible += min($effectivePaid, $expected);

            if ($effectivePaid > $expected) {
                $totalOverpaid += round($effectivePaid - $expected, 2);
            }

            if ($effectivePaid <= 0.00) {
                $unpaidCount++;
            } elseif ($effectivePaid < $expected) {
                $partiallyPaidCount++;
            } elseif ($effectivePaid > $expected) {
                $overpaidCount++;
            } else {
                $fullyPaidCount++;
            }
        }

        $totalExpected = round($totalExpected, 2);
        $totalCollected = round($totalCollected, 2);
        $totalRemaining = round($totalRemaining, 2);
        $totalOverpaid = round($totalOverpaid, 2);

        $collectionRate = ($totalExpected > 0.00)
            ? round(($totalCollectedEligible / $totalExpected) * 100, 2)
            : 0.00;

        $activeRules = $context['rules'] ?? collect();

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
                'total_overpaid' => $totalOverpaid,
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
        $allowedClassIds = isset($filters['allowed_class_ids']) ? (array) $filters['allowed_class_ids'] : null;
        $statusFilter = ! empty($filters['status']) ? strtoupper((string) $filters['status']) : null;
        $search = ! empty($filters['search']) ? trim((string) $filters['search']) : null;
        $page = isset($filters['page']) ? max(1, (int) $filters['page']) : 1;
        $perPage = isset($filters['per_page']) ? max(1, (int) $filters['per_page']) : 15;

        $driver = DB::connection()->getDriverName();
        $likeOp = $driver === 'pgsql' ? 'ilike' : 'like';

        $query = Member::with('schoolClass')
            ->when($classId, fn ($q, $cid) => $q->where('class_id', $cid))
            ->when($allowedClassIds !== null, fn ($q) => $q->whereIn('class_id', $allowedClassIds))
            ->when($search, function ($q, $s) use ($likeOp, $driver) {
                $q->where(function ($sub) use ($s, $likeOp, $driver) {
                    if (is_numeric($s)) {
                        $sub->where('id', (int) $s);
                    }
                    $sub->orWhere('full_name->en', $likeOp, "%{$s}%")
                        ->orWhere('full_name->am', $likeOp, "%{$s}%")
                        ->orWhere('christian_name', $likeOp, "%{$s}%")
                        ->orWhere('phone_number', 'like', "%{$s}%");

                    if ($driver === 'pgsql') {
                        $sub->orWhereRaw('full_name::text ilike ?', ["%{$s}%"]);
                    } else {
                        $sub->orWhereRaw('cast(full_name as text) like ?', ["%{$s}%"]);
                    }
                });
            })
            ->orderBy('id');

        // Database-level pagination when no computed status filter is specified
        if (! $statusFilter || $statusFilter === 'ALL') {
            $totalItems = $query->count();
            $pageMembers = $query->forPage($page, $perPage)->get();

            $context = $this->buildBatchContext($pageMembers, $paymentMonth);
            $rows = $this->computeRowsForMembers($pageMembers, $paymentMonth, $context);

            return new LengthAwarePaginator(
                $rows,
                $totalItems,
                $perPage,
                $page,
                ['path' => request()->url(), 'query' => request()->query()]
            );
        }

        // When filtering by computed status, evaluate all matching members using batch preloading
        $allMembers = $query->get();
        $context = $this->buildBatchContext($allMembers, $paymentMonth);
        $allRows = $this->computeRowsForMembers($allMembers, $paymentMonth, $context, $statusFilter);

        $totalItems = count($allRows);
        $offset = ($page - 1) * $perPage;
        $itemsForPage = array_slice($allRows, $offset, $perPage);

        return new LengthAwarePaginator(
            $itemsForPage,
            $totalItems,
            $perPage,
            $page,
            ['path' => request()->url(), 'query' => request()->query()]
        );
    }

    /**
     * Compute ledger rows for a collection of members using batch context.
     *
     * @param  EloquentCollection<int, Member>|Collection<int, Member>  $members
     */
    protected function computeRowsForMembers(EloquentCollection|Collection $members, string $paymentMonth, array $context, ?string $statusFilter = null): array
    {
        $rows = [];
        foreach ($members as $member) {
            $eval = $this->ruleService->evaluateMemberEligibility($member, $paymentMonth, $context);
            $expected = (float) $eval['expected_amount'];
            $isEligible = (bool) $eval['eligible'];

            $payments = $context['payments']->get($member->id, collect());
            $credit = $this->ruleService->calculateNetCreditForMember($member, $paymentMonth, $context);
            $paidThisMonth = round((float) $payments->sum('paid_amount'), 2);
            $effectivePaid = round($paidThisMonth + $credit, 2);
            $remaining = max(0.00, round($expected - $effectivePaid, 2));

            // Status determination
            if (! $isEligible) {
                $status = ($paidThisMonth > 0) ? 'OVERPAID' : 'EXEMPT';
            } elseif ($effectivePaid <= 0.00) {
                $status = 'UNPAID';
            } elseif ($effectivePaid < $expected) {
                $status = 'PARTIAL';
            } elseif ($effectivePaid > $expected) {
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
            $overpaidAmount = max(0.00, round($effectivePaid - $expected, 2));

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
                'paid_amount' => $paidThisMonth,
                'credit_applied' => $credit,
                'effective_paid' => $effectivePaid,
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

        return $rows;
    }

    /**
     * Build reusable batch context for a collection of members to eliminate N+1 queries.
     *
     * @param  EloquentCollection<int, Member>|Collection<int, Member>  $members
     */
    protected function buildBatchContext(EloquentCollection|Collection $members, string $paymentMonth): array
    {
        if ($members->isEmpty()) {
            return [
                'rules' => collect(),
                'classes' => collect(),
                'enrollments' => collect(),
                'payments' => collect(),
                'prior_payments' => collect(),
            ];
        }

        $monthDate = Carbon::parse($paymentMonth.'-01')->startOfDay();
        $memberIds = $members->pluck('id')->all();

        // 1. Fetch active rules for this month (1 query)
        try {
            $rules = MonthlyPaymentRule::query()
                ->where('is_active', true)
                ->whereDate('effective_from', '<=', $monthDate)
                ->where(function ($q) use ($monthDate) {
                    $q->whereNull('effective_to')
                        ->orWhereDate('effective_to', '>=', $monthDate);
                })
                ->orderByDesc('class_id')
                ->orderByDesc('effective_from')
                ->get();
        } catch (\Throwable $e) {
            $rules = collect();
        }

        // 2. Preload all school classes (1 query)
        $classes = SchoolClass::all()->keyBy('id');

        // 3. Preload student enrollments for these members (1 query)
        $enrollments = StudentEnrollment::whereIn('member_id', $memberIds)
            ->whereDate('start_date', '<=', $monthDate->toDateString())
            ->where(function ($q) use ($monthDate) {
                $q->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', $monthDate->toDateString());
            })
            ->orderByDesc('start_date')
            ->get()
            ->groupBy('member_id');

        // 4. Preload active payments for this month (1 query)
        $payments = MemberPayment::whereIn('member_id', $memberIds)
            ->where('payment_month', $paymentMonth)
            ->where('is_void', false)
            ->latest('payment_date')
            ->get()
            ->groupBy('member_id');

        // 5. Preload prior payments if any active rule allows credit carry-forward (1 query)
        $hasCarryForward = $rules->contains(fn ($r) => (bool) $r->allow_credit_carry_forward);
        $priorPayments = collect();
        if ($hasCarryForward) {
            $priorPayments = MemberPayment::whereIn('member_id', $memberIds)
                ->where('payment_month', '<', $paymentMonth)
                ->where('is_void', false)
                ->get()
                ->groupBy('member_id');
        }

        return [
            'rules' => $rules,
            'classes' => $classes,
            'enrollments' => $enrollments,
            'payments' => $payments,
            'prior_payments' => $priorPayments,
        ];
    }

    /**
     * Return empty dashboard structure when no members match filters.
     */
    protected function emptyDashboardSummary(string $paymentMonth, ?int $classId): array
    {
        return [
            'payment_month' => $paymentMonth,
            'billing_month' => $paymentMonth,
            'filter_class_id' => $classId,
            'metrics' => [
                'expected_amount' => 0.00,
                'collected_amount' => 0.00,
                'remaining_amount' => 0.00,
                'collection_rate' => 0.00,
                'total_members' => 0,
                'fully_paid_count' => 0,
                'partially_paid_count' => 0,
                'unpaid_count' => 0,
                'overpaid_count' => 0,
                'exempt_count' => 0,
            ],
            'financial_summary' => [
                'total_expected' => 0.00,
                'total_collected' => 0.00,
                'total_remaining' => 0.00,
                'total_overpaid' => 0.00,
                'collection_rate_percent' => 0.00,
            ],
            'member_counts' => [
                'total_members' => 0,
                'eligible_members' => 0,
                'paid_members' => 0,
                'partial_members' => 0,
                'unpaid_members' => 0,
                'overpaid_members' => 0,
                'exempt_members' => 0,
            ],
            'active_rules' => collect(),
        ];
    }
}
