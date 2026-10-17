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
        Schema::create('session_student_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attendance_session_id')->constrained('attendance_sessions')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('members')->restrictOnDelete();
            $table->string('mark', 20);
            $table->foreignId('marked_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('marked_at');
            $table->string('remarks', 255)->nullable();
            $table->timestamps();

            $table->unique(['attendance_session_id', 'student_id'], 'uq_session_student_record');
            $table->index(['student_id', 'mark'], 'idx_session_student_mark');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE session_student_records ADD CONSTRAINT chk_session_student_records_mark CHECK (mark IN ('present', 'absent', 'late', 'excused'));");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('session_student_records');
    }
};
