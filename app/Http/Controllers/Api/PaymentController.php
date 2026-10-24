<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\RecordPaymentRequest;
use App\Http\Requests\Payment\StorePaymentRuleRequest;
use App\Http\Requests\Payment\VoidPaymentRequest;
use App\Http\Responses\ApiResponse;
use App\Models\Member;
use App\Models\MemberPayment;
use App\Models\MonthlyPaymentRule;
use App\Models\TeachingAssignment;
use App\Services\EthiopianDateService;
use App\Services\MemberPaymentService;
use App\Services\PaymentDashboardService;
use App\Services\PaymentRuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentRuleService $ruleService,
        protected MemberPaymentService $paymentService,
        protected PaymentDashboardService $dashboardService,
        protected EthiopianDateService $ethiopianDateService
    ) {}

    /**
     * List configured monthly payment rules.
     */
    public function rules(): JsonResponse
    {
        $rules = MonthlyPaymentRule::with(['schoolClass', 'minimumSchoolClass', 'creator'])
            ->orderByDesc('effective_from')
            ->get();

        return ApiResponse::success($rules, 'Monthly payment rules retrieved successfully.');
    }

    /**
     * Create a new monthly payment rule.
     */
    public function storeRule(StorePaymentRuleRequest $request): JsonResponse
    {
        $user = $request->user();
        if (! $user->hasRole(['superadmin', 'academic_director', 'academic_administrator', 'finance_officer'])) {
            return ApiResponse::forbidden('Only administrators can configure payment rules.');
        }

        $validated = $request->validated();
        if (isset($validated['target_class_id']) && ! isset($validated['class_id'])) {
            $validated['class_id'] = $validated['target_class_id'];
            unset($validated['target_class_id']);
        }
        if (isset($validated['carry_forward_credit']) && ! isset($validated['allow_credit_carry_forward'])) {
            $validated['allow_credit_carry_forward'] = $validated['carry_forward_credit'];
            unset($validated['carry_forward_credit']);
        }
        $validated['created_by'] = $user->id;

        $rule = MonthlyPaymentRule::create($validated);

        return ApiResponse::created($rule->load(['schoolClass', 'minimumSchoolClass']), 'Payment rule created successfully.');
    }

    /**
     * Get class IDs assigned to the user if teacher, or null if administrator.
     */
    protected function getTeacherAssignedClassIds($user): ?array
    {
        $isAdmin = $user->hasRole(['superadmin', 'academic_director', 'academic_administrator', 'finance_officer']);
        if ($isAdmin) {
            return null;
        }

        return TeachingAssignment::where('teacher_id', $user->id)
            ->pluck('class_id')
            ->unique()
            ->toArray();
    }

    /**
     * Get reconciled monthly payment dashboard metrics.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user->hasRole(['superadmin', 'academic_director', 'academic_administrator', 'finance_officer', 'teacher'])) {
            return ApiResponse::forbidden('You do not have permission to access payment records.');
        }

        $assignedClassIds = $this->getTeacherAssignedClassIds($user);
        $month = (string) $request->query('month', now()->format('Y-m'));
        $classId = $request->query('class_id') ? (int) $request->query('class_id') : null;

        if ($assignedClassIds !== null) {
            if ($classId !== null && ! in_array($classId, $assignedClassIds, true)) {
                return ApiResponse::forbidden('You do not have permission to access payment records for this class.');
            }
        }

        $summary = $this->dashboardService->getDashboardSummary($month, $classId, $assignedClassIds);

        return ApiResponse::success($summary, 'Payment dashboard metrics retrieved successfully.');
    }

    /**
     * Get paginated, filterable member payment ledger.
     */
    public function membersLedger(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user->hasRole(['superadmin', 'academic_director', 'academic_administrator', 'finance_officer', 'teacher'])) {
            return ApiResponse::forbidden('You do not have permission to access payment records.');
        }

        $assignedClassIds = $this->getTeacherAssignedClassIds($user);
        $requestedClassId = $request->query('class_id') ? (int) $request->query('class_id') : null;

        if ($assignedClassIds !== null) {
            if ($requestedClassId !== null && ! in_array($requestedClassId, $assignedClassIds, true)) {
                return ApiResponse::forbidden('You do not have permission to access payment records for this class.');
            }
        }

        $month = (string) $request->query('month', now()->format('Y-m'));
        $filters = [
            'class_id' => $requestedClassId,
            'allowed_class_ids' => $assignedClassIds,
            'status' => $request->query('status'),
            'search' => $request->query('search'),
            'page' => $request->query('page', 1),
            'per_page' => $request->query('per_page', 15),
        ];

        $paginator = $this->dashboardService->getMembersLedger($month, $filters);

        return response()->json([
            'status' => 'success',
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    /**
     * Get a member's complete payment history.
     */
    public function memberHistory(Request $request, Member $member): JsonResponse
    {
        $user = $request->user();
        if (! $user->hasRole(['superadmin', 'academic_director', 'academic_administrator', 'finance_officer', 'teacher'])) {
            return ApiResponse::forbidden('You do not have permission to access payment records.');
        }

        $assignedClassIds = $this->getTeacherAssignedClassIds($user);
        if ($assignedClassIds !== null) {
            if (! $member->class_id || ! in_array($member->class_id, $assignedClassIds, true)) {
                return ApiResponse::forbidden('You do not have permission to access payment history for members outside your assigned classes.');
            }
        }

        $history = $this->paymentService->getMemberPaymentHistory($member->id);

        return ApiResponse::success([
            'member' => [
                'id' => $member->id,
                'full_name' => $member->full_name,
                'christian_name' => $member->christian_name,
                'phone_number' => $member->phone_number,
                'date_of_birth' => $member->date_of_birth?->toDateString(),
            ],
            'payments' => $history,
        ], 'Member payment history retrieved successfully.');
    }

    /**
     * Record a new member payment transaction.
     */
    public function record(RecordPaymentRequest $request): JsonResponse
    {
        $user = $request->user();
        if (! $user->hasRole(['superadmin', 'academic_director', 'academic_administrator', 'finance_officer', 'teacher'])) {
            return ApiResponse::forbidden('You do not have permission to record payments.');
        }

        $assignedClassIds = $this->getTeacherAssignedClassIds($user);
        $memberId = (int) $request->validated()['member_id'];
        $member = Member::findOrFail($memberId);

        if ($assignedClassIds !== null) {
            if (! $member->class_id || ! in_array($member->class_id, $assignedClassIds, true)) {
                return ApiResponse::forbidden('You do not have permission to record payments for members outside your assigned classes.');
            }
        }

        $payment = $this->paymentService->recordPayment($request->validated(), $user);

        return ApiResponse::created($payment->load(['member', 'rule', 'recordedByUser']), 'Payment recorded successfully.');
    }

    /**
     * Void an existing payment.
     */
    public function voidPayment(VoidPaymentRequest $request, MemberPayment $payment): JsonResponse
    {
        $user = $request->user();
        if (! $user->hasRole(['superadmin', 'academic_director', 'academic_administrator', 'finance_officer'])) {
            return ApiResponse::forbidden('Only administrators can void payments.');
        }

        $voided = $this->paymentService->voidPayment($payment, $request->validated()['reason'], $user);

        return ApiResponse::success($voided->load(['member', 'voidedByUser', 'auditLogs']), 'Payment voided successfully.');
    }

    /**
     * Get printable payment receipt data.
     */
    public function receipt(Request $request, MemberPayment $payment): JsonResponse
    {
        $user = $request->user();
        if (! $user->hasRole(['superadmin', 'academic_director', 'academic_administrator', 'finance_officer', 'teacher'])) {
            return ApiResponse::forbidden('You do not have permission to access payment records.');
        }

        $assignedClassIds = $this->getTeacherAssignedClassIds($user);
        if ($assignedClassIds !== null) {
            if (! $payment->member?->class_id || ! in_array($payment->member->class_id, $assignedClassIds, true)) {
                return ApiResponse::forbidden('You do not have permission to access receipts for members outside your assigned classes.');
            }
        }

        $payment->load(['member.schoolClass', 'rule', 'recordedByUser']);

        $ethiopianDate = $payment->payment_date
            ? $this->ethiopianDateService->toEthiopian($payment->payment_date)
            : ($payment->created_at ? $this->ethiopianDateService->toEthiopian($payment->created_at) : null);

        $billingMonthEth = $payment->payment_month
            ? $this->ethiopianDateService->toEthiopian($payment->payment_month.'-01')
            : null;

        return ApiResponse::success([
            'receipt_number' => $payment->reference_number,
            'payment_reference' => $payment->reference_number,
            'payment_month' => $payment->payment_month,
            'billing_month' => $payment->payment_month,
            'payment_date' => $payment->payment_date?->toDateString(),
            'receipt_date' => $payment->payment_date?->toDateString() ?? $payment->created_at?->toDateString(),
            'payment_method' => $payment->payment_method,
            'paid_amount' => (float) $payment->paid_amount,
            'amount' => (float) $payment->paid_amount,
            'expected_amount' => (float) $payment->expected_amount,
            'remaining_balance' => (float) $payment->remaining_balance,
            'payment_status' => $payment->payment_status,
            'is_void' => (bool) $payment->is_void,
            'void_reason' => $payment->void_reason,
            'payment_date_eth' => $ethiopianDate,
            'billing_month_eth' => $billingMonthEth ? [
                'year' => $billingMonthEth['year'],
                'month' => $billingMonthEth['month'],
                'month_name_en' => $billingMonthEth['month_name_en'],
                'month_name_am' => $billingMonthEth['month_name_am'],
                'formatted_am' => $billingMonthEth['month_name_am'].' '.$billingMonthEth['year'].' ዓ.ም.',
                'formatted_en' => $billingMonthEth['month_name_en'].' '.$billingMonthEth['year'].' E.C.',
            ] : null,
            'status' => [
                'expected_amount' => (float) $payment->expected_amount,
                'total_paid_for_month' => (float) $payment->paid_amount,
                'remaining_balance' => (float) $payment->remaining_balance,
                'status' => $payment->payment_status,
            ],
            'member' => [
                'id' => $payment->member->id,
                'member_code' => $payment->member->member_code ?? ('MEM-'.str_pad((string) $payment->member->id, 4, '0', STR_PAD_LEFT)),
                'full_name' => $payment->member->full_name,
                'christian_name' => $payment->member->christian_name,
                'phone_number' => $payment->member->phone_number,
                'class' => $payment->member->schoolClass?->name,
                'class_name' => is_array($payment->member->schoolClass?->name)
                    ? ($payment->member->schoolClass?->name['en'] ?? $payment->member->schoolClass?->name['am'] ?? '')
                    : ($payment->member->schoolClass?->name ?? ''),
                'section' => $payment->member->section,
            ],
            'recorded_by' => $payment->recordedByUser ? [
                'id' => $payment->recordedByUser->id,
                'name' => $payment->recordedByUser->name,
            ] : null,
            'recorded_by_name' => $payment->recordedByUser?->name,
            'recorded_at' => $payment->created_at?->toIso8601String(),
        ], 'Payment receipt generated successfully.');
    }
}
