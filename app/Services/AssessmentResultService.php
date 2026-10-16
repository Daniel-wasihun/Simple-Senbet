<?php
namespace App\Services;
use App\Models\AssessmentResult; use App\Services\Crud\BaseCrudService;
class AssessmentResultService extends BaseCrudService { protected string $model = AssessmentResult::class; protected array $with = ['assessment','member.schoolClass']; }
