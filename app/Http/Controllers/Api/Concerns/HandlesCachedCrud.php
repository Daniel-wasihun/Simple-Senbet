<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Services\CachedCrudService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

trait HandlesCachedCrud
{
    protected function indexCrud(string $model, string $resource, array $with = [], bool $authorize = false)
    {
        if ($authorize) {
            $this->authorize('viewAny', $model);
        }

return $resource::collection(app(CachedCrudService::class)->paginate($model, $with));
    }

    protected function showCrud(Model $model, string $resource, array $with = [], bool $authorize = false)
    {
        if ($authorize) {
            $this->authorize('view', $model);
        }

return $resource::make(app(CachedCrudService::class)->find($model, $with));
    }

    protected function storeCrud(Request $request, string $model, string $resource, array $rules, array $with = [], bool $authorize = false)
    {
        if ($authorize) {
            $this->authorize('create', $model);
        } $record = app(CachedCrudService::class)->create($model, $request->validate($rules), $with);

        return response()->json(['data' => $resource::make($record)], 201);
    }

    protected function updateCrud(Request $request, Model $model, string $resource, array $rules, array $with = [], bool $authorize = false)
    {
        if ($authorize) {
            $this->authorize('update', $model);
        } $record = app(CachedCrudService::class)->update($model, $request->validate($rules), $with);

        return ['data' => $resource::make($record)];
    }

    protected function destroyCrud(Model $model, bool $authorize = false)
    {
        if ($authorize) {
            $this->authorize('delete', $model);
        } app(CachedCrudService::class)->delete($model);

        return response()->noContent();
    }
}
