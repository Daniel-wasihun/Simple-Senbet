<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\HandlesCachedCrud;
use App\Http\Controllers\Controller;
use App\Http\Resources\AcademicYearResource;
use App\Http\Responses\ApiResponse;
use App\Models\AcademicYear;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AcademicYearController extends Controller
{
    use HandlesCachedCrud;

    /**
     * Validation rules for Academic Year.
     */
    private function rules(?AcademicYear $year = null): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('academic_years')->ignore($year?->id),
            ],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'is_current' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Display a paginated listing of academic years.
     */
    public function index()
    {
        return $this->indexCrud(AcademicYear::class, AcademicYearResource::class);
    }

    /**
     * Store a newly created academic year in storage.
     */
    public function store(Request $request)
    {
        return $this->storeCrud($request, AcademicYear::class, AcademicYearResource::class, $this->rules());
    }

    /**
     * Display the specified academic year.
     */
    public function show(AcademicYear $academicYear)
    {
        return $this->showCrud($academicYear, AcademicYearResource::class);
    }

    /**
     * Retrieve the currently active or latest academic year.
     */
    public function current(): JsonResponse
    {
        $current = AcademicYear::where('is_current', true)->first()
            ?? AcademicYear::latest('id')->first();

        if (! $current) {
            return ApiResponse::notFound('No active academic year found');
        }

        return ApiResponse::success(
            new AcademicYearResource($current),
            'Current academic year retrieved successfully'
        );
    }

    /**
     * Update the specified academic year in storage.
     */
    public function update(Request $request, AcademicYear $academicYear)
    {
        return $this->updateCrud($request, $academicYear, AcademicYearResource::class, $this->rules($academicYear));
    }

    /**
     * Remove the specified academic year from storage.
     */
    public function destroy(AcademicYear $academicYear)
    {
        return $this->destroyCrud($academicYear);
    }
}
