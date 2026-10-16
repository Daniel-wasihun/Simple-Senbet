<?php
namespace App\Services;
use App\Models\Member; use App\Services\Crud\BaseCrudService;
class MemberService extends BaseCrudService { protected string $model = Member::class; protected array $with = ['schoolClass']; }
