<?php

namespace App\Services;

use App\Models\Member;
use App\Models\MemberPayment;
use App\Models\MonthlyPaymentRule;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use Carbon\Carbon;
use Carbon\CarbonInterface;

class PaymentRuleService
{
    /**
     * Resolve the applicable payment rule and evaluate a member's eligibility for a given month.
     *
     * @param  string  $paymentMonth  Format: YYYY-MM
     */
    public function evaluateMemberEligibility(Member $member, string $paymentMonth): array
    {
        $monthDate = Carbon::parse($paymentMonth.'-01')->startOfDay();

        // 1. Resolve member's class as of the payment month
        $classId = $this->resolveMemberClassForMonth($member->id, $monthDate) ?? $member->class_id;

        // 2. Fetch active rules effective for this month
        try {
            $rules = MonthlyPaymentRule::query()
                ->where('is_active', true)
                ->whereDate('effective_from', '<=', $monthDate)
                ->where(function ($q) use ($monthDate) {
                    $q->whereNull('effective_to')
                        ->orWhereDate('effective_to', '>=', $monthDate);
                })
                ->orderByDesc('class_id') // Class-specific rules take precedence over global (null class_id)
                ->orderByDesc('effective_from')
                ->get();
        } catch (\Throwable $e) {
            $rules = collect();
        }

        if ($rules->isEmpty()) {
            return [
                'eligible' => false,
                'status' => 'EXEMPT',
                'reason' => 'NO_ACTIVE_RULE',
                'description' => 'No active payment rule is configured for this period.',
                'rule' => null,
                'expected_amount' => 0.00,
                'age' => $this->calculateAgeOnDate($member->date_of_birth, $monthDate),
                'class_id' => $classId,
            ];
        }

        // 3. Find matching rule: prioritize class-specific rule, fallback to global rule
        $applicableRule = null;
        if ($classId) {
            $applicableRule = $rules->firstWhere('class_id', $classId);
        }
        if (! $applicableRule) {
            $applicableRule = $rules->firstWhere('class_id', null);
        }

        if (! $applicableRule) {
            return [
                'eligible' => false,
                'status' => 'EXEMPT',
                'reason' => 'CLASS_EXEMPT',
                'description' => 'No matching payment rule applies to the member\'s class.',
                'rule' => null,
                'expected_amount' => 0.00,
                'age' => $this->calculateAgeOnDate($member->date_of_birth, $monthDate),
                'class_id' => $classId,
            ];
        }

        // 4. Age Eligibility Check
        $age = $this->calculateAgeOnDate($member->date_of_birth, $monthDate);
        if ($applicableRule->minimum_age !== null) {
            if ($age === null) {
                return [
                    'eligible' => false,
                    'status' => 'INELIGIBLE',
                    'reason' => 'MISSING_DOB',
                    'description' => 'Member has no recorded date of birth; age requirement cannot be verified.',
                    'rule' => $applicableRule,
                    'expected_amount' => 0.00,
                    'age' => null,
                    'class_id' => $classId,
                ];
            }

            if ($age < $applicableRule->minimum_age) {
                return [
                    'eligible' => false,
                    'status' => 'INELIGIBLE',
                    'reason' => 'UNDERAGE',
                    'description' => "Member age ({$age}) is below minimum required age ({$applicableRule->minimum_age}).",
                    'rule' => $applicableRule,
                    'expected_amount' => 0.00,
                    'age' => $age,
                    'class_id' => $classId,
                ];
            }
        }

        // 5. Minimum Class Progression Check
        if ($applicableRule->minimum_class_id !== null) {
            if (! $classId) {
                return [
                    'eligible' => false,
                    'status' => 'INELIGIBLE',
                    'reason' => 'UNASSIGNED_CLASS',
                    'description' => 'Member has no class assignment to satisfy minimum class requirement.',
                    'rule' => $applicableRule,
                    'expected_amount' => 0.00,
                    'age' => $age,
                    'class_id' => null,
                ];
            }

            if (! $this->isClassAtOrAboveMinimum($classId, (int) $applicableRule->minimum_class_id)) {
                return [
                    'eligible' => false,
                    'status' => 'INELIGIBLE',
                    'reason' => 'CLASS_BELOW_MINIMUM',
                    'description' => 'Member\'s class is below the minimum required class for this rule.',
                    'rule' => $applicableRule,
                    'expected_amount' => 0.00,
                    'age' => $age,
                    'class_id' => $classId,
                ];
            }
        }

        return [
            'eligible' => true,
            'status' => 'ELIGIBLE',
            'reason' => 'ELIGIBLE',
            'description' => 'Eligible for monthly member contribution.',
            'rule' => $applicableRule,
            'expected_amount' => (float) $applicableRule->amount,
            'age' => $age,
            'class_id' => $classId,
        ];
    }

    /**
     * Calculate age in full years as of a specific date.
     */
    public function calculateAgeOnDate(CarbonInterface|string|null $dateOfBirth, CarbonInterface $asOfDate): ?int
    {
        if (! $dateOfBirth) {
            return null;
        }

        $dob = is_string($dateOfBirth) ? Carbon::parse($dateOfBirth) : $dateOfBirth;

        if ($dob->gt($asOfDate)) {
            return 0;
        }

        return $dob->diffInYears($asOfDate);
    }

    /**
     * Resolve member's active class for a specific calendar date.
     */
    protected function resolveMemberClassForMonth(int $memberId, CarbonInterface $date): ?int
    {
        $enrollment = StudentEnrollment::where('member_id', $memberId)
            ->whereDate('start_date', '<=', $date->toDateString())
            ->where(function ($q) use ($date) {
                $q->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', $date->toDateString());
            })
            ->latest('start_date')
            ->first();

        return $enrollment?->class_id;
    }

    /**
     * Determine if a given class is equal to or higher in the progression chain than minimum_class_id.
     */
    protected function isClassAtOrAboveMinimum(int $classId, int $minimumClassId): bool
    {
        if ($classId === $minimumClassId) {
            return true;
        }

        // Trace the next_class_id progression from minimum_class_id
        $currentId = $minimumClassId;
        $visited = [];

        while ($currentId && ! in_array($currentId, $visited, true)) {
            $visited[] = $currentId;
            $class = SchoolClass::find($currentId);
            if (! $class || ! $class->next_class_id) {
                break;
            }
            if ((int) $class->next_class_id === $classId) {
                return true;
            }
            $currentId = (int) $class->next_class_id;
        }

        // If not in forward chain, check numeric ID order as fallback
        return $classId >= $minimumClassId;
    }

    /**
     * Compute durable net carry-forward credit available for a member entering a billing month.
     *
     * Net Credit = max(0.00, sum(prior_paid) - sum(prior_expected))
     */
    public function calculateNetCreditForMember(Member $member, string $paymentMonth): float
    {
        $eval = $this->evaluateMemberEligibility($member, $paymentMonth);
        if (! ($eval['rule']?->allow_credit_carry_forward)) {
            return 0.00;
        }

        $allPriorPayments = MemberPayment::where('member_id', $member->id)
            ->where('payment_month', '<', $paymentMonth)
            ->where('is_void', false)
            ->get()
            ->groupBy('payment_month');

        if ($allPriorPayments->isEmpty()) {
            return 0.00;
        }

        $earliestMonth = $allPriorPayments->keys()->sort()->first();
        $start = Carbon::parse($earliestMonth.'-01')->startOfDay();
        $target = Carbon::parse($paymentMonth.'-01')->startOfDay();

        $totalPriorPaid = 0.00;
        $totalPriorExpected = 0.00;

        $cursor = $start->copy();
        while ($cursor->lt($target)) {
            $m = $cursor->format('Y-m');
            $group = $allPriorPayments->get($m);

            if ($group && $group->isNotEmpty()) {
                $totalPriorPaid += (float) $group->sum('paid_amount');
                $totalPriorExpected += (float) $group->first()->expected_amount;
            } else {
                $mEval = $this->evaluateMemberEligibility($member, $m);
                if ($mEval['eligible']) {
                    $totalPriorExpected += (float) $mEval['expected_amount'];
                }
            }

            $cursor->addMonth();
        }

        return max(0.00, round($totalPriorPaid - $totalPriorExpected, 2));
    }
}
