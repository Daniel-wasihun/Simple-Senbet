<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $role = (string) $this->input('role', 'student');

        return $user !== null
            && $user->can('create', \App\Models\User::class)
            && $user->can('assignRoleName', [\App\Models\User::class, $role]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'role' => ['required', Rule::in(['student', 'teacher', 'superadmin'])],
        ];
    }
}
