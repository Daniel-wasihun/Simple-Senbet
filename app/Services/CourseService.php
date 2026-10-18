<?php

namespace App\Services;

use App\Models\Course;
use App\Services\Crud\BaseCrudService;

class CourseService extends BaseCrudService
{
    /**
     * Target Eloquent model.
     */
    protected string $model = Course::class;

    /**
     * Eager loaded relationships.
     *
     * @var list<string>
     */
    protected array $with = ['schoolClass'];
}
