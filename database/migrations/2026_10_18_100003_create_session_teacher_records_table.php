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
        Schema::create('session_teacher_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attendance_session_id')->constrained('attendance_sessions')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('users')->restrictOnDelete();
            $table->string('mark', 20);
            $table->foreignId('marked_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('marked_at');
            $table->string('remarks', 255)->nullable();
            $table->timestamps();

            $table->unique(['attendance_session_id', 'teacher_id'], 'uq_session_teacher_record');
            $table->index(['teacher_id', 'mark'], 'idx_session_teacher_mark');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE session_teacher_records ADD CONSTRAINT chk_session_teacher_records_mark CHECK (mark IN ('present', 'absent', 'late', 'excused'));");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('session_teacher_records');
    }
};
