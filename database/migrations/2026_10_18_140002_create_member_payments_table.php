<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('member_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->foreignId('payment_rule_id')->nullable()->constrained('monthly_payment_rules')->nullOnDelete();
            $table->string('payment_month', 7); // Format: YYYY-MM
            $table->decimal('expected_amount', 10, 2);
            $table->decimal('paid_amount', 10, 2);
            $table->decimal('remaining_balance', 10, 2)->default(0.00);
            $table->string('payment_status', 20); // PAID, PARTIAL, OVERPAID, EXEMPT
            $table->date('payment_date');
            $table->string('payment_method', 50)->default('CASH'); // CASH, BANK_TRANSFER, TELEBIRR, CBE_BIRR
            $table->string('reference_number', 100)->nullable();
            $table->text('notes')->nullable();
            $table->string('idempotency_key', 100)->nullable()->unique();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_void')->default(false);
            $table->string('void_reason', 255)->nullable();
            $table->timestamp('voided_at')->nullable();
            $table->foreignId('voided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['member_id', 'payment_month'], 'idx_member_payment_month');
            $table->index('payment_month', 'idx_payment_month');
            $table->index('payment_status', 'idx_payment_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('member_payments');
    }
};
