<?php

namespace App\Services;

use App\Models\User;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Services\SystemAdministratorGuard;

class RoleService
{
    public function __construct(
        private readonly SystemAdministratorGuard $systemAdministratorGuard, 
    ) {}

    public function paginate(array $filters = []): LengthAwarePaginator
    {
        $perPage = min(
            max((int) ($filters['per_page'] ?? 15), 1),
            100
        );

        return Role::query()
            ->withCount(['users', 'permissions'])
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
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function create(array $data): Role
    {
        return DB::transaction(function () use ($data) {
            $name = trim($data['name']);
            $slug = Str::slug($data['slug'] ?? $name);

            if ($slug === '') {
                throw ValidationException::withMessages([
                    'slug' => 'A valid role slug is required.',
                ]);
            }

            if (Role::where('name', $name)->exists()) {
                throw ValidationException::withMessages([
                    'name' => 'This role name already exists.',
                ]);
            }

            if (Role::where('slug', $slug)->exists()) {
                throw ValidationException::withMessages([
                    'slug' => 'This role slug already exists.',
                ]);
            }

            $role = Role::create([
                'name' => $name,
                'slug' => $slug,
                'description' => $data['description'] ?? null,
                'is_system' => false,
            ]); 
            return $role;
        });
    }

    public function update(Role $role, array $data): Role
    {
        return DB::transaction(function () use ($role, $data) {
            $role = Role::query()
                ->lockForUpdate()
                ->findOrFail($role->getKey());

            if (array_key_exists('name', $data)) {
                $name = trim($data['name']);

                $duplicate = Role::query()
                    ->where('name', $name)
                    ->where('id', '!=', $role->getKey())
                    ->exists();

                if ($duplicate) {
                    throw ValidationException::withMessages([
                        'name' => 'This role name already exists.',
                    ]);
                }

                $role->name = $name;
            }

            if (array_key_exists('description', $data)) {
                $role->description = $data['description'];
            }

            $role->save(); 
            return $role->refresh()
                ->loadCount(['users', 'permissions']);
        });
    }

    public function delete(Role $role): void
    {
        DB::transaction(function () use ($role) {
            $role = Role::query()
                ->lockForUpdate()
                ->findOrFail($role->getKey());

            if ($role->is_system) {
                throw ValidationException::withMessages([
                    'role' => 'System roles cannot be deleted.',
                ]);
            }

            if ($role->users()->exists()) {
                throw ValidationException::withMessages([
                    'role' => 'Remove this role from all users before deleting it.',
                ]);
            }

            $role->delete();
            });
    }

    public function syncPermissions(
        User $actor,
        Role $role,
        array $permissionIds
    ): Role {
        return DB::transaction(function () use ($actor, $role, $permissionIds) {
            $activeAdministrators = $this->systemAdministratorGuard
                ->lockActiveAdministrators();

            $role = Role::query()
                ->lockForUpdate()
                ->findOrFail($role->getKey());

            $ids = array_values(array_unique(
                array_map('intval', $permissionIds)
            ));

            $found = Permission::query()
                ->whereIn('id', $ids)
                ->count();

            if ($found !== count($ids)) {
                throw ValidationException::withMessages([
                    'permission_ids' => 'One or more permissions do not exist.',
                ]);
            }

            $protectedPermissionId = Permission::query()
                ->where('slug', 'roles.assign-system')
                ->value('id');

            if (
                $protectedPermissionId !== null
                && in_array((int) $protectedPermissionId, $ids, true)
                && (
                    ! $role->is_system
                    || ! $actor->hasPermission('roles.assign-system')
                )
            ) {
                throw new AuthorizationException(
                    'You are not authorized to grant system administration access.'
                );
            }

            $this->systemAdministratorGuard->preventLastAdministratorPermissionRemoval(
                $activeAdministrators,
                $role,
                $ids
            );

            $previousIds = $role->permissions()->pluck('permissions.id')->map(fn ($id): int => (int) $id)->all();
            $role->permissions()->sync($ids);
            
            return $role->refresh()->load('permissions');
        });
    }

    public function syncUserRoles(
        User $actor,
        User $target,
        array $roleIds
    ): User {
        return DB::transaction(function () use (
            $actor,
            $target,
            $roleIds
        ) {
            $activeAdministrators = $this->systemAdministratorGuard
                ->lockActiveAdministrators();

            $target = User::query()
                ->lockForUpdate()
                ->findOrFail($target->getKey());

            $ids = array_values(array_unique(
                array_map('intval', $roleIds)
            ));

            if ($ids === []) {
                throw ValidationException::withMessages([
                    'role_ids' => 'At least one role must be assigned.',
                ]);
            }

            $roles = Role::query()
                ->whereIn('id', $ids)
                ->get();

            if ($roles->count() !== count($ids)) {
                throw ValidationException::withMessages([
                    'role_ids' => 'One or more roles do not exist.',
                ]);
            }

            $assignsSystemRole = $roles->contains(
                fn (Role $role) => $role->is_system
            );

            if (
                $assignsSystemRole
                && ! $actor->hasPermission('roles.assign-system')
            ) {
                throw new AuthorizationException(
                    'You are not authorized to assign system roles.'
                );
            }

            if ($target->status) {
                $this->systemAdministratorGuard->preventLastAdministratorRoleRemoval(
                    $activeAdministrators,
                    $target,
                    $ids
                );
            }

            $previousIds = $target->roles()->pluck('roles.id')->map(fn ($id): int => (int) $id)->all();
            $target->roles()->sync($ids);
         
            return $target->refresh()->load('roles');
        });
    }
}
