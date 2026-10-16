<?php
namespace App\Services;
use App\Models\Assessment; use App\Services\Crud\BaseCrudService;
class AssessmentService extends BaseCrudService { 
    protected string $model = Assessment::class; 
    }
