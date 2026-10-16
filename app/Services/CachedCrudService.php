<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class CachedCrudService
{
    public function paginate(string $model, array $with = []): LengthAwarePaginator
    {
        $key = $this->key($model, 'index.' . request()->integer('page', 1));
        return Cache::remember($key, now()->addMinutes(5), fn () => $model::with($with)->latest()->paginate(20));
    }

    public function find(Model $model, array $with = []): Model
    {
        return Cache::remember($this->key($model::class, 'show.' . $model->getKey()), now()->addMinutes(5), fn () => $model->fresh($with));
    }

    public function create(string $model, array $data, array $with = []): Model
    {
        $record = $model::create($data)->load($with);
        $this->invalidate($model);
        return $record;
    }

    public function update(Model $model, array $data, array $with = []): Model
    {
        $model->update($data);
        $this->invalidate($model::class);
        return $model->fresh($with);
    }

    public function delete(Model $model): void
    {
        $model->delete();
        $this->invalidate($model::class);
    }

    private function invalidate(string $model): void { Cache::increment($this->versionKey($model)); }
    private function key(string $model, string $suffix): string { return 'api.' . Str::snake(class_basename($model)) . '.v' . Cache::get($this->versionKey($model), 1) . '.' . $suffix; }
    private function versionKey(string $model): string { return 'api.cache.version.' . Str::snake(class_basename($model)); }
}
