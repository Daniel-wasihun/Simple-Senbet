<?php

namespace App\Console\Commands;

use App\Services\Notification\PaymentReminderService;
use Illuminate\Console\Command;
use Illuminate\Contracts\Console\Isolatable;

class NotifyDuesCommand extends Command implements Isolatable
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'payments:notify-dues
                            {--month= : Billing month in YYYY-MM format (defaults to current month)}
                            {--dry-run : Simulate reminder dispatch without sending notifications}
                            {--class= : Filter by school class ID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Dispatch monthly dues reminders to eligible members with outstanding balances';

    /**
     * Execute the console command.
     */
    public function handle(PaymentReminderService $reminderService): int
    {
        $rawMonth = $this->option('month') ?: now()->format('Y-m');

        if (! preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $rawMonth)) {
            $this->error("Invalid month format '{$rawMonth}'. Expected YYYY-MM format (e.g. 2026-10).");

            return self::FAILURE;
        }

        $dryRun = (bool) $this->option('dry-run');
        $classId = $this->option('class') ? (int) $this->option('class') : null;

        $this->info("Processing monthly dues reminders for {$rawMonth}".($dryRun ? ' [DRY RUN]' : '').($classId ? " (Class ID: {$classId})" : '').'...');

        $result = $reminderService->processMonthlyReminders($rawMonth, $dryRun, $classId);

        $this->table(
            ['Metric', 'Count'],
            [
                ['Billing Month', $result['billing_month']],
                ['Execution Mode', $result['is_dry_run'] ? 'Dry Run (Simulated)' : 'Live Dispatch'],
                ['Total Members Evaluated', $result['total_evaluated']],
                ['Eligible Members', $result['eligible_count']],
                ['Fully Settled (Skipped)', $result['settled_count']],
                ['Exempt / Ineligible (Skipped)', $result['exempt_count']],
                ['Already Notified (Skipped)', $result['already_notified_count']],
                ['Reminders Queued (Dry Run)', $result['queued_count']],
                ['Reminders Sent (Live)', $result['sent_count']],
                ['Failed Reminders', $result['failed_count']],
            ]
        );

        if ($result['failed_count'] > 0) {
            $this->warn("Completed with {$result['failed_count']} failure(s). Check logs for details.");

            return self::FAILURE;
        }

        $this->info('Monthly dues notification process completed successfully.');

        return self::SUCCESS;
    }
}
