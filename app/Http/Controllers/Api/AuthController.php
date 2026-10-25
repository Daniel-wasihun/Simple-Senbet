<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $this->authorize('register', User::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', PasswordRule::defaults()],
            'role' => ['sometimes', 'string', 'exists:roles,name'],
        ]);

        $roleName = $data['role'] ?? 'student';
        $this->authorize('assignRoleName', [User::class, $roleName]);
        $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role_id' => $role->id,
        ]);
        $user->syncRoles([$role->name]);

        return response()->json([
            'message' => __('auth.registered'),
            'user' => $this->userData($user),
            'token' => $user->createToken('api-token')->plainTextToken,
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => __('auth.failed')], 422);
        }

        $user->tokens()->where('name', $data['device_name'] ?? 'api-token')->delete();

        return response()->json([
            'message' => __('auth.logged_in'),
            'user' => $this->userData($user),
            'token' => $user->createToken($data['device_name'] ?? 'api-token')->plainTextToken,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => __('auth.logged_out')]);
    }

    public function forgotPassword(Request $request)
    {
        $data = $request->validate(['email' => ['required', 'email']]);
        Password::sendResetLink($data);

        // Do not reveal whether an account exists for this email address.
        return response()->json(['message' => __('auth.passwords.sent')]);
    }

    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::defaults()],
        ]);

        $status = Password::reset($data, function (User $user, string $password): void {
            $user->forceFill([
                'password' => $password,
                'remember_token' => Str::random(60),
            ])->save();

            $user->tokens()->delete();
            event(new PasswordReset($user));
        });

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json(['message' => __($status)], 422);
        }

        return response()->json(['message' => __('auth.passwords.reset')]);
    }

    private function userData(User $user): array
    {
        $data = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->getRoleNames()->first(),
            'roles' => $user->getRoleNames()->values()->all(),
            'permissions' => $user->getAllPermissions()->pluck('name')->unique()->values()->all(),
            'created_at' => $user->created_at?->toIso8601String(),
        ];

        if ($user->hasRole('teacher')) {
            $data['teaching_assignments'] = $user->teachingAssignments()
                ->with(['schoolClass:id,name,code', 'course:id,name,code', 'academicYear:id,name'])
                ->get()
                ->map(fn ($assignment) => [
                    'id' => $assignment->id,
                    'class_id' => $assignment->class_id,
                    'class_name' => $assignment->schoolClass?->name,
                    'class_code' => $assignment->schoolClass?->code,
                    'section' => $assignment->section,
                    'course_id' => $assignment->course_id,
                    'course_name' => $assignment->course?->name,
                    'course_code' => $assignment->course?->code,
                    'academic_year_id' => $assignment->academic_year_id,
                    'academic_year_name' => $assignment->academicYear?->name,
                    'semester' => $assignment->semester?->value ?? (string) $assignment->semester,
                    'is_primary' => (bool) $assignment->is_primary,
                    'start_date' => $assignment->start_date?->format('Y-m-d'),
                    'end_date' => $assignment->end_date?->format('Y-m-d'),
                ])->values()->all();
        }

        return $data;
    }
}
