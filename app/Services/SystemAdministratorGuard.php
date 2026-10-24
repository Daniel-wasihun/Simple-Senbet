<?php

namespace App\Services;

use App\Models\User;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class SystemAdministratorGuard
{
    private const PERMISSION = 'roles.assign-system';

    /**
     * Lock active administrators in a stable order before changing access.
     *
     * @return Collection<int, User>
     */
    public function lockActiveAdministrators(): Collection
    {
        return User::query()
            ->where('status', true)
            ->whereHas('roles.permissions', function ($query): void {
                $query->where('permissions.slug', self::PERMISSION);
            })
            ->orderBy('id')
            ->lockForUpdate()
            ->get();
    }

    /**
     * @param  Collection<int, User>  $activeAdministrators
     */
    public function preventLastAdministratorDeactivation(
        Collection $activeAdministrators,
        User $target
    ): void {
        $isAdministrator = $activeAdministrators->contains(
            fn (User $administrator): bool => $administrator->is($target)
        );

        if ($isAdministrator && $activeAdministrators->count() === 1) {
            throw ValidationException::withMessages([
                'status' => 'The last active system administrator cannot be deactivated.',
            ]);
        }
    }

    /**
     * @param  Collection<int, User>  $activeAdministrators
     * @param  array<int, int|string>  $roleIds
     */
    public function preventLastAdministratorRoleRemoval(
        Collection $activeAdministrators,
        User $target,
        array $roleIds
    ): void {
        $isActiveAdministrator = $activeAdministrators->contains(
            fn (User $administrator): bool => $administrator->is($target)
        );

        if (! $isActiveAdministrator) {
            return;
        }

        $willRemainAdministrator = Role::query()
            ->whereIn('id', $roleIds)
            ->whereHas('permissions', function ($query): void {
                $query->where('permissions.slug', self::PERMISSION);
            })
            ->exists();

        if (! $willRemainAdministrator && $activeAdministrators->count() === 1) {
            throw ValidationException::withMessages([
                'role_ids' => 'The last active system administrator must retain system administration access.',
            ]);
        }
    }

    /**
     * @param  Collection<int, User>  $activeAdministrators
     * @param  array<int, int|string>  $permissionIds
     */
    public function preventLastAdministratorPermissionRemoval(
        Collection $activeAdministrators,
        Role $targetRole,
        array $permissionIds
    ): void {
        $systemPermissionId = Permission::query()
            ->where('slug', self::PERMISSION)
            ->value('id');

        if (
            $systemPermissionId === null
            || in_array((int) $systemPermissionId, array_map('intval', $permissionIds), true)
        ) {
            return;
        }

        $administratorsLosingAccess = $activeAdministrators->filter(
            function (User $administrator) use ($targetRole): bool {
                $hasTargetRole = $administrator->roles()
                    ->whereKey($targetRole->getKey())
                    ->exists();

                if (! $hasTargetRole) {
                    return false;
                }

                return ! $administrator->roles()
                    ->where('roles.id', '!=', $targetRole->getKey())
                    ->whereHas('permissions', function ($query): void {
                        $query->where('permissions.slug', self::PERMISSION);
                    })
                    ->exists();
            }
        );

        if (
            $administratorsLosingAccess->isNotEmpty()
            && $administratorsLosingAccess->count() === $activeAdministrators->count()
        ) {
            throw ValidationException::withMessages([
                'permission_ids' => 'At least one active system administrator must retain system administration access.',
            ]);
        }
    }
}
