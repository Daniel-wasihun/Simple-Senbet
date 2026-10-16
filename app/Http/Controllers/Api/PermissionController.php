<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePermissionRequest;
use App\Http\Requests\UpdatePermissionRequest;
use App\Http\Resources\PermissionResource;
use App\Models\Permission;

class PermissionController extends Controller
{
    public function index() { return PermissionResource::collection(Permission::orderBy('group_name')->paginate(50)); }
    public function store(StorePermissionRequest $request) { $permission = Permission::create($request->validated() + ['guard_name' => 'web']); return response()->json(['message' => __('auth.permission_created'), 'permission' => PermissionResource::make($permission)], 201); }
    public function update(UpdatePermissionRequest $request, Permission $permission) { $permission->update($request->validated()); return ['message' => __('auth.permission_updated'), 'permission' => PermissionResource::make($permission->fresh())]; }
    public function destroy(Permission $permission) { $permission->delete(); return response()->json(['message' => __('auth.permission_deleted')]); }
}
