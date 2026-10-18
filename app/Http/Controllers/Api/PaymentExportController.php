<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\MemberPayment;
use App\Models\SchoolClass;
use App\Models\TeachingAssignment;
use App\Services\EthiopianDateService;
use App\Services\PaymentDashboardService;
use App\Services\PaymentRuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PaymentExportController extends Controller
{
    public function __construct(
        protected PaymentDashboardService $dashboardService,
        protected PaymentRuleService $ruleService,
        protected EthiopianDateService $ethiopianDateService
    ) {}

    /**
     * Export monthly payment summary and member-by-member ledger to CSV.
     */
    public function exportMonthlySummary(Request $request): StreamedResponse|JsonResponse
    {
        $user = $request->user();
        if (! $user->hasRole(['superadmin', 'academic_director', 'academic_administrator', 'teacher'])) {
            return ApiResponse::forbidden('You do not have permission to export payment records.');
        }

        $month = (string) $request->query('month', now()->format('Y-m'));
        if (! preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $month)) {
            return ApiResponse::error('Invalid billing month format. Expected YYYY-MM.', null, 400);
        }

        $classId = $request->query('class_id') ? (int) $request->query('class_id') : null;
        $allowedClassIds = $this->getTeacherAssignedClassIds($user);

        if ($allowedClassIds !== null && $classId !== null && ! in_array($classId, $allowedClassIds, true)) {
            return ApiResponse::forbidden('You do not have permission to export payment data for this class.');
        }

        $summary = $this->dashboardService->getDashboardSummary($month, $classId, $allowedClassIds);
        $ledger = $this->dashboardService->getMembersLedger($month, [
            'class_id' => $classId,
            'allowed_class_ids' => $allowedClassIds,
            'per_page' => 100000,
        ]);

        $className = 'All Classes';
        if ($classId) {
            $class = SchoolClass::find($classId);
            $className = $class ? $this->formatTextValue($class->name) : "Class #{$classId}";
        }

        $filename = sprintf('payments-summary-%s-%s.csv', $month, $classId ? "class-{$classId}" : 'all');
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($summary, $ledger, $month, $className) {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM for Excel compatibility with Ge'ez text
            fwrite($handle, "\xEF\xBB\xBF");

            // Meta Section
            fputcsv($handle, ['SIMPLE SENBET SUNDAY SCHOOL — MONTHLY PAYMENT REPORT']);
            fputcsv($handle, ['Billing Month', $this->sanitizeCsvCell($month)]);
            fputcsv($handle, ['Class Scope', $this->sanitizeCsvCell($className)]);
            fputcsv($handle, ['Exported At', now()->toDateTimeString()]);
            fputcsv($handle, []);

            // Financial Summary Block
            $fin = $summary['financial_summary'];
            $metrics = $summary['metrics'];
            fputcsv($handle, ['FINANCIAL SUMMARY METRICS']);
            fputcsv($handle, [
                'Total Expected (ETB)',
                'Total Collected (ETB)',
                'Total Remaining (ETB)',
                'Total Overpaid (ETB)',
                'Collection Rate (%)',
                'Eligible Members',
                'Fully Paid',
                'Partially Paid',
                'Unpaid',
                'Overpaid',
                'Exempt / Minors',
            ]);
            fputcsv($handle, [
                $this->sanitizeCsvCell(number_format((float) $fin['total_expected'], 2, '.', '')),
                $this->sanitizeCsvCell(number_format((float) $fin['total_collected'], 2, '.', '')),
                $this->sanitizeCsvCell(number_format((float) $fin['total_remaining'], 2, '.', '')),
                $this->sanitizeCsvCell(number_format((float) $fin['total_overpaid'], 2, '.', '')),
                $this->sanitizeCsvCell(number_format((float) $fin['collection_rate_percent'], 2, '.', '')),
                $this->sanitizeCsvCell($summary['member_counts']['eligible_members']),
                $this->sanitizeCsvCell($metrics['fully_paid_count']),
                $this->sanitizeCsvCell($metrics['partially_paid_count']),
                $this->sanitizeCsvCell($metrics['unpaid_count']),
                $this->sanitizeCsvCell($metrics['overpaid_count']),
                $this->sanitizeCsvCell($metrics['exempt_count']),
            ]);
            fputcsv($handle, []);

            // Member Ledger Section
            fputcsv($handle, ['MEMBER STATUS BREAKDOWN']);
            fputcsv($handle, [
                'Member ID',
                'Full Name',
                'Phone Number',
                'Class',
                'Section',
                'Expected Amount (ETB)',
                'Paid This Month (ETB)',
                'Applied Credit (ETB)',
                'Remaining Balance (ETB)',
                'Status',
            ]);

            foreach ($ledger->items() as $item) {
                fputcsv($handle, [
                    $this->sanitizeCsvCell($item['member_id']),
                    $this->sanitizeCsvCell($this->formatTextValue($item['full_name'])),
                    $this->sanitizeCsvCell($item['phone_number'] ?? ''),
                    $this->sanitizeCsvCell($this->formatTextValue($item['class_name'] ?? '')),
                    $this->sanitizeCsvCell($item['section'] ?? ''),
                    $this->sanitizeCsvCell(number_format((float) $item['expected_amount'], 2, '.', '')),
                    $this->sanitizeCsvCell(number_format((float) $item['paid_amount'], 2, '.', '')),
                    $this->sanitizeCsvCell(number_format((float) ($item['credit_applied'] ?? 0.0), 2, '.', '')),
                    $this->sanitizeCsvCell(number_format((float) $item['remaining_balance'], 2, '.', '')),
                    $this->sanitizeCsvCell($item['status']),
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Export raw transaction details to CSV.
     */
    public function exportTransactions(Request $request): StreamedResponse|JsonResponse
    {
        $user = $request->user();
        if (! $user->hasRole(['superadmin', 'academic_director', 'academic_administrator', 'teacher'])) {
            return ApiResponse::forbidden('You do not have permission to export payment records.');
        }

        $month = $request->query('month');
        if ($month && ! preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $month)) {
            return ApiResponse::error('Invalid billing month format. Expected YYYY-MM.', null, 400);
        }

        $classId = $request->query('class_id') ? (int) $request->query('class_id') : null;
        $status = $request->query('status');
        $allowedClassIds = $this->getTeacherAssignedClassIds($user);

        if ($allowedClassIds !== null && $classId !== null && ! in_array($classId, $allowedClassIds, true)) {
            return ApiResponse::forbidden('You do not have permission to export payment data for this class.');
        }

        $query = MemberPayment::with(['member.schoolClass', 'recordedByUser'])
            ->when($month, fn ($q, $m) => $q->where('payment_month', $m))
            ->when($status, fn ($q, $st) => $q->where('payment_status', strtoupper($st)))
            ->when($classId, function ($q, $cid) {
                $q->whereHas('member', fn ($mq) => $mq->where('class_id', $cid));
            })
            ->when($allowedClassIds !== null, function ($q) use ($allowedClassIds) {
                $q->whereHas('member', fn ($mq) => $mq->whereIn('class_id', $allowedClassIds));
            })
            ->orderByDesc('payment_date')
            ->orderByDesc('id');

        $filename = sprintf('payments-transactions-%s.csv', $month ?: 'all');
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'Receipt Number',
                'Payment Date (Gregorian)',
                'Payment Date (Ethiopian)',
                'Member ID',
                'Member Name',
                'Class',
                'Billing Month',
                'Paid Amount (ETB)',
                'Expected Amount (ETB)',
                'Remaining Balance (ETB)',
                'Payment Method',
                'Status',
                'Recorded By',
                'Is Void',
                'Void Reason',
            ]);

            $query->chunk(200, function ($payments) use ($handle) {
                foreach ($payments as $payment) {
                    $ethDate = $payment->payment_date
                        ? $this->ethiopianDateService->toEthiopian($payment->payment_date)
                        : null;

                    fputcsv($handle, [
                        $this->sanitizeCsvCell($payment->reference_number),
                        $this->sanitizeCsvCell($payment->payment_date?->toDateString()),
                        $this->sanitizeCsvCell($ethDate ? $ethDate['formatted_am'] : ''),
                        $this->sanitizeCsvCell($payment->member_id),
                        $this->sanitizeCsvCell($this->formatTextValue($payment->member?->full_name)),
                        $this->sanitizeCsvCell($this->formatTextValue($payment->member?->schoolClass?->name)),
                        $this->sanitizeCsvCell($payment->payment_month),
                        $this->sanitizeCsvCell(number_format((float) $payment->paid_amount, 2, '.', '')),
                        $this->sanitizeCsvCell(number_format((float) $payment->expected_amount, 2, '.', '')),
                        $this->sanitizeCsvCell(number_format((float) $payment->remaining_balance, 2, '.', '')),
                        $this->sanitizeCsvCell($payment->payment_method),
                        $this->sanitizeCsvCell($payment->payment_status),
                        $this->sanitizeCsvCell($payment->recordedByUser?->name ?? 'System'),
                        $this->sanitizeCsvCell($payment->is_void ? 'YES' : 'NO'),
                        $this->sanitizeCsvCell($payment->void_reason ?? ''),
                    ]);
                }
            });

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Get class IDs assigned to the user if teacher, or null if administrator.
     */
    protected function getTeacherAssignedClassIds($user): ?array
    {
        $isAdmin = $user->hasRole(['superadmin', 'academic_director', 'academic_administrator']);
        if ($isAdmin) {
            return null;
        }

        return TeachingAssignment::where('teacher_id', $user->id)
            ->pluck('class_id')
            ->unique()
            ->toArray();
    }

    /**
     * Format potentially localized text value.
     */
    protected function formatTextValue(mixed $value): string
    {
        if (is_array($value)) {
            return $value['en'] ?? $value['am'] ?? (string) reset($value);
        }

        return (string) ($value ?? '');
    }

    /**
     * Sanitize cell value against CSV Formula Injection (=, +, -, @, \t, \r).
     */
    protected function sanitizeCsvCell(mixed $value): string
    {
        $str = (string) ($value ?? '');
        if ($str !== '' && in_array($str[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
            return "'".$str;
        }

        return $str;
    }
}
