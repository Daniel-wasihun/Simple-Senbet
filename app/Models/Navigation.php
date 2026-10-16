<?php

namespace App\Models;

use App\Traits\HasUuidRoute;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;

use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Navigation extends Model
{
    /** @use HasFactory<\Database\Factories\NavigationFactory> */
    use HasFactory, LogsActivity, HasUuidRoute, Searchable;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'url', 'is_active', 'is_visible_for_public'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $primaryKey = 'navigation_id';
    protected $uuidColumn = 'uuid';

    protected $fillable = [
        'name',
        'url',
        'route_name',
        'icon',
        'description',
        'is_visible_at_header',
        'is_visible_at_footer',
        'is_visible_at_sidebar',
        'is_visible_for_public',
        'is_mega_menu',
        'is_active',
        'sort_order',
        'menu_layout',
        'parent_id',
    ];

    protected $casts = [
        'name' => 'array',
        'description' => 'array',
        'is_visible_at_header' => 'boolean',
        'is_visible_at_footer' => 'boolean',
        'is_visible_at_sidebar' => 'boolean',
        'is_visible_for_public' => 'boolean',
        'is_mega_menu' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'parent_id' => 'integer',
    ];

    protected static function booted()
    {
        static::saved(function ($navigation) {
            Cache::forget('navigations_header');
            Cache::forget('navigations_footer');
            Cache::forget('navigations_sidebar');
        });

        static::deleted(function ($navigation) {
            Cache::forget('navigations_header');
            Cache::forget('navigations_footer');
            Cache::forget('navigations_sidebar');
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function parent()
    {
        return $this->belongsTo(Navigation::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Navigation::class, 'parent_id')->orderBy('sort_order');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeHeader(Builder $query)
    {
        return $query->where('is_visible_at_header', true)
            ->where('is_active', true)
            ->whereNull('parent_id')
            ->orderBy('sort_order');
    }

    public function scopeFooter(Builder $query)
    {
        return $query->where('is_visible_at_footer', true)
            ->where('is_active', true)
            ->whereNull('parent_id')
            ->orderBy('sort_order');
    }

    public function scopeSidebar(Builder $query)
    {
        return $query->where('is_visible_at_sidebar', true)
            ->where('is_active', true)
            ->whereNull('parent_id')
            ->orderBy('sort_order');
    }

    public function scopePublic(Builder $query)
    {
        return $query->where('is_visible_for_public', true)
            ->where('is_active', true);
    }
}
