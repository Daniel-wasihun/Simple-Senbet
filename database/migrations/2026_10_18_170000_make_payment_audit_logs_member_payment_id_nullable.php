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
        if (Schema::hasTable('payment_audit_logs')) {
            Schema::table('payment_audit_logs', function (Blueprint $table) {
                if (Schema::hasColumn('payment_audit_logs', 'member_payment_id')) {
                    $table->unsignedBigInteger('member_payment_id')->nullable()->change();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Making columns nullable is forward-compatible. Reverting nullability risks integrity
        // failures if audit logs for non-payment actions (like reminders) exist.
    }
};
