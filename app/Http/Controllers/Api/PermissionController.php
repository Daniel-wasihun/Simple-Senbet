<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePermissionRequest;
use App\Http\Requests\UpdatePermissionRequest;
use App\Http\Resources\PermissionResource;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\Permission\PermissionRegistrar;

class PermissionController extends Controller
{
    /**
     * Display a paginated listing of permissions grouped by resource.
     */
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Permission::class);

        return PermissionResource::collection(Permission::orderBy('group_name')->paginate(50));
    }

    /**
     * Store a newly created permission.
     */
    public function store(StorePermissionRequest $request): JsonResponse
    {
        $this->authorize('create', Permission::class);

        $permission = Permission::create($request->validated() + ['guard_name' => 'web']);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return response()->json([
            'message' => __('auth.permission_created'),
            'permission' => PermissionResource::make($permission),
        ], 201);
    }

    /**
     * Update the specified permission.
     */
    public function update(UpdatePermissionRequest $request, Permission $permission): array
    {
        $this->authorize('update', $permission);

        $permission->update($request->validated());
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return [
            'message' => __('auth.permission_updated'),
            'permission' => PermissionResource::make($permission->fresh()),
        ];
    }

    /**
     * Remove the specified permission from storage.
     */
    public function destroy(Permission $permission): JsonResponse
    {
        $this->authorize('delete', $permission);

        $permission->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return response()->json(['message' => __('auth.permission_deleted')]);
    }
}
