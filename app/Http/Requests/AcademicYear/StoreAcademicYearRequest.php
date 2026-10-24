<?php

namespace App\Http\Requests\AcademicYear;

use App\Http\Requests\BaseRequest;

class StoreAcademicYearRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return $this->authorizePolicy('create', \App\Models\AcademicYear::class);
    }

    public function rules(): array
    {
        return [
            'name' => $this->translatable(required: true, max: 100),
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'is_current' => ['sometimes', 'boolean'],
        ];
    }
}
