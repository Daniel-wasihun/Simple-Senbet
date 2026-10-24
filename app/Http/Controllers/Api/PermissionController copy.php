<?php

namespace App\Modules\UserManagement\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Modules\UserManagement\Requests\Permissions\IndexPermissionsRequest;
use App\Modules\UserManagement\Resources\PermissionResource;
use App\Modules\UserManagement\Services\PermissionService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PermissionController extends Controller
{
    public function __construct(
        private readonly PermissionService $permissionService
    ) {}

    public function index(IndexPermissionsRequest $request): AnonymousResourceCollection
    {
        return PermissionResource::collection(
            $this->permissionService->paginate($request->validated())
        );
    }
}
