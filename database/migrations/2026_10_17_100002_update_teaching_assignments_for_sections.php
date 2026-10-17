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
        Schema::table('teaching_assignments', function (Blueprint $table) {
            $table->foreignId('class_id')->after('academic_year_id')->constrained('classes')->restrictOnDelete();
            $table->string('section', 20)->after('class_id');
            $table->boolean('is_primary')->default(false)->after('semester');
            $table->date('start_date')->after('is_primary')->nullable();
            $table->date('end_date')->after('start_date')->nullable();

            $table->dropUnique('unique_teaching_assignment');

            $table->unique(
                ['teacher_id', 'academic_year_id', 'class_id', 'section', 'course_id', 'semester', 'start_date'],
                'uq_teacher_assignment_temporal'
            );

            $table->index(
                ['academic_year_id', 'class_id', 'section', 'course_id', 'semester'],
                'idx_teaching_assignment_lookup'
            );
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE teaching_assignments ADD CONSTRAINT chk_assignment_dates CHECK (end_date IS NULL OR end_date > start_date);');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Guarded rollback preflight: verify that no multi-section assignments exist that would conflict with the restored non-section unique index.
        if (Schema::hasTable('teaching_assignments') && Schema::hasColumn('teaching_assignments', 'section')) {
            $duplicateCount = DB::table('teaching_assignments')
                ->select('teacher_id', 'course_id', 'academic_year_id', 'semester')
                ->groupBy('teacher_id', 'course_id', 'academic_year_id', 'semester')
                ->havingRaw('COUNT(*) > 1')
                ->count();

            if ($duplicateCount > 0) {
                throw new \RuntimeException(
                    "Rollback aborted: Found {$duplicateCount} teaching assignment group(s) with multiple section records. " .
                    "Reverting to the legacy non-section schema would cause irreversible data loss and violate unique constraints. " .
                    "Data preservation policy forbids automated truncation or pruning."
                );
            }
        }

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE teaching_assignments DROP CONSTRAINT IF EXISTS chk_assignment_dates;');
        }

        Schema::table('teaching_assignments', function (Blueprint $table) {
            $table->dropUnique('uq_teacher_assignment_temporal');
            $table->dropIndex('idx_teaching_assignment_lookup');

            $table->dropForeign(['class_id']);
            $table->dropColumn(['class_id', 'section', 'is_primary', 'start_date', 'end_date']);

            $table->unique(
                ['teacher_id', 'course_id', 'academic_year_id', 'semester'],
                'unique_teaching_assignment'
            );
        });
    }
};
