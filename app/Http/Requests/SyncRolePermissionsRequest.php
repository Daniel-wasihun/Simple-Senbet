<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SyncRolePermissionsRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array { return ['permission_ids' => ['present', 'array'], 'permission_ids.*' => ['integer', 'exists:permissions,id']]; }
}
