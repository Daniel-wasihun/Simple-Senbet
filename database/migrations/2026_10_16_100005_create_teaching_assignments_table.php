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
        Schema::create('teaching_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('course_id')->constrained('courses')->restrictOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->restrictOnDelete();
            $table->foreignId('class_id')->constrained('classes')->restrictOnDelete();
            $table->string('section', 20);
            $table->string('semester', 20);
            $table->boolean('is_primary')->default(false);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();

            $table->unique(
                ['teacher_id', 'academic_year_id', 'class_id', 'section', 'course_id', 'semester', 'start_date'],
                'uq_teacher_assignment_temporal'
            );
            $table->index(
                ['academic_year_id', 'class_id', 'section', 'course_id', 'semester'],
                'idx_teaching_assignment_lookup'
            );
            $table->index(['course_id', 'academic_year_id', 'semester']);
            $table->index(['teacher_id', 'academic_year_id']);
        });

        DB::statement("ALTER TABLE teaching_assignments ADD CONSTRAINT teaching_assignments_semester_check CHECK (semester IN ('semester_1', 'semester_2'));");
        DB::statement('ALTER TABLE teaching_assignments ADD CONSTRAINT chk_assignment_dates CHECK (end_date IS NULL OR end_date > start_date);');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teaching_assignments');
    }
};
