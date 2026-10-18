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
        if (Schema::hasTable('member_payments') && ! Schema::hasIndex('member_payments', 'uq_member_payments_reference_number')) {
            Schema::table('member_payments', function (Blueprint $table) {
                $table->unique('reference_number', 'uq_member_payments_reference_number');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('member_payments') && Schema::hasIndex('member_payments', 'uq_member_payments_reference_number')) {
            Schema::table('member_payments', function (Blueprint $table) {
                $table->dropUnique('uq_member_payments_reference_number');
            });
        }
    }
};
