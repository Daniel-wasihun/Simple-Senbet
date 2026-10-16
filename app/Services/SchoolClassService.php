<?php
namespace App\Services;
use App\Models\SchoolClass; use App\Services\Crud\BaseCrudService;
class SchoolClassService extends BaseCrudService { protected string $model = SchoolClass::class; }
