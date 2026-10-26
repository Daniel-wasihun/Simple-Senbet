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
        Schema::create('assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teaching_assignment_id')->constrained('teaching_assignments')->restrictOnDelete();
            $table->json('name');
            $table->decimal('total_score', 5, 2);
            $table->decimal('weight_percentage', 5, 2);
            $table->timestamps();

            $table->index('teaching_assignment_id');
        });

        DB::statement('ALTER TABLE assessments ADD CONSTRAINT assessments_total_score_check CHECK (total_score > 0);');
        DB::statement('ALTER TABLE assessments ADD CONSTRAINT assessments_weight_percentage_check CHECK (weight_percentage >= 0 AND weight_percentage <= 100);');
        DB::statement("CREATE UNIQUE INDEX unique_assessment_per_assignment ON assessments (teaching_assignment_id, (COALESCE(name->>'en', name->>'am', name#>>'{}', name::text)));");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assessments');
    }
};
