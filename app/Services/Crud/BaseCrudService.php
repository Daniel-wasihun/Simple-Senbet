<?php

namespace App\Services\Crud;

use App\Services\CachedCrudService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;

abstract class BaseCrudService
{
    /**
     * Target Eloquent model class.
     */
    protected string $model;

    /**
     * Eager loaded relationships.
     *
     * @var list<string>
     */
    protected array $with = [];

    public function __construct(protected CachedCrudService $cache) {}

    public function paginate(int $perPage = 20): LengthAwarePaginator
    {
        return $this->cache->paginate($this->model, $this->with, $perPage);
    }

    public function find(Model $model): Model
    {
        return $this->cache->find($model, $this->with);
    }

    public function create(array $data): Model
    {
        return $this->cache->create($this->model, $data, $this->with);
    }

    public function update(Model $model, array $data): Model
    {
        return $this->cache->update($model, $data, $this->with);
    }

    public function delete(Model $model): void
    {
        $this->cache->delete($model);
    }
}
