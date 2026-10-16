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
            $table->string('semester', 20);
            $table->timestamps();

            $table->unique(
                ['teacher_id', 'course_id', 'academic_year_id', 'semester'],
                'unique_teaching_assignment'
            );
            $table->index(['course_id', 'academic_year_id', 'semester']);
            $table->index(['teacher_id', 'academic_year_id']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE teaching_assignments ADD CONSTRAINT teaching_assignments_semester_check CHECK (semester IN ('semester_1', 'semester_2'));");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teaching_assignments');
    }
};
