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
        Schema::create('attendance_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->restrictOnDelete();
            $table->unsignedBigInteger('term_id');
            $table->foreignId('class_id')->constrained('classes')->restrictOnDelete();
            $table->foreignId('course_id')->nullable()->constrained('courses')->restrictOnDelete();
            $table->date('date');
            $table->string('time_slot', 50);
            $table->string('status', 20)->default('draft');
            $table->foreignId('submitted_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Dual partial unique indexes enforcing D-S1-01 hybrid session scope
        // Supported natively by PostgreSQL and SQLite >= 3.8.0
        if (in_array(DB::getDriverName(), ['pgsql', 'sqlite'], true)) {
            DB::statement('CREATE UNIQUE INDEX idx_attendance_sessions_course_unique ON attendance_sessions (academic_year_id, term_id, class_id, course_id, date, time_slot) WHERE course_id IS NOT NULL;');
            DB::statement('CREATE UNIQUE INDEX idx_attendance_sessions_homeroom_unique ON attendance_sessions (academic_year_id, term_id, class_id, date, time_slot) WHERE course_id IS NULL;');
        }

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE attendance_sessions ADD CONSTRAINT chk_attendance_sessions_status CHECK (status IN ('draft', 'submitted', 'closed'));");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_sessions');
    }
};
