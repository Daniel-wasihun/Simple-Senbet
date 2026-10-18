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
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->json('name');
            $table->string('code')->unique();
            $table->unsignedInteger('number_of_sections')->default(1);
            $table->decimal('passing_score', 5, 2)->default(50.00);
            $table->foreignId('next_class_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->timestamps();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE classes ADD CONSTRAINT classes_number_of_sections_check CHECK (number_of_sections > 0);');
            DB::statement('ALTER TABLE classes ADD CONSTRAINT classes_passing_score_check CHECK (passing_score >= 0 AND passing_score <= 100);');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('classes');
    }
};
