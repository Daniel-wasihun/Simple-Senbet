<?php

namespace App\Models;

use Spatie\Permission\Models\Permission as SpatiePermission;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: "Permission",
    description: "Permission Model",
    title: "Permission",
    properties: [
        new OA\Property(property: "id", type: "integer", example: 1),
        new OA\Property(property: "name", type: "string", example: "edit articles"),
        new OA\Property(property: "guard_name", type: "string", example: "web"),
        new OA\Property(property: "created_at", type: "string", format: "date-time"),
        new OA\Property(property: "updated_at", type: "string", format: "date-time")
    ]
)]
class Permission extends SpatiePermission
{
    protected $fillable = ['name', 'guard_name', 'group_name', 'label', 'description'];

    protected function casts(): array
    {
        return ['label' => 'array', 'description' => 'array'];
    }
}
