<?php

namespace App\Services;

use App\Models\Assessment;
use App\Services\Crud\BaseCrudService;

class AssessmentService extends BaseCrudService
{
    /**
     * Target Eloquent model.
     */
    protected string $model = Assessment::class;

    /**
     * Eager loaded relationships.
     *
     * @var list<string>
     */
    protected array $with = [];
}
