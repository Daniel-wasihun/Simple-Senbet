<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('navigations', function (Blueprint $table) {
            $table->id('navigation_id');
            $table->uuid('uuid')->unique();
            $table->jsonb('name');
            $table->string('url')->nullable();
            $table->string('route_name')->nullable();
            $table->string('icon')->nullable();
            $table->jsonb('description')->nullable();
            $table->boolean('is_visible_at_header')->default(true);
            $table->boolean('is_visible_at_footer')->default(false);
            $table->boolean('is_visible_at_sidebar')->default(false);
            $table->boolean('is_visible_for_public')->default(true);
            $table->boolean('is_mega_menu')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->enum('menu_layout', ['default', 'mega', 'dropdown'])->default('default');
            $table->foreignId('parent_id')->nullable()->constrained('navigations', 'navigation_id')->onDelete('cascade');
            $table->timestamps();

            $table->index(['is_mega_menu', 'is_active', 'is_visible_at_header', 'is_visible_at_footer', 'is_visible_at_sidebar'], 'navigation_visibility');

            $table->index(['parent_id', 'sort_order']);



            if (DB::getDriverName() !== 'sqlite') {
                // MariaDB Optimization: Full Text Index for Generic JSON Search
                $table->fullText('name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('navigations');
    }
};
