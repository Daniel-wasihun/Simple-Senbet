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
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('christian_name')->nullable();
            $table->date('date_of_birth');
            $table->string('gender', 20);
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->string('phone_number')->nullable();
            $table->date('membership_date')->nullable();
            $table->string('sol_father_name')->nullable();
            $table->foreignId('class_id')->constrained('classes')->restrictOnDelete();
            $table->string('section', 50)->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['class_id', 'section']);
            $table->index('full_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};
