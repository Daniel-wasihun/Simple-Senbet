<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\HandlesCachedCrud;
use App\Http\Controllers\Controller;
use App\Http\Resources\SchoolClassResource;
use App\Models\SchoolClass;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SchoolClassController extends Controller
{
    use HandlesCachedCrud;

    private function rules(?SchoolClass $class = null): array
    {
        return ['name' => ['required', 'string', 'max:255'], 'code' => ['required', 'string', 'max:50', Rule::unique('classes')->ignore($class?->id)], 'number_of_sections' => ['required', 'integer', 'min:1'], 'passing_score' => ['required', 'numeric', 'between:0,100']];
    }

    public function index()
    {
        return $this->indexCrud(SchoolClass::class, SchoolClassResource::class, [], true);
    }

    public function store(Request $r)
    {
        return $this->storeCrud($r, SchoolClass::class, SchoolClassResource::class, $this->rules(), [], true);
    }

    public function show(SchoolClass $schoolClass)
    {
        return $this->showCrud($schoolClass, SchoolClassResource::class, [], true);
    }

    public function update(Request $r, SchoolClass $schoolClass)
    {
        return $this->updateCrud($r, $schoolClass, SchoolClassResource::class, $this->rules($schoolClass), [], true);
    }

    public function destroy(SchoolClass $schoolClass)
    {
        return $this->destroyCrud($schoolClass, true);
    }
}
