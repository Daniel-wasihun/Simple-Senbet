<?php
namespace App\Services;
use App\Models\Course; use App\Services\Crud\BaseCrudService;
class CourseService extends BaseCrudService { protected string $model = Course::class; protected array $with = ['schoolClass']; }
