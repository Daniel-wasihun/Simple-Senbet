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
        Schema::create('payment_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_payment_id')->constrained('member_payments')->cascadeOnDelete();
            $table->string('action', 50); // CREATED, CORRECTED, VOIDED
            $table->json('previous_payload')->nullable();
            $table->json('new_payload');
            $table->string('reason', 255);
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['member_payment_id', 'created_at'], 'idx_payment_audit_payment_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_audit_logs');
    }
};
