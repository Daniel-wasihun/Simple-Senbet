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
        Schema::create('monthly_payment_rules', function (Blueprint $table) {
            $table->id();
            $table->json('name');
            $table->decimal('amount', 10, 2);
            $table->unsignedSmallInteger('minimum_age')->nullable();
            $table->foreignId('minimum_class_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->foreignId('class_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->date('effective_from');
            $table->date('effective_to')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('allow_credit_carry_forward')->default(false);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['is_active', 'effective_from', 'effective_to'], 'idx_payment_rule_active_dates');
            $table->index('class_id', 'idx_payment_rule_class');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('monthly_payment_rules');
    }
};
