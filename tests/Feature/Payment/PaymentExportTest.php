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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentExportTest extends TestCase
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

        $adminRole = Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
        $teacherRole = Role::firstOrCreate(['name' => 'teacher', 'guard_name' => 'web']);
        $studentRole = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);

        $this->admin = User::factory()->create(['role_id' => $adminRole->id]);
        $this->admin->syncRoles(['superadmin']);

        $this->teacher = User::factory()->create(['role_id' => $teacherRole->id]);
        $this->teacher->syncRoles(['teacher']);

        $this->student = User::factory()->create(['role_id' => $studentRole->id]);
        $this->student->syncRoles(['student']);

        $this->seniorClass = SchoolClass::create([
            'name' => ['en' => 'Senior Class', 'am' => 'ከፍተኛ ክፍል'],
            'code' => 'SEN1',
            'passing_score' => 50.00,
            'number_of_sections' => 1,
            'next_class_id' => null,
        ]);

        $this->juniorClass = SchoolClass::create([
            'name' => ['en' => 'Junior Class', 'am' => 'መካከለኛ ክፍል'],
            'code' => 'JUN1',
            'passing_score' => 50.00,
            'number_of_sections' => 1,
            'next_class_id' => null,
        ]);

        MonthlyPaymentRule::create([
            'name' => ['en' => 'Standard Dues', 'am' => 'መደበኛ መዋጮ'],
            'amount' => 150.00,
            'minimum_age' => 18,
            'target_class_id' => null,
            'effective_from' => '2026-01-01',
            'carry_forward_credit' => true,
            'is_active' => true,
            'created_by' => $this->admin->id,
        ]);
    }

    public function test_admin_can_export_monthly_summary_csv(): void
    {
        $member = Member::create([
            'full_name' => ['en' => 'Abebe Kebede', 'am' => 'አበበ ከበደ'],
            'date_of_birth' => '1995-05-15',
            'gender' => 'male',
            'phone_number' => '+251911223344',
            'class_id' => $this->seniorClass->id,
        ]);

        MemberPayment::create([
            'member_id' => $member->id,
            'payment_month' => '2026-10',
            'expected_amount' => 150.00,
            'paid_amount' => 150.00,
            'remaining_balance' => 0.00,
            'payment_status' => 'PAID',
            'payment_date' => '2026-10-10',
            'payment_method' => 'CASH',
            'reference_number' => 'RCP-202610-0001',
            'recorded_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->get('/api/payments/export/monthly-summary?month=2026-10');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('payments-summary-2026-10-all.csv', $response->headers->get('Content-Disposition'));

        $content = $response->streamedContent();
        $this->assertStringContainsString('SIMPLE SENBET SUNDAY SCHOOL', $content);
        $this->assertStringContainsString('150.00', $content);
        $this->assertStringContainsString('PAID', $content);
    }

    public function test_formula_injection_cells_are_sanitized_with_quote(): void
    {
        $injectionMember = Member::create([
            'full_name' => ['en' => '=cmd|\' /C calc\'!A0'],
            'date_of_birth' => '1995-05-15',
            'gender' => 'male',
            'phone_number' => '+251911223344',
            'class_id' => $this->seniorClass->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->get('/api/payments/export/monthly-summary?month=2026-10');

        $response->assertStatus(200);
        $content = $response->streamedContent();

        // The malicious string must be prefixed with a single quote to neutralize spreadsheet execution
        $this->assertStringContainsString("'=cmd|' /C calc'!A0", $content);
    }

    public function test_admin_can_export_transactions_csv(): void
    {
        $member = Member::create([
            'full_name' => ['en' => 'Sara Tadesse', 'am' => 'ሳራ ታደሰ'],
            'date_of_birth' => '1998-03-20',
            'gender' => 'female',
            'class_id' => $this->seniorClass->id,
        ]);

        MemberPayment::create([
            'member_id' => $member->id,
            'payment_month' => '2026-10',
            'expected_amount' => 150.00,
            'paid_amount' => 100.00,
            'remaining_balance' => 50.00,
            'payment_status' => 'PARTIAL',
            'payment_date' => '2026-10-15',
            'payment_method' => 'TELEBIRR',
            'reference_number' => 'RCP-TEST-TX-01',
            'recorded_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->get('/api/payments/export/transactions?month=2026-10');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));

        $content = $response->streamedContent();
        $this->assertStringContainsString('RCP-TEST-TX-01', $content);
        $this->assertStringContainsString('TELEBIRR', $content);
        $this->assertStringContainsString('PARTIAL', $content);
        $this->assertStringContainsString('100.00', $content);
    }

    public function test_teacher_scoping_on_export(): void
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

        // Teacher assigned to seniorClass only
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

        // Attempting to export summary for juniorClass -> 403 Forbidden
        $response = $this->actingAs($this->teacher, 'sanctum')
            ->get("/api/payments/export/monthly-summary?month=2026-10&class_id={$this->juniorClass->id}");

        $response->assertStatus(403);

        // Exporting summary for assigned seniorClass -> 200 OK
        $responseSenior = $this->actingAs($this->teacher, 'sanctum')
            ->get("/api/payments/export/monthly-summary?month=2026-10&class_id={$this->seniorClass->id}");

        $responseSenior->assertStatus(200);
    }

    public function test_student_forbidden_from_export(): void
    {
        $responseSummary = $this->actingAs($this->student, 'sanctum')
            ->get('/api/payments/export/monthly-summary?month=2026-10');
        $responseSummary->assertStatus(403);

        $responseTx = $this->actingAs($this->student, 'sanctum')
            ->get('/api/payments/export/transactions?month=2026-10');
        $responseTx->assertStatus(403);
    }

    public function test_invalid_month_format_returns_bad_request(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->get('/api/payments/export/monthly-summary?month=2026-99');

        $response->assertStatus(400);
    }
}
