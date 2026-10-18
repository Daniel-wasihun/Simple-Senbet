<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return response()->json(['user' => $this->userData($request->user())]);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
        ]);
        $user->update($data);

        return response()->json(['message' => __('auth.profile_updated'), 'user' => $this->userData($user->fresh())]);
    }

    public function updatePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $request->user()->update(['password' => Hash::make($data['password'])]);
        $request->user()->tokens()->whereKeyNot($request->user()->currentAccessToken()?->id)->delete();

        return response()->json(['message' => __('auth.password_updated')]);
    }

    private function userData(User $user): array
    {
        $data = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->getRoleNames()->first(),
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
