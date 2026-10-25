<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use App\Http\Resources\RoleResource;
use App\Http\Responses\ApiResponse;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Spatie\Permission\PermissionRegistrar;

class RoleController extends Controller
{
    /**
     * Display a listing of all system roles with their permissions.
     */
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Role::class);

        $roles = Role::with('permissions')->withCount('users')->orderBy('id')->get();

        return ApiResponse::success(
            RoleResource::collection($roles),
            'System roles retrieved successfully'
        );
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        $this->authorize('create', Role::class);
        $role = Role::create($request->validated() + ['guard_name' => 'web']);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $role->load('permissions')->loadCount('users');

        return ApiResponse::success(new RoleResource($role), 'Role created successfully', 201);
    }

    /**
     * Display the specified role with its permissions.
     */
    public function show(Role $role): JsonResponse
    {
        $this->authorize('view', $role);

        $role->load('permissions')->loadCount('users');

        return ApiResponse::success(
            new RoleResource($role),
            'Role retrieved successfully'
        );
    }

    public function update(UpdateRoleRequest $request, Role $role): JsonResponse
    {
        $this->authorize('update', $role);
        $role->update($request->validated());
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $role->load('permissions')->loadCount('users');

        return ApiResponse::success(new RoleResource($role), 'Role updated successfully');
    }

    public function destroy(Role $role): JsonResponse
    {
        $this->authorize('delete', $role);
        $role->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return ApiResponse::success(null, 'Role deleted successfully');
    }
}
