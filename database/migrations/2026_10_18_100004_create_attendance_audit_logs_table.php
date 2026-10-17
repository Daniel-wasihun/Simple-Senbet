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
        Schema::create('attendance_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attendance_session_id')->constrained('attendance_sessions')->restrictOnDelete();
            $table->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $table->string('action', 50);
            $table->json('previous_state')->nullable();
            $table->json('new_state')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['attendance_session_id', 'created_at'], 'idx_audit_session_created');
            $table->index(['actor_id', 'created_at'], 'idx_audit_actor_created');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE attendance_audit_logs ADD CONSTRAINT chk_attendance_audit_logs_action CHECK (action IN ('session_created', 'session_submitted', 'mark_corrected', 'session_closed', 'session_reopened'));");

            DB::statement('
                CREATE OR REPLACE FUNCTION fn_prevent_attendance_audit_log_mutation()
                RETURNS TRIGGER AS $$
                BEGIN
                    RAISE EXCEPTION \'attendance_audit_logs records are immutable and cannot be updated or deleted.\';
                END;
                $$ LANGUAGE plpgsql;
            ');

            DB::statement('
                CREATE TRIGGER trg_prevent_attendance_audit_log_mutation
                BEFORE UPDATE OR DELETE ON attendance_audit_logs
                FOR EACH ROW
                EXECUTE FUNCTION fn_prevent_attendance_audit_log_mutation();
            ');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP TRIGGER IF EXISTS trg_prevent_attendance_audit_log_mutation ON attendance_audit_logs;');
            DB::statement('DROP FUNCTION IF EXISTS fn_prevent_attendance_audit_log_mutation();');
        }

        Schema::dropIfExists('attendance_audit_logs');
    }
};
