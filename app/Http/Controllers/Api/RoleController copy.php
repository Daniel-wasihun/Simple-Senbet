<?php

namespace App\Modules\UserManagement\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Modules\UserManagement\Models\Role;
use App\Modules\UserManagement\Requests\Roles\DeleteRoleRequest;
use App\Modules\UserManagement\Requests\Roles\StoreRoleRequest;
use App\Modules\UserManagement\Requests\Roles\SyncRolePermissionsRequest;
use App\Modules\UserManagement\Requests\Roles\UpdateRoleRequest;
use App\Modules\UserManagement\Requests\Roles\ViewRolesRequest;
use App\Modules\UserManagement\Resources\RoleResource;
use App\Modules\UserManagement\Services\RoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class RoleController extends Controller
{
    public function __construct(
        private readonly RoleService $roleService
    ) {}

    public function index(
        ViewRolesRequest $request
    ): AnonymousResourceCollection {
        Gate::authorize('viewAny', Role::class);
        $roles = $this->roleService->paginate(
            $request->validated()
        );

        return RoleResource::collection($roles);
    }

    public function store(
        StoreRoleRequest $request
    ): JsonResponse {
        Gate::authorize('create', Role::class);
        $role = $this->roleService->create(
            $request->validated()
        );

        return (new RoleResource($role))
            ->response()
            ->setStatusCode(201);
    }

    public function show(
        ViewRolesRequest $request,
        Role $role
    ): RoleResource {
        Gate::authorize('view', $role);
        $role->load('permissions')
            ->loadCount(['users', 'permissions']);

        return new RoleResource($role);
    }

    public function update(
        UpdateRoleRequest $request,
        Role $role
    ): RoleResource {
        Gate::authorize('update', $role);
        $updatedRole = $this->roleService->update(
            $role,
            $request->validated()
        );

        return new RoleResource($updatedRole);
    }

    public function destroy(
        DeleteRoleRequest $request,
        Role $role
    ): JsonResponse {
        Gate::authorize('delete', $role);
        $this->roleService->delete($role);

        return response()->json(null, 204);
    }

    public function syncPermissions(
        SyncRolePermissionsRequest $request,
        Role $role
    ): RoleResource {
        Gate::authorize('assignPermissions', $role);
        $updatedRole = $this->roleService->syncPermissions(
            $request->user(),
            $role,
            $request->validated('permission_ids')
        );

        return new RoleResource(
            $updatedRole->loadCount(['users', 'permissions'])
        );
    }
}
