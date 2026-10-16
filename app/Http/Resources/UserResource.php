<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => RoleResource::make($this->whenLoaded('roles', fn () => $this->roles->first())),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
