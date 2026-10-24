<?php

namespace App\Services;

use App\Models\Permission;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PermissionService
{
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        $perPage = min(
            max((int) ($filters['per_page'] ?? 15), 1),
            100
        );

        return Permission::query()
            ->withCount('roles')
            ->when(
                filled($filters['module'] ?? null),
                fn ($query) => $query->where(
                    'module',
                    $filters['module']
                )
            )
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters) {
                    $search = trim($filters['search']);

                    $query->where(function ($query) use ($search) {
                        $query->where('name', 'like', "%{$search}%")
                            ->orWhere('slug', 'like', "%{$search}%");
                    });
                }
            )
            ->orderBy('module')
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function register(array $data): Permission
    {
        $slug = trim($data['slug']);

        if ($slug === '') {
            throw ValidationException::withMessages([
                'slug' => 'A permission slug is required.',
            ]);
        }

        return DB::transaction(function () use ($data, $slug) {
            return Permission::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => trim($data['name']),
                    'module' => $data['module'] ?? null,
                    'description' => $data['description'] ?? null,
                ]
            );
        });
    }

    public function updateMetadata(
        Permission $permission,
        array $data
    ): Permission {
        return DB::transaction(function () use ($permission, $data) {
            $permission = Permission::query()
                ->lockForUpdate()
                ->findOrFail($permission->getKey());

            foreach (['name', 'module', 'description'] as $field) {
                if (array_key_exists($field, $data)) {
                    $permission->{$field} = $data[$field];
                }
            }

            $permission->save();

            return $permission->refresh()
                ->loadCount('roles');
        });
    }
}
