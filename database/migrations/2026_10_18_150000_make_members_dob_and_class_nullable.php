<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('members')) {
            Schema::table('members', function (Blueprint $table) {
                if (Schema::hasColumn('members', 'date_of_birth')) {
                    $table->date('date_of_birth')->nullable()->change();
                }
                if (Schema::hasColumn('members', 'class_id')) {
                    $table->foreignId('class_id')->nullable()->change();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Nullability is forward-compatible and relaxing constraints does not require reverting on rollback
        // to avoid risking integrity failures if null values were inserted.
    }
};
