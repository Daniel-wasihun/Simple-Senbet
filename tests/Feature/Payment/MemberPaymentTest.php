<?php

namespace Tests\Feature\Payment;

use App\Models\AcademicYear;
use App\Models\Course;
use App\Models\Member;
use App\Models\MemberPayment;
use App\Models\MonthlyPaymentRule;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\TeachingAssignment;
use App\Models\User;
use App\Services\MemberPaymentService;
use App\Services\PaymentDashboardService;
use App\Services\PaymentRuleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MemberPaymentTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $teacher;

    private User $student;

    private SchoolClass $seniorClass;

    private SchoolClass $juniorClass;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);

        // Roles
        $adminRole = Role::findByName('superadmin', 'web');
        $teacherRole = Role::findByName('teacher', 'web');
        $studentRole = Role::findByName('student', 'web');

        $this->admin = User::factory()->create(['role_id' => $adminRole->id]);
        $this->admin->syncRoles(['superadmin']);

        $this->teacher = User::factory()->create(['role_id' => $teacherRole->id]);
        $this->teacher->syncRoles(['teacher']);

        $this->student = User::factory()->create(['role_id' => $studentRole->id]);
        $this->student->syncRoles(['student']);

        // Classes
        $this->seniorClass = SchoolClass::create([
            'name' => ['en' => 'Senior Class', 'am' => 'ከፍተኛ ክፍል'],
            'code' => 'SEN1',
            'passing_score' => 50.00,
            'number_of_sections' => 1,
            'next_class_id' => null,
        ]);

        $this->juniorClass = SchoolClass::create([
            'name' => ['en' => 'Junior Class', 'am' => 'ጀማሪ ክፍል'],
            'code' => 'JUN1',
            'passing_score' => 50.00,
            'number_of_sections' => 1,
            'next_class_id' => $this->seniorClass->id,
        ]);
    }

    public function test_payment_rule_creation_authorization(): void
    {
        // Admin creates a rule
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/payments/rules', [
            'name' => ['en' => 'General Monthly Dues', 'am' => 'መደበኛ የወርሃዊ መዋጮ'],
            'amount' => 100.00,
            'minimum_age' => 18,
            'effective_from' => '2026-01-01',
            'is_active' => true,
        ]);
        $response->assertStatus(201);
        $this->assertDatabaseHas('monthly_payment_rules', [
            'amount' => 100.00,
            'minimum_age' => 18,
        ]);

        // Student is forbidden
        $forbidden = $this->actingAs($this->student, 'sanctum')->postJson('/api/payments/rules', [
            'name' => ['en' => 'Hacked Rule'],
            'amount' => 5.00,
            'effective_from' => '2026-01-01',
        ]);
        $forbidden->assertStatus(403);
    }

    public function test_age_eligibility_and_missing_dob_handling(): void
    {
        $ruleService = app(PaymentRuleService::class);

        MonthlyPaymentRule::create([
            'name' => ['en' => 'Adult Contribution'],
            'amount' => 150.00,
            'minimum_age' => 18,
            'effective_from' => '2026-01-01',
            'is_active' => true,
        ]);

        // Member 1: Adult (22 years old in Oct 2026) -> Eligible
        $adult = Member::create([
            'full_name' => ['en' => 'Adult Member'],
            'date_of_birth' => '2004-05-10',
            'gender' => 'male',
            'class_id' => $this->seniorClass->id,
        ]);
        $eval1 = $ruleService->evaluateMemberEligibility($adult, '2026-10');
        $this->assertTrue($eval1['eligible']);
        $this->assertEquals(150.00, $eval1['expected_amount']);

        // Member 2: Minor (15 years old in Oct 2026) -> Ineligible (UNDERAGE)
        $minor = Member::create([
            'full_name' => ['en' => 'Minor Member'],
            'date_of_birth' => '2011-05-10',
            'gender' => 'female',
            'class_id' => $this->juniorClass->id,
        ]);
        $eval2 = $ruleService->evaluateMemberEligibility($minor, '2026-10');
        $this->assertFalse($eval2['eligible']);
        $this->assertEquals('UNDERAGE', $eval2['reason']);
        $this->assertEquals(0.00, $eval2['expected_amount']);

        // Member 3: Missing date_of_birth -> Ineligible (MISSING_DOB)
        $noDob = Member::create([
            'full_name' => ['en' => 'No DOB Member'],
            'date_of_birth' => null,
            'gender' => 'male',
            'class_id' => $this->seniorClass->id,
        ]);
        $eval3 = $ruleService->evaluateMemberEligibility($noDob, '2026-10');
        $this->assertFalse($eval3['eligible']);
        $this->assertEquals('MISSING_DOB', $eval3['reason']);
        $this->assertEquals(0.00, $eval3['expected_amount']);
    }

    public function test_class_eligibility_and_unassigned_member_handling(): void
    {
        $ruleService = app(PaymentRuleService::class);

        MonthlyPaymentRule::create([
            'name' => ['en' => 'Senior Class Dues'],
            'amount' => 200.00,
            'class_id' => $this->seniorClass->id,
            'effective_from' => '2026-01-01',
            'is_active' => true,
        ]);

        // Member in Senior Class -> Eligible
        $seniorMember = Member::create([
            'full_name' => ['en' => 'Senior Member'],
            'date_of_birth' => '2000-01-01',
            'gender' => 'male',
            'class_id' => $this->seniorClass->id,
        ]);
        $eval1 = $ruleService->evaluateMemberEligibility($seniorMember, '2026-10');
        $this->assertTrue($eval1['eligible']);
        $this->assertEquals(200.00, $eval1['expected_amount']);

        // Member in Junior Class -> Exempt (no rule for junior)
        $juniorMember = Member::create([
            'full_name' => ['en' => 'Junior Member'],
            'date_of_birth' => '2000-01-01',
            'gender' => 'male',
            'class_id' => $this->juniorClass->id,
        ]);
        $eval2 = $ruleService->evaluateMemberEligibility($juniorMember, '2026-10');
        $this->assertFalse($eval2['eligible']);
        $this->assertEquals('CLASS_EXEMPT', $eval2['reason']);

        // Member with no class assignment -> Exempt
        $unassigned = Member::create([
            'full_name' => ['en' => 'Unassigned Member'],
            'date_of_birth' => '2000-01-01',
            'gender' => 'male',
            'class_id' => null,
        ]);
        $eval3 = $ruleService->evaluateMemberEligibility($unassigned, '2026-10');
        $this->assertFalse($eval3['eligible']);
    }

    public function test_recording_full_payment_updates_status_and_balance(): void
    {
        MonthlyPaymentRule::create([
            'name' => ['en' => 'Monthly Contribution'],
            'amount' => 100.00,
            'effective_from' => '2026-01-01',
            'is_active' => true,
        ]);

        $member = Member::create([
            'full_name' => ['en' => 'Dawit Haile'],
            'date_of_birth' => '2000-01-01',
            'gender' => 'male',
            'class_id' => $this->seniorClass->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/payments', [
            'member_id' => $member->id,
            'payment_month' => '2026-10',
            'amount' => 100.00,
            'payment_method' => 'TELEBIRR',
            'reference_number' => 'TEL-12345',
        ]);

        $response->assertStatus(201);
        $data = $response->json('data');

        $this->assertEquals(100.00, $data['expected_amount']);
        $this->assertEquals(100.00, $data['paid_amount']);
        $this->assertEquals(0.00, $data['remaining_balance']);
        $this->assertEquals('PAID', $data['payment_status']);
        $this->assertEquals('TEL-12345', $data['reference_number']);
        $this->assertEquals('TELEBIRR', $data['payment_method']);

        // Assert audit log created
        $this->assertDatabaseHas('payment_audit_logs', [
            'member_payment_id' => $data['id'],
            'action' => 'CREATED',
        ]);
    }

    public function test_recording_partial_payment_and_subsequent_completion(): void
    {
        MonthlyPaymentRule::create([
            'name' => ['en' => 'Monthly Contribution'],
            'amount' => 100.00,
            'effective_from' => '2026-01-01',
            'is_active' => true,
        ]);

        $member = Member::create([
            'full_name' => ['en' => 'Almaz Tefera'],
            'date_of_birth' => '2000-01-01',
            'gender' => 'female',
            'class_id' => $this->seniorClass->id,
        ]);

        // 1. Partial payment: pays 60 ETB out of 100 ETB
        $res1 = $this->actingAs($this->admin, 'sanctum')->postJson('/api/payments', [
            'member_id' => $member->id,
            'payment_month' => '2026-10',
            'amount' => 60.00,
            'payment_method' => 'CASH',
        ]);
        $res1->assertStatus(201);
        $this->assertEquals(40.00, $res1->json('data.remaining_balance'));
        $this->assertEquals('PARTIAL', $res1->json('data.payment_status'));

        // 2. Second payment: pays remaining 40 ETB
        $res2 = $this->actingAs($this->admin, 'sanctum')->postJson('/api/payments', [
            'member_id' => $member->id,
            'payment_month' => '2026-10',
            'amount' => 40.00,
            'payment_method' => 'CASH',
        ]);
        $res2->assertStatus(201);
        $this->assertEquals(0.00, $res2->json('data.remaining_balance'));
        $this->assertEquals('PAID', $res2->json('data.payment_status'));

        // Both payment records now reflect the paid status and 0.00 remaining balance
        $payments = MemberPayment::where('member_id', $member->id)->where('payment_month', '2026-10')->get();
        $this->assertCount(2, $payments);
        $this->assertEquals(100.00, $payments->sum('paid_amount'));
    }

    public function test_recording_overpayment(): void
    {
        MonthlyPaymentRule::create([
            'name' => ['en' => 'Monthly Contribution'],
            'amount' => 100.00,
            'effective_from' => '2026-01-01',
            'is_active' => true,
        ]);

        $member = Member::create([
            'full_name' => ['en' => 'Kassahun Wolde'],
            'date_of_birth' => '2000-01-01',
            'gender' => 'male',
            'class_id' => $this->seniorClass->id,
        ]);

        // Pays 150 ETB when 100 ETB was expected
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/payments', [
            'member_id' => $member->id,
            'payment_month' => '2026-10',
            'amount' => 150.00,
            'payment_method' => 'BANK_TRANSFER',
        ]);

        $response->assertStatus(201);
        $this->assertEquals(100.00, $response->json('data.expected_amount'));
        $this->assertEquals(150.00, $response->json('data.paid_amount'));
        $this->assertEquals(0.00, $response->json('data.remaining_balance'));
        $this->assertEquals('OVERPAID', $response->json('data.payment_status'));
    }

    public function test_idempotency_prevents_duplicate_charge(): void
    {
        MonthlyPaymentRule::create([
            'name' => ['en' => 'Monthly Dues'],
            'amount' => 100.00,
            'effective_from' => '2026-01-01',
            'is_active' => true,
        ]);

        $member = Member::create([
            'full_name' => ['en' => 'Taye Lemma'],
            'date_of_birth' => '2000-01-01',
            'gender' => 'male',
            'class_id' => $this->seniorClass->id,
        ]);

        $idempotencyKey = 'idem-unique-key-999';

        // First attempt
        $res1 = $this->actingAs($this->admin, 'sanctum')->postJson('/api/payments', [
            'member_id' => $member->id,
            'payment_month' => '2026-10',
            'amount' => 100.00,
            'idempotency_key' => $idempotencyKey,
        ]);
        $res1->assertStatus(201);
        $paymentId1 = $res1->json('data.id');

        // Immediate retry with identical idempotency_key
        $res2 = $this->actingAs($this->admin, 'sanctum')->postJson('/api/payments', [
            'member_id' => $member->id,
            'payment_month' => '2026-10',
            'amount' => 100.00,
            'idempotency_key' => $idempotencyKey,
        ]);

        $this->assertTrue(in_array($res2->status(), [200, 201], true));
        $this->assertEquals($paymentId1, $res2->json('data.id'));

        // Assert only 1 payment was created in the database
        $this->assertEquals(1, MemberPayment::where('idempotency_key', $idempotencyKey)->count());
    }

    public function test_voiding_payment_with_audit_reason(): void
    {
        MonthlyPaymentRule::create([
            'name' => ['en' => 'Monthly Dues'],
            'amount' => 100.00,
            'effective_from' => '2026-01-01',
            'is_active' => true,
        ]);

        $member = Member::create([
            'full_name' => ['en' => 'Aster Aweke'],
            'date_of_birth' => '2000-01-01',
            'gender' => 'female',
            'class_id' => $this->seniorClass->id,
        ]);

        $payment = MemberPayment::create([
            'member_id' => $member->id,
            'payment_month' => '2026-10',
            'expected_amount' => 100.00,
            'paid_amount' => 100.00,
            'remaining_balance' => 0.00,
            'payment_status' => 'PAID',
            'payment_date' => '2026-10-15',
            'payment_method' => 'CASH',
            'reference_number' => 'RCP-202610-0001',
            'recorded_by' => $this->admin->id,
        ]);

        // Void the payment
        $response = $this->actingAs($this->admin, 'sanctum')->postJson("/api/payments/{$payment->id}/void", [
            'reason' => 'Cash received was counterfeit bill reported by treasurer',
        ]);

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertTrue($data['is_void']);
        $this->assertEquals('Cash received was counterfeit bill reported by treasurer', $data['void_reason']);
        $this->assertEquals($this->admin->id, $data['voided_by']);

        // Assert audit trail recorded
        $this->assertDatabaseHas('payment_audit_logs', [
            'member_payment_id' => $payment->id,
            'action' => 'VOIDED',
        ]);
    }

    public function test_dashboard_metrics_reconcile_with_individual_members(): void
    {
        $dashboardService = app(PaymentDashboardService::class);
        $paymentService = app(MemberPaymentService::class);

        MonthlyPaymentRule::create([
            'name' => ['en' => 'Standard Monthly Contribution'],
            'amount' => 100.00,
            'minimum_age' => 18,
            'effective_from' => '2026-01-01',
            'is_active' => true,
        ]);

        // 1. Fully paid member: owes 100, pays 100
        $m1 = Member::create(['full_name' => ['en' => 'Member One'], 'date_of_birth' => '2000-01-01', 'gender' => 'male', 'class_id' => $this->seniorClass->id]);
        $paymentService->recordPayment(['member_id' => $m1->id, 'payment_month' => '2026-10', 'amount' => 100.00], $this->admin);

        // 2. Partially paid member: owes 100, pays 40 (remaining 60)
        $m2 = Member::create(['full_name' => ['en' => 'Member Two'], 'date_of_birth' => '2000-01-01', 'gender' => 'male', 'class_id' => $this->seniorClass->id]);
        $paymentService->recordPayment(['member_id' => $m2->id, 'payment_month' => '2026-10', 'amount' => 40.00], $this->admin);

        // 3. Unpaid member: owes 100, pays 0
        $m3 = Member::create(['full_name' => ['en' => 'Member Three'], 'date_of_birth' => '2000-01-01', 'gender' => 'male', 'class_id' => $this->seniorClass->id]);

        // 4. Overpaid member: owes 100, pays 150
        $m4 = Member::create(['full_name' => ['en' => 'Member Four'], 'date_of_birth' => '2000-01-01', 'gender' => 'male', 'class_id' => $this->seniorClass->id]);
        $paymentService->recordPayment(['member_id' => $m4->id, 'payment_month' => '2026-10', 'amount' => 150.00], $this->admin);

        // 5. Ineligible member (Minor): owes 0
        $m5 = Member::create(['full_name' => ['en' => 'Minor Child'], 'date_of_birth' => '2015-01-01', 'gender' => 'male', 'class_id' => $this->juniorClass->id]);

        $summary = $dashboardService->getDashboardSummary('2026-10');
        $metrics = $summary['metrics'];

        // Expected: 4 eligible * 100 = 400.00 (m5 is ineligible, obligation = 0)
        $this->assertEquals(400.00, $metrics['expected_amount']);

        // Collected: 100 (m1) + 40 (m2) + 150 (m4) = 290.00
        $this->assertEquals(290.00, $metrics['collected_amount']);

        // Remaining: m1(0) + m2(60) + m3(100) + m4(0) = 160.00
        $this->assertEquals(160.00, $metrics['remaining_amount']);

        // Counts
        $this->assertEquals(1, $metrics['fully_paid_count']);
        $this->assertEquals(1, $metrics['partially_paid_count']);
        $this->assertEquals(1, $metrics['unpaid_count']);
        $this->assertEquals(1, $metrics['overpaid_count']);
        $this->assertEquals(1, $metrics['exempt_count']); // m5 is exempt, NOT counted as unpaid

        // Collection Rate: (100 + 40 + 100) / 400 = 240 / 400 = 60.00%
        $this->assertEquals(60.00, $metrics['collection_rate']);
    }

    public function test_receipt_generation_endpoint(): void
    {
        $member = Member::create([
            'full_name' => ['en' => 'Receipt Member'],
            'date_of_birth' => '2000-01-01',
            'gender' => 'female',
            'class_id' => $this->seniorClass->id,
        ]);

        $payment = MemberPayment::create([
            'member_id' => $member->id,
            'payment_month' => '2026-10',
            'expected_amount' => 100.00,
            'paid_amount' => 100.00,
            'remaining_balance' => 0.00,
            'payment_status' => 'PAID',
            'payment_date' => '2026-10-18',
            'payment_method' => 'CASH',
            'reference_number' => 'RCP-202610-0088',
            'recorded_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')->getJson("/api/payments/{$payment->id}/receipt");
        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertEquals('RCP-202610-0088', $data['receipt_number']);
        $this->assertEquals(100.00, $data['paid_amount']);
        $this->assertEquals('CASH', $data['payment_method']);
    }

    public function test_read_endpoints_forbidden_for_students(): void
    {
        // Student attempting to access dashboard metrics -> 403
        $resDash = $this->actingAs($this->student, 'sanctum')->getJson('/api/payments/dashboard');
        $resDash->assertStatus(403);

        // Student attempting to access member ledger -> 403
        $resLedger = $this->actingAs($this->student, 'sanctum')->getJson('/api/payments/members');
        $resLedger->assertStatus(403);
    }

    public function test_credit_carry_forward_offsets_next_month_obligation(): void
    {
        $paymentService = app(MemberPaymentService::class);

        MonthlyPaymentRule::create([
            'name' => ['en' => 'Monthly Dues With Carry Forward'],
            'amount' => 50.00,
            'effective_from' => '2026-01-01',
            'is_active' => true,
            'allow_credit_carry_forward' => true,
        ]);

        $member = Member::create([
            'full_name' => ['en' => 'Carry Forward Member'],
            'date_of_birth' => '2000-01-01',
            'gender' => 'male',
            'class_id' => $this->seniorClass->id,
        ]);

        // In 2026-10: owes 50 ETB, pays 100 ETB (overpaid 50 ETB credit)
        $paymentService->recordPayment([
            'member_id' => $member->id,
            'payment_month' => '2026-10',
            'amount' => 100.00,
        ], $this->admin);

        // In 2026-11: owes 50 ETB, member pays 0.01 ETB token or completes payment
        $p2 = $paymentService->recordPayment([
            'member_id' => $member->id,
            'payment_month' => '2026-11',
            'amount' => 0.01,
        ], $this->admin);

        // Because of the 50 ETB carry-forward credit, remaining balance in 2026-11 is 0.00 and status is OVERPAID/PAID
        $this->assertEquals(0.00, (float) $p2->remaining_balance);
        $this->assertEquals('OVERPAID', $p2->payment_status);
    }

    public function test_multi_month_credit_exhaustion_prevents_perpetual_reuse(): void
    {
        $paymentService = app(MemberPaymentService::class);
        $dashboardService = app(PaymentDashboardService::class);

        MonthlyPaymentRule::create([
            'name' => ['en' => 'Monthly Dues Exhaustion Test'],
            'amount' => 50.00,
            'effective_from' => '2026-01-01',
            'is_active' => true,
            'allow_credit_carry_forward' => true,
        ]);

        $member = Member::create([
            'full_name' => ['en' => 'Multi Month Member'],
            'date_of_birth' => '2000-01-01',
            'gender' => 'male',
            'class_id' => $this->seniorClass->id,
        ]);

        // Month 1 (2026-10): Owes 50 ETB, pays 100 ETB (+50 ETB overpayment credit)
        $p1 = $paymentService->recordPayment([
            'member_id' => $member->id,
            'payment_month' => '2026-10',
            'amount' => 100.00,
        ], $this->admin);
        $this->assertEquals(0.00, (float) $p1->remaining_balance);
        $this->assertEquals('OVERPAID', $p1->payment_status);

        // Month 2 (2026-11): Owes 50 ETB.
        // Before paying, ledger should show the 50 ETB credit applied, balance 0.00, status PAID
        $ledgerNov = $dashboardService->getMembersLedger('2026-11', ['search' => (string) $member->id]);
        $rowNov = $ledgerNov->items()[0];
        $this->assertEquals(50.00, (float) $rowNov['credit_applied']);
        $this->assertEquals(0.00, (float) $rowNov['remaining_balance']);
        $this->assertEquals('PAID', $rowNov['status']);

        // Member records token 0.01 ETB in Month 2 (so Month 2 paid_amount = 0.01)
        $p2 = $paymentService->recordPayment([
            'member_id' => $member->id,
            'payment_month' => '2026-11',
            'amount' => 0.01,
        ], $this->admin);
        $this->assertEquals(0.00, (float) $p2->remaining_balance);

        // Month 3 (2026-12): Owes 50 ETB.
        // The 50 ETB credit from Month 1 was fully consumed by Month 2!
        // Credit available entering Month 3 must be exactly 0.01 (the token paid in Month 2), NOT 50.00!
        $ledgerDec = $dashboardService->getMembersLedger('2026-12', ['search' => (string) $member->id]);
        $rowDec = $ledgerDec->items()[0];
        $this->assertEquals(0.01, (float) $rowDec['credit_applied']);
        $this->assertEquals(49.99, (float) $rowDec['remaining_balance']);
        $this->assertEquals('PARTIAL', $rowDec['status']);

        // Member pays 10.00 ETB in Month 3: remaining balance must be 39.99, NOT 0.00!
        $p3 = $paymentService->recordPayment([
            'member_id' => $member->id,
            'payment_month' => '2026-12',
            'amount' => 10.00,
        ], $this->admin);
        $this->assertEquals(39.99, (float) $p3->remaining_balance);
        $this->assertEquals('PARTIAL', $p3->payment_status);
    }

    public function test_dashboard_accounts_for_carry_forward_credit_and_sums_overpaid(): void
    {
        $dashboardService = app(PaymentDashboardService::class);
        $paymentService = app(MemberPaymentService::class);

        MonthlyPaymentRule::create([
            'name' => ['en' => 'Dues Rule'],
            'amount' => 100.00,
            'effective_from' => '2026-01-01',
            'is_active' => true,
            'allow_credit_carry_forward' => true,
        ]);

        $member = Member::create([
            'full_name' => ['en' => 'Overpaid Member'],
            'date_of_birth' => '2000-01-01',
            'gender' => 'male',
            'class_id' => $this->seniorClass->id,
        ]);

        // Member pays 150 in Month 1 (owes 100, overpaid 50)
        $paymentService->recordPayment([
            'member_id' => $member->id,
            'payment_month' => '2026-10',
            'amount' => 150.00,
        ], $this->admin);

        // Dashboard for Month 1 must have total_overpaid == 50.00 (NOT hardcoded 0.00)
        $summaryOct = $dashboardService->getDashboardSummary('2026-10');
        $this->assertEquals(50.00, (float) $summaryOct['financial_summary']['total_overpaid']);

        // In Month 2 (2026-11): member paid 0 in cash, but has 50 carry-forward credit.
        // Dashboard must recognize 50 credit towards the 100 obligation (status PARTIAL, remaining 50, NOT UNPAID)
        $summaryNov = $dashboardService->getDashboardSummary('2026-11');
        $this->assertEquals(1, $summaryNov['metrics']['partially_paid_count']);
        $this->assertEquals(0, $summaryNov['metrics']['unpaid_count']);
        $this->assertEquals(50.00, (float) $summaryNov['metrics']['remaining_amount']);
    }

    public function test_teacher_class_scoping_enforced_on_endpoints(): void
    {
        $academicYear = AcademicYear::create([
            'name' => ['en' => '2026 E.C.'],
            'start_date' => '2026-09-01',
            'end_date' => '2027-06-30',
            'is_current' => true,
        ]);

        $course = Course::create([
            'name' => ['en' => 'General Studies'],
            'code' => 'GEN1',
            'credit_hour' => 3,
            'class_id' => $this->seniorClass->id,
        ]);

        // Assign teacher ONLY to seniorClass
        TeachingAssignment::create([
            'teacher_id' => $this->teacher->id,
            'academic_year_id' => $academicYear->id,
            'class_id' => $this->seniorClass->id,
            'section' => 'A',
            'course_id' => $course->id,
            'semester' => 'semester_1',
            'is_primary' => true,
            'start_date' => '2026-09-01',
        ]);

        MonthlyPaymentRule::create([
            'name' => ['en' => 'Standard Fee'],
            'amount' => 50.00,
            'effective_from' => '2026-01-01',
            'is_active' => true,
        ]);

        $seniorMember = Member::create([
            'full_name' => ['en' => 'Senior Student'],
            'date_of_birth' => '2000-01-01',
            'gender' => 'male',
            'class_id' => $this->seniorClass->id,
        ]);

        $juniorMember = Member::create([
            'full_name' => ['en' => 'Junior Student'],
            'date_of_birth' => '2000-01-01',
            'gender' => 'female',
            'class_id' => $this->juniorClass->id,
        ]);

        // 1. Dashboard: teacher can access assigned seniorClass, forbidden for unassigned juniorClass
        $resSeniorDash = $this->actingAs($this->teacher, 'sanctum')->getJson("/api/payments/dashboard?class_id={$this->seniorClass->id}");
        $resSeniorDash->assertStatus(200);

        $resJuniorDash = $this->actingAs($this->teacher, 'sanctum')->getJson("/api/payments/dashboard?class_id={$this->juniorClass->id}");
        $resJuniorDash->assertStatus(403);

        // 2. Members Ledger: teacher can filter by assigned class, forbidden for unassigned class
        $resSeniorLedger = $this->actingAs($this->teacher, 'sanctum')->getJson("/api/payments/members?class_id={$this->seniorClass->id}");
        $resSeniorLedger->assertStatus(200);

        $resJuniorLedger = $this->actingAs($this->teacher, 'sanctum')->getJson("/api/payments/members?class_id={$this->juniorClass->id}");
        $resJuniorLedger->assertStatus(403);

        // 3. Record Payment: teacher can record for assigned class member, forbidden for unassigned member
        $resSeniorRecord = $this->actingAs($this->teacher, 'sanctum')->postJson('/api/payments/record', [
            'member_id' => $seniorMember->id,
            'payment_month' => '2026-10',
            'amount' => 50.00,
        ]);
        $resSeniorRecord->assertStatus(201);

        $resJuniorRecord = $this->actingAs($this->teacher, 'sanctum')->postJson('/api/payments/record', [
            'member_id' => $juniorMember->id,
            'payment_month' => '2026-10',
            'amount' => 50.00,
        ]);
        $resJuniorRecord->assertStatus(403);

        // 4. Member History: teacher can view assigned member history, forbidden for unassigned member
        $resSeniorHist = $this->actingAs($this->teacher, 'sanctum')->getJson("/api/payments/members/{$seniorMember->id}/history");
        $resSeniorHist->assertStatus(200);

        $resJuniorHist = $this->actingAs($this->teacher, 'sanctum')->getJson("/api/payments/members/{$juniorMember->id}/history");
        $resJuniorHist->assertStatus(403);
    }

    public function test_concurrency_safe_unique_reference_numbers(): void
    {
        $paymentService = app(MemberPaymentService::class);

        MonthlyPaymentRule::create([
            'name' => ['en' => 'Dues Rule'],
            'amount' => 50.00,
            'effective_from' => '2026-01-01',
            'is_active' => true,
        ]);

        $member = Member::create([
            'full_name' => ['en' => 'Seq Member'],
            'date_of_birth' => '2000-01-01',
            'gender' => 'male',
            'class_id' => $this->seniorClass->id,
        ]);

        $refNumbers = [];
        for ($i = 0; $i < 5; $i++) {
            $payment = $paymentService->recordPayment([
                'member_id' => $member->id,
                'payment_month' => '2026-10',
                'amount' => 10.00,
            ], $this->admin);

            $refNumbers[] = $payment->reference_number;
        }

        // Must generate 5 distinct, sequential reference numbers
        $this->assertCount(5, array_unique($refNumbers));
        $this->assertEquals(['RCP-202610-0001', 'RCP-202610-0002', 'RCP-202610-0003', 'RCP-202610-0004', 'RCP-202610-0005'], $refNumbers);
    }
}
