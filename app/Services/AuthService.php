<?php

namespace App\Services;

use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class AuthService
{
    public function register(array $data): array
    {
        $role = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
        $user = User::create($data + ['role_id' => $role->id]);
        $user->syncRoles([$role->name]);
        return [$user->load('roles'), $user->createToken('api-token')->plainTextToken];
    }
    public function login(array $data): ?array
    {
        $user = User::where('email', $data['email'])->first();
        if (! $user || ! Hash::check($data['password'], $user->password)) return null;
        $device = $data['device_name'] ?? 'api-token';
        $user->tokens()->where('name', $device)->delete();
        return [$user->load('roles'), $user->createToken($device)->plainTextToken];
    }
    public function sendResetLink(string $email): void { Password::sendResetLink(['email' => $email]); }
    public function resetPassword(array $data): string
    {
        return Password::reset($data, function (User $user, string $password): void {
            $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
            $user->tokens()->delete(); event(new PasswordReset($user));
        });
    }
}
