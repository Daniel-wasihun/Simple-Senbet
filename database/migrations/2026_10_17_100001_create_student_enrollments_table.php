<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('student_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->restrictOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->restrictOnDelete();
            $table->foreignId('class_id')->constrained('classes')->restrictOnDelete();
            $table->string('section', 20);
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->string('transfer_reason', 255)->nullable();
            $table->timestamps();

            $table->index(['class_id', 'section', 'start_date', 'end_date'], 'idx_enrollment_roster_lookup');
            $table->index(['member_id', 'academic_year_id'], 'idx_enrollment_member_year');
        });

        if (in_array(DB::getDriverName(), ['pgsql', 'sqlite'], true)) {
            DB::statement('CREATE UNIQUE INDEX uq_student_single_active_enrollment ON student_enrollments (member_id) WHERE end_date IS NULL;');
        }

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE student_enrollments ADD CONSTRAINT chk_enrollment_dates CHECK (end_date IS NULL OR end_date > start_date);');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_enrollments');
    }
};
