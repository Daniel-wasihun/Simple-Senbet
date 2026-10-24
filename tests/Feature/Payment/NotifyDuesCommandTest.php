<?php

namespace Tests\Feature\Payment;

use App\Models\Member;
use App\Models\MemberPayment;
use App\Models\MonthlyPaymentRule;
use App\Models\PaymentAuditLog;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\User;
use App\Services\Notification\Channels\InMemoryNotificationChannel;
use App\Services\Notification\Channels\NotificationChannelInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotifyDuesCommandTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private SchoolClass $seniorClass;

    private SchoolClass $juniorClass;

    private InMemoryNotificationChannel $notificationChannel;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
        $this->admin = User::factory()->create(['role_id' => $adminRole->id]);
        $this->admin->syncRoles(['superadmin']);

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
            'name' => ['en' => 'General Dues', 'am' => 'ጠቅላላ መዋጮ'],
            'amount' => 100.00,
            'minimum_age' => 18,
            'target_class_id' => null,
            'effective_from' => '2026-01-01',
            'carry_forward_credit' => true,
            'is_active' => true,
            'created_by' => $this->admin->id,
        ]);

        $this->notificationChannel = new InMemoryNotificationChannel;
        $this->app->instance(NotificationChannelInterface::class, $this->notificationChannel);
    }

    public function test_dispatches_reminder_to_eligible_unpaid_member(): void
    {
        $member = Member::create([
            'full_name' => ['en' => 'Unpaid Member'],
            'date_of_birth' => '2000-01-01',
            'gender' => 'male',
            'phone_number' => '+251911223344',
            'class_id' => $this->seniorClass->id,
        ]);

        $this->artisan('payments:notify-dues', ['--month' => '2026-10'])
            ->assertExitCode(0);

        $dispatched = $this->notificationChannel->getDispatched();
        $this->assertCount(1, $dispatched);
        $this->assertEquals($member->id, $dispatched[0]['member']->id);
        $this->assertEquals('+251911223344', $dispatched[0]['member']->phone_number);
        $this->assertEquals(100.00, $dispatched[0]['data']['remaining_balance']);

        // Check audit log recorded
        $this->assertDatabaseHas('payment_audit_logs', [
            'action' => 'REMINDER_DISPATCHED',
        ]);
    }

    public function test_skips_fully_settled_member(): void
    {
        $member = Member::create([
            'full_name' => ['en' => 'Settled Member'],
            'date_of_birth' => '2000-01-01',
            'gender' => 'male',
            'phone_number' => '+251911223344',
            'class_id' => $this->seniorClass->id,
        ]);

        MemberPayment::create([
            'member_id' => $member->id,
            'payment_month' => '2026-10',
            'expected_amount' => 100.00,
            'paid_amount' => 100.00,
            'remaining_balance' => 0.00,
            'payment_status' => 'PAID',
            'payment_date' => '2026-10-05',
            'payment_method' => 'CASH',
            'reference_number' => 'RCP-TEST-SETTLED',
            'recorded_by' => $this->admin->id,
        ]);

        $this->artisan('payments:notify-dues', ['--month' => '2026-10'])
            ->assertExitCode(0);

        $this->assertCount(0, $this->notificationChannel->getDispatched());
    }

    public function test_skips_exempt_underage_member(): void
    {
        Member::create([
            'full_name' => ['en' => 'Underage Child'],
            'date_of_birth' => '2018-01-01', // 8 years old in 2026
            'gender' => 'female',
            'phone_number' => '+251911000000',
            'class_id' => $this->juniorClass->id,
        ]);

        $this->artisan('payments:notify-dues', ['--month' => '2026-10'])
            ->assertExitCode(0);

        $this->assertCount(0, $this->notificationChannel->getDispatched());
    }

    public function test_idempotent_skips_already_notified_member(): void
    {
        $member = Member::create([
            'full_name' => ['en' => 'Already Notified Member'],
            'date_of_birth' => '2000-01-01',
            'gender' => 'male',
            'phone_number' => '+251911223344',
            'class_id' => $this->seniorClass->id,
        ]);

        // Pre-record an audit log indicating reminder was already dispatched
        PaymentAuditLog::create([
            'member_payment_id' => null,
            'performed_by' => null,
            'action' => 'REMINDER_DISPATCHED',
            'reason' => "Dues reminder for 2026-10 (Member #{$member->id}) dispatched to +251911223344",
            'new_payload' => ['remaining_balance' => 100.00],
        ]);

        $this->artisan('payments:notify-dues', ['--month' => '2026-10'])
            ->assertExitCode(0);

        $this->assertCount(0, $this->notificationChannel->getDispatched());
    }

    public function test_dry_run_does_not_dispatch_or_create_audit_logs(): void
    {
        Member::create([
            'full_name' => ['en' => 'Dry Run Member'],
            'date_of_birth' => '2000-01-01',
            'gender' => 'female',
            'phone_number' => '+251911223344',
            'class_id' => $this->seniorClass->id,
        ]);

        $this->artisan('payments:notify-dues', ['--month' => '2026-10', '--dry-run' => true])
            ->assertExitCode(0);

        $this->assertCount(0, $this->notificationChannel->getDispatched());
        $this->assertDatabaseCount('payment_audit_logs', 0);
    }

    public function test_rejects_invalid_month_format(): void
    {
        $this->artisan('payments:notify-dues', ['--month' => 'invalid-month'])
            ->assertExitCode(1);
    }

    public function test_class_scoping_filter(): void
    {
        $seniorMember = Member::create([
            'full_name' => ['en' => 'Senior Member'],
            'date_of_birth' => '2000-01-01',
            'gender' => 'male',
            'phone_number' => '+251911111111',
            'class_id' => $this->seniorClass->id,
        ]);

        Member::create([
            'full_name' => ['en' => 'Junior Member'],
            'date_of_birth' => '2000-01-01',
            'gender' => 'male',
            'phone_number' => '+251922222222',
            'class_id' => $this->juniorClass->id,
        ]);

        $this->artisan('payments:notify-dues', [
            '--month' => '2026-10',
            '--class' => $this->seniorClass->id,
        ])->assertExitCode(0);

        $dispatched = $this->notificationChannel->getDispatched();
        $this->assertCount(1, $dispatched);
        $this->assertEquals($seniorMember->id, $dispatched[0]['member']->id);
    }
}
