<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RoleResource;
use App\Http\Responses\ApiResponse;
use App\Models\Role;
use Illuminate\Http\JsonResponse;

class RoleController extends Controller
{
    /**
     * Display a listing of all system roles with their permissions.
     */
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Role::class);

        $roles = Role::with('permissions')->orderBy('id')->get();

        return ApiResponse::success(
            RoleResource::collection($roles),
            'System roles retrieved successfully'
        );
    }

    /**
     * Display the specified role with its permissions.
     */
    public function show(Role $role): JsonResponse
    {
        $this->authorize('view', $role);

        $role->load('permissions');

        return ApiResponse::success(
            new RoleResource($role),
            'Role retrieved successfully'
        );
    }
}
