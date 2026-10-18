<?php

namespace App\Services;

use App\Models\SchoolClass;
use App\Services\Crud\BaseCrudService;

class SchoolClassService extends BaseCrudService
{
    /**
     * Target Eloquent model.
     */
    protected string $model = SchoolClass::class;

    /**
     * Eager loaded relationships.
     *
     * @var list<string>
     */
    protected array $with = [];
}
