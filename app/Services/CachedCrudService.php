<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class CachedCrudService
{
    /**
     * Cache duration in minutes.
     */
    protected int $ttlMinutes = 10;

    /**
     * Retrieve paginated models with versioned caching.
     */
    public function paginate(string $model, array $with = [], int $perPage = 20): LengthAwarePaginator
    {
        $page = request()->integer('page', 1);
        $key = $this->key($model, "index.p{$page}.n{$perPage}");

        return Cache::remember($key, now()->addMinutes($this->ttlMinutes), function () use ($model, $with, $perPage) {
            return $model::with($with)->latest()->paginate($perPage);
        });
    }

    /**
     * Find and cache a single model instance.
     */
    public function find(Model $model, array $with = []): Model
    {
        $key = $this->key($model::class, 'show.' . $model->getKey());

        return Cache::remember($key, now()->addMinutes($this->ttlMinutes), function () use ($model, $with) {
            return $model->fresh($with);
        });
    }

    /**
     * Create a new model instance and invalidate the model's cache version.
     */
    public function create(string $model, array $data, array $with = []): Model
    {
        $record = $model::create($data)->load($with);
        $this->invalidate($model);

        return $record;
    }

    /**
     * Update an existing model instance and invalidate the model's cache version.
     */
    public function update(Model $model, array $data, array $with = []): Model
    {
        $model->update($data);
        $this->invalidate($model::class);

        return $model->fresh($with);
    }

    /**
     * Delete a model instance and invalidate the model's cache version.
     */
    public function delete(Model $model): void
    {
        $model->delete();
        $this->invalidate($model::class);
    }

    /**
     * Increment the model's cache version key, instantaneously invalidating all active cached pages and items.
     */
    public function invalidate(string $model): void
    {
        $key = $this->versionKey($model);
        if (! Cache::has($key)) {
            Cache::forever($key, 2);
        } else {
            Cache::increment($key);
        }
    }

    /**
     * Build a version-tagged cache key for the given model and query suffix.
     */
    public function key(string $model, string $suffix): string
    {
        $version = Cache::get($this->versionKey($model), 1);
        $modelBase = Str::snake(class_basename($model));

        return "api.{$modelBase}.v{$version}.{$suffix}";
    }

    /**
     * Cache version key for the given model.
     */
    public function versionKey(string $model): string
    {
        return 'api.cache.version.' . Str::snake(class_basename($model));
    }
}
