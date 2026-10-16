<?php
namespace App\Services;
use App\Models\AcademicYear; use App\Services\Crud\BaseCrudService;
class AcademicYearService extends BaseCrudService { protected string $model = AcademicYear::class; public function create(array $data): \Illuminate\Database\Eloquent\Model { if (($data['is_current'] ?? false)) AcademicYear::query()->update(['is_current'=>false]); return parent::create($data); } public function update(\Illuminate\Database\Eloquent\Model $model,array $data): \Illuminate\Database\Eloquent\Model { if (($data['is_current'] ?? false)) AcademicYear::whereKeyNot($model->id)->update(['is_current'=>false]); return parent::update($model,$data); } }
