<?php

namespace Tests\Feature\Payment;

use App\Models\Member;
use App\Models\MemberPayment;
use App\Models\MonthlyPaymentRule;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\TeachingAssignment;
use App\Models\User;
use App\Services\PaymentDashboardService;
use App\Services\PaymentRuleService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PaymentDashboardPerformanceTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private SchoolClass $classA;
    private SchoolClass $classB;
    private PaymentDashboardService $dashboardService;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
        $this->admin = User::factory()->create(['role_id' => $adminRole->id]);
        $this->admin->syncRoles(['superadmin']);

        $this->dashboardService = app(PaymentDashboardService::class);

        $this->classA = SchoolClass::create([
            'code' => 'CA',
            'name' => ['en' => 'Class Alpha', 'am' => 'ክፍል አልፋ'],
            'passing_score' => 50.00,
            'number_of_sections' => 1,
        ]);

        $this->classB = SchoolClass::create([
            'code' => 'CB',
            'name' => ['en' => 'Class Beta', 'am' => 'ክፍል ቤታ'],
            'passing_score' => 50.00,
            'number_of_sections' => 1,
        ]);

        // Create standard monthly dues rule: 100 ETB, min age 10
        MonthlyPaymentRule::create([
            'name' => ['en' => 'Standard Dues', 'am' => 'መደበኛ ክፍያ'],
            'amount' => 100.00,
            'minimum_age' => 10,
            'effective_from' => '2026-01-01',
            'is_active' => true,
            'allow_credit_carry_forward' => true,
        ]);
    }

    public function test_dashboard_totals_against_known_payment_fixtures(): void
    {
        // Member 1: Fully paid (100)
        $m1 = Member::create([
            'class_id' => $this->classA->id,
            'full_name' => ['en' => 'Student One'],
            'date_of_birth' => '2010-01-01',
            'gender' => 'male',
        ]);
        MemberPayment::create([
            'member_id' => $m1->id,
            'payment_month' => '2026-10',
            'payment_date' => '2026-10-05',
            'paid_amount' => 100.00,
            'expected_amount' => 100.00,
            'payment_status' => 'paid',
            'is_void' => false,
            'recorded_by' => $this->admin->id,
            'reference_number' => 'REC-001',
        ]);

        // Member 2: Partially paid (40 paid, 60 remaining)
        $m2 = Member::create([
            'class_id' => $this->classA->id,
            'full_name' => ['en' => 'Student Two'],
            'date_of_birth' => '2010-01-01',
            'gender' => 'female',
        ]);
        MemberPayment::create([
            'member_id' => $m2->id,
            'payment_month' => '2026-10',
            'payment_date' => '2026-10-06',
            'paid_amount' => 40.00,
            'expected_amount' => 100.00,
            'payment_status' => 'partial',
            'is_void' => false,
            'recorded_by' => $this->admin->id,
            'reference_number' => 'REC-002',
        ]);

        // Member 3: Unpaid (0 paid, 100 remaining)
        $m3 = Member::create([
            'class_id' => $this->classA->id,
            'full_name' => ['en' => 'Student Three'],
            'date_of_birth' => '2010-01-01',
            'gender' => 'male',
        ]);

        // Member 4: Underage / Ineligible (age 5, expected 0, exempt)
        $m4 = Member::create([
            'class_id' => $this->classA->id,
            'full_name' => ['en' => 'Toddler Member'],
            'date_of_birth' => '2021-05-01',
            'gender' => 'male',
        ]);

        $summary = $this->dashboardService->getDashboardSummary('2026-10', $this->classA->id);

        $this->assertEquals(4, $summary['metrics']['total_members']);
        $this->assertEquals(300.00, $summary['metrics']['expected_amount']); // 3 eligible * 100
        $this->assertEquals(140.00, $summary['metrics']['collected_amount']); // 100 + 40
        $this->assertEquals(160.00, $summary['metrics']['remaining_amount']); // 60 + 100
        $this->assertEquals(1, $summary['metrics']['fully_paid_count']);
        $this->assertEquals(1, $summary['metrics']['partially_paid_count']);
        $this->assertEquals(1, $summary['metrics']['unpaid_count']);
        $this->assertEquals(1, $summary['metrics']['exempt_count']);
        $this->assertEquals(46.67, $summary['metrics']['collection_rate']); // (140 / 300) * 100 = 46.67%
    }

    public function test_ledger_database_pagination_and_query_count_scalability(): void
    {
        // Seed 30 members in Class B
        for ($i = 1; $i <= 30; $i++) {
            $member = Member::create([
                'class_id' => $this->classB->id,
                'full_name' => ['en' => "Bench Member {$i}"],
                'date_of_birth' => '2008-01-01',
                'gender' => 'male',
            ]);

            // Give half of them payments
            if ($i % 2 === 0) {
                MemberPayment::create([
                    'member_id' => $member->id,
                    'payment_month' => '2026-10',
                    'payment_date' => '2026-10-01',
                    'paid_amount' => 50.00,
                    'expected_amount' => 100.00,
                    'payment_status' => 'partial',
                    'is_void' => false,
                    'recorded_by' => $this->admin->id,
                    'reference_number' => "BENCH-{$i}",
                ]);
            }
        }

        // 1. Verify page 1 pagination (per_page = 10)
        DB::flushQueryLog();
        DB::enableQueryLog();

        $page1 = $this->dashboardService->getMembersLedger('2026-10', [
            'class_id' => $this->classB->id,
            'page' => 1,
            'per_page' => 10,
        ]);

        $queryCountPage1 = count(DB::getQueryLog());

        $this->assertEquals(10, count($page1->items()));
        $this->assertEquals(30, $page1->total());
        $this->assertEquals(1, $page1->currentPage());
        $this->assertEquals(3, $page1->lastPage());

        // Assert query count is bounded (O(1) database queries, <= 8 queries instead of 60+)
        $this->assertLessThanOrEqual(8, $queryCountPage1, "Page 1 query count must not explode with member count.");

        // 2. Verify summary query count for all 30 members is also bounded
        DB::flushQueryLog();
        $summary = $this->dashboardService->getDashboardSummary('2026-10', $this->classB->id);
        $summaryQueries = count(DB::getQueryLog());

        $this->assertEquals(30, $summary['metrics']['total_members']);
        $this->assertLessThanOrEqual(8, $summaryQueries, "Summary query count must be batched and bounded.");
    }

    public function test_credit_carry_forward_and_no_cross_member_leakage(): void
    {
        $memberA = Member::create([
            'class_id' => $this->classA->id,
            'full_name' => ['en' => 'Member Alpha'],
            'date_of_birth' => '2005-01-01',
            'gender' => 'male',
        ]);

        $memberB = Member::create([
            'class_id' => $this->classA->id,
            'full_name' => ['en' => 'Member Beta'],
            'date_of_birth' => '2005-01-01',
            'gender' => 'female',
        ]);

        // Member A overpaid in September (paid 200 on 100 obligation = 100 credit)
        MemberPayment::create([
            'member_id' => $memberA->id,
            'payment_month' => '2026-09',
            'payment_date' => '2026-09-10',
            'paid_amount' => 200.00,
            'expected_amount' => 100.00,
            'payment_status' => 'paid',
            'is_void' => false,
            'recorded_by' => $this->admin->id,
            'reference_number' => 'SEP-001',
        ]);

        // Member B had no September payment
        $ledger = $this->dashboardService->getMembersLedger('2026-10', [
            'class_id' => $this->classA->id,
        ]);

        $rows = collect($ledger->items())->keyBy('member_id');

        // Member A should have 100 credit applied, effective paid 100, remaining 0, PAID
        $rowA = $rows->get($memberA->id);
        $this->assertNotNull($rowA);
        $this->assertEquals(100.00, $rowA['credit_applied']);
        $this->assertEquals(100.00, $rowA['effective_paid']);
        $this->assertEquals(0.00, $rowA['remaining_balance']);
        $this->assertEquals('PAID', $rowA['status']);

        // Member B should have 0 credit (NO LEAKAGE from Member A), UNPAID
        $rowB = $rows->get($memberB->id);
        $this->assertNotNull($rowB);
        $this->assertEquals(0.00, $rowB['credit_applied']);
        $this->assertEquals(0.00, $rowB['effective_paid']);
        $this->assertEquals(100.00, $rowB['remaining_balance']);
        $this->assertEquals('UNPAID', $rowB['status']);
    }

    public function test_empty_results_handling(): void
    {
        $nonExistentClassId = 999999;
        $summary = $this->dashboardService->getDashboardSummary('2026-10', $nonExistentClassId);

        $this->assertEquals(0, $summary['metrics']['total_members']);
        $this->assertEquals(0.00, $summary['metrics']['expected_amount']);
        $this->assertEquals(0.00, $summary['metrics']['collected_amount']);
        $this->assertEquals(0.00, $summary['metrics']['collection_rate']);

        $ledger = $this->dashboardService->getMembersLedger('2026-10', [
            'class_id' => $nonExistentClassId,
        ]);

        $this->assertEmpty($ledger->items());
        $this->assertEquals(0, $ledger->total());
    }

    public function test_search_and_status_filtering(): void
    {
        $memberM = Member::create([
            'class_id' => $this->classA->id,
            'full_name' => ['en' => 'Michael Scott', 'am' => 'ማይክል ስኮት'],
            'phone_number' => '+251911000111',
            'date_of_birth' => '2000-01-01',
            'gender' => 'male',
        ]);

        $memberD = Member::create([
            'class_id' => $this->classA->id,
            'full_name' => ['en' => 'Dwight Schrute'],
            'phone_number' => '+251911000222',
            'date_of_birth' => '2000-01-01',
            'gender' => 'male',
        ]);

        // Michael pays full 100
        MemberPayment::create([
            'member_id' => $memberM->id,
            'payment_month' => '2026-10',
            'payment_date' => '2026-10-01',
            'paid_amount' => 100.00,
            'expected_amount' => 100.00,
            'payment_status' => 'paid',
            'is_void' => false,
            'recorded_by' => $this->admin->id,
            'reference_number' => 'REC-M',
        ]);

        // Search by Amharic Unicode
        $searchAmharic = $this->dashboardService->getMembersLedger('2026-10', [
            'class_id' => $this->classA->id,
            'search' => 'ማይክል',
        ]);
        $this->assertCount(1, $searchAmharic->items());
        $this->assertEquals($memberM->id, $searchAmharic->items()[0]['member_id']);

        // Search by phone number
        $searchPhone = $this->dashboardService->getMembersLedger('2026-10', [
            'class_id' => $this->classA->id,
            'search' => '000222',
        ]);
        $this->assertCount(1, $searchPhone->items());
        $this->assertEquals($memberD->id, $searchPhone->items()[0]['member_id']);

        // Filter by status PAID
        $paidOnly = $this->dashboardService->getMembersLedger('2026-10', [
            'class_id' => $this->classA->id,
            'status' => 'PAID',
        ]);
        $this->assertCount(1, $paidOnly->items());
        $this->assertEquals($memberM->id, $paidOnly->items()[0]['member_id']);

        // Filter by status UNPAID
        $unpaidOnly = $this->dashboardService->getMembersLedger('2026-10', [
            'class_id' => $this->classA->id,
            'status' => 'UNPAID',
        ]);
        $this->assertCount(1, $unpaidOnly->items());
        $this->assertEquals($memberD->id, $unpaidOnly->items()[0]['member_id']);
    }
}
