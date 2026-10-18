<?php

namespace App\Services;

use App\Models\Role;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

class UserService
{
    public function __construct(protected CachedCrudService $cache) {}

    /**
     * Retrieve paginated users with roles eagerly loaded and cached.
     */
    public function paginate(int $perPage = 20): LengthAwarePaginator
    {
        return $this->cache->paginate(User::class, ['roles'], $perPage);
    }

    /**
     * Find a user with cached resolution.
     */
    public function find(User $user): User
    {
        /** @var User */
        return $this->cache->find($user, ['roles']);
    }

    /**
     * Create a new user, synchronize assigned role, and invalidate user cache.
     */
    public function create(array $data): User
    {
        $roleName = $data['role'] ?? 'student';
        $role = $this->resolveRole($roleName);

        $userData = collect($data)
            ->except(['role', 'password_confirmation'])
            ->all();

        $userData['role_id'] = $role->id;

        $user = User::create($userData);
        $user->syncRoles([$role->name]);

        $this->cache->invalidate(User::class);

        return $user->load('roles');
    }

    /**
     * Update an existing user, optionally update password and role, and invalidate cache.
     */
    public function update(User $user, array $data): User
    {
        $changes = collect($data)
            ->except(['role', 'password_confirmation'])
            ->filter(fn ($value, $key) => $key !== 'password' || filled($value))
            ->all();

        if (! empty($data['role'])) {
            $role = $this->resolveRole($data['role']);
            $changes['role_id'] = $role->id;
            $user->syncRoles([$role->name]);
        }

        $user->update($changes);
        $this->cache->invalidate(User::class);

        return $user->fresh(['roles']);
    }

    /**
     * Delete user, revoke authentication tokens, and invalidate cache.
     */
    public function delete(User $user): void
    {
        $user->tokens()->delete();
        $user->delete();

        $this->cache->invalidate(User::class);
    }

    /**
     * Invalidate user cache manually.
     */
    public function invalidate(): void
    {
        $this->cache->invalidate(User::class);
    }

    /**
     * Resolve or create Spatie role model.
     */
    protected function resolveRole(string $name): Role
    {
        return Role::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
    }
}
