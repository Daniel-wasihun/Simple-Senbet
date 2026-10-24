<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $target = $this->route('user');

        if (! $user || ! $target || ! $user->can('update', $target)) {
            return false;
        }

        return ! $this->filled('role')
            || $user->can('assignRoleTo', [$target, (string) $this->input('role')]);
    }

    public function rules(): array
    {
        $userParam = $this->route('user');
        $userId = $userParam instanceof User ? $userParam->id : $userParam;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'role' => ['sometimes', 'required', Rule::in(['student', 'teacher', 'superadmin'])],
        ];
    }
}
