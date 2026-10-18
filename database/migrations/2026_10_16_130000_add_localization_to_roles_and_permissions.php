<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('roles', 'label')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->json('label')->nullable()->after('name');
            });
        }

        if (! Schema::hasColumn('permissions', 'group_name')) {
            Schema::table('permissions', function (Blueprint $table) {
                $table->string('group_name')->default('general')->after('name');
                $table->json('label')->nullable()->after('group_name');
                $table->json('description')->nullable()->after('label');
                $table->index('group_name');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('permissions', 'group_name')) {
            Schema::table('permissions', function (Blueprint $table) {
                $table->dropIndex(['group_name']);
                $table->dropColumn(['group_name', 'label', 'description']);
            });
        }
        if (Schema::hasColumn('roles', 'label')) {
            Schema::table('roles', fn (Blueprint $table) => $table->dropColumn('label'));
        }
    }
};
