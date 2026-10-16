<?php

namespace App\Services\Crud;

use Illuminate\Database\Eloquent\Model;

abstract class BaseCrudService
{
    protected string $model;
    protected array $with = [];

    public function __construct(protected CachedCrudService $cache) {}
    public function paginate() { return $this->cache->paginate($this->model, $this->with); }
    public function find(Model $model): Model { return $this->cache->find($model, $this->with); }
    public function create(array $data): Model { return $this->cache->create($this->model, $data, $this->with); }
    public function update(Model $model, array $data): Model { return $this->cache->update($model, $data, $this->with); }
    public function delete(Model $model): void { $this->cache->delete($model); }
}
