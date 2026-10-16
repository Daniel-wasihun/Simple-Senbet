<?php

namespace App\Services;

use App\Models\Role;
use App\Models\User;

class UserService
{
    public function create(array $data): User
    {
        $role = $this->role($data['role']);
        $user = User::create($data + ['role_id' => $role->id]);
        $user->syncRoles([$role->name]);
        return $user->load('roles');
    }
    public function update(User $user, array $data): User
    {
        $role = $this->role($data['role']);
        $changes = collect($data)->except('role')->filter(fn ($value, $key) => $key !== 'password' || filled($value))->all();
        $user->update($changes + ['role_id' => $role->id]);
        $user->syncRoles([$role->name]);
        return $user->fresh()->load('roles');
    }
    private function role(string $name): Role { return Role::firstOrCreate(['name' => $name, 'guard_name' => 'web']); }
}
