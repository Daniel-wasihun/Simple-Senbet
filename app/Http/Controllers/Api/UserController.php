<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    private const ROLES = ['student', 'teacher', 'superadmin'];

    public function index()
    {
        $this->authorize('viewAny', User::class);

        return response()->json(['users' => User::with('roles')->latest()->paginate(20)]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', User::class);
        $data = $this->validated($request);
        $user = User::create($data);
        $this->assignRole($user, $data['role']);

        return response()->json(['message' => __('auth.user_created'), 'user' => $this->userData($user->fresh())], 201);
    }

    public function show(User $user)
    {
        $this->authorize('view', $user);

        return response()->json(['user' => $this->userData($user)]);
    }

    public function update(Request $request, User $user)
    {
        $this->authorize('update', $user);
        $data = $this->validated($request, $user, false);
        $changes = collect($data)->except('role')->all();
        if (empty($changes['password'])) {
            unset($changes['password']);
        }
        $user->update($changes);
        $this->assignRole($user, $data['role']);

        return response()->json(['message' => __('auth.user_updated'), 'user' => $this->userData($user->fresh())]);
    }

    public function destroy(Request $request, User $user)
    {
        $this->authorize('delete', $user);
        if ($request->user()->is($user)) {
            return response()->json(['message' => __('auth.cannot_delete_self')], 422);
        }
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => __('auth.user_deleted')]);
    }

    private function validated(Request $request, ?User $user = null, bool $creating = true): array
    {
        $password = $creating ? ['required', 'confirmed', Password::defaults()] : ['nullable', 'confirmed', Password::defaults()];

        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user?->id)],
            'password' => $password,
            'role' => ['required', Rule::in(self::ROLES)],
        ]);
    }

    private function assignRole(User $user, string $name): void
    {
        $role = Role::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        $user->update(['role_id' => $role->id]);
        $user->syncRoles([$name]);
    }

    private function userData(User $user): array
    {
        return ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => $user->getRoleNames()->first(), 'created_at' => $user->created_at];
    }
}
