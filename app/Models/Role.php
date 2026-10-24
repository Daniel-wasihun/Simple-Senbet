<?php

namespace App\Models;

use Database\Factories\RoleFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;
use OpenApi\Attributes as OA;
use Spatie\Permission\Models\Role as SpatieRole;

#[OA\Schema(
    schema: 'Role',
    description: 'Role Model',
    title: 'Role',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'name', type: 'string', example: 'Admin'),
        new OA\Property(property: 'guard_name', type: 'string', example: 'web'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
    ]
)]
class Role extends SpatieRole
{
    /** @use HasFactory<RoleFactory> */
    use HasFactory;

    protected $fillable = ['name', 'guard_name', 'label'];

    protected $appends = ['slug'];

    protected function casts(): array
    {
        return ['label' => 'array'];
    }

    public function getSlugAttribute(): string
    {
        return Str::slug($this->name);
    }
}
