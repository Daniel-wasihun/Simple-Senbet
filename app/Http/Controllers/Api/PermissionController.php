<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePermissionRequest;
use App\Http\Requests\UpdatePermissionRequest;
use App\Http\Resources\PermissionResource;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PermissionController extends Controller
{
    /**
     * Display a paginated listing of permissions grouped by resource.
     */
    public function index(): AnonymousResourceCollection
    {
        return PermissionResource::collection(Permission::orderBy('group_name')->paginate(50));
    }

    /**
     * Store a newly created permission.
     */
    public function store(StorePermissionRequest $request): JsonResponse
    {
        $permission = Permission::create($request->validated() + ['guard_name' => 'web']);

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
        $permission->update($request->validated());

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
        $permission->delete();

        return response()->json(['message' => __('auth.permission_deleted')]);
    }
}
