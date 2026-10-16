<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SyncRolePermissionsRequest;
use App\Http\Resources\PermissionResource;
use App\Http\Resources\RoleResource;
use App\Models\Role;
use App\Services\RolePermissionService;

class RolePermissionController extends Controller
{
    public function __construct(private RolePermissionService $service) {}
    public function index(Role $role) { return response()->json(['role' => RoleResource::make($role), 'permission_groups' => collect($this->service->grouped($role))->map(fn ($group) => ['group_name' => $group['group_name'], 'permissions' => PermissionResource::collection($group['permissions'])])]); }
    public function sync(SyncRolePermissionsRequest $request, Role $role) { return response()->json(['message' => __('auth.permissions_updated'), 'role' => RoleResource::make($this->service->sync($role, $request->validated('permission_ids')))]); }
}
