<?php

namespace App\Modules\UserManagement\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PermissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'module' => $this->module,
            'description' => $this->description,
            'roles_count' => $this->whenCounted('roles'),
        ];
    }
}
