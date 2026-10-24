<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SyncRolePermissionsRequest;
use App\Http\Resources\PermissionResource;
use App\Http\Resources\RoleResource;
use App\Models\Role;
use App\Services\RolePermissionService;
use Illuminate\Http\JsonResponse;

class RolePermissionController extends Controller
{
    public function __construct(private RolePermissionService $service) {}

    /**
     * Display a listing of permissions for a role, categorized by group.
     */
    public function index(Role $role): JsonResponse
    {
        return response()->json([
            'role' => RoleResource::make($role),
            'permission_groups' => collect($this->service->grouped($role))->map(fn ($group) => [
                'group_name' => $group['group_name'],
                'permissions' => PermissionResource::collection($group['permissions']),
            ]),
        ]);
    }

    /**
     * Sync assigned permissions for a given role.
     */
    public function sync(SyncRolePermissionsRequest $request, Role $role): JsonResponse
    {
        return response()->json([
            'message' => __('auth.permissions_updated'),
            'role' => RoleResource::make($this->service->sync($role, $request->validated('permission_ids'))),
        ]);
    }
}
