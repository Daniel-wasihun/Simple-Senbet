<?php

namespace App\Modules\UserManagement\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'is_system' => (bool) $this->is_system,

            'users_count' => $this->whenCounted('users'),
            'permissions_count' => $this->whenCounted('permissions'),

            'permissions' => $this->whenLoaded(
                'permissions',
                fn () => $this->permissions->map(
                    fn ($permission) => [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'slug' => $permission->slug,
                        'module' => $permission->module,
                    ]
                )->values()
            ),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
