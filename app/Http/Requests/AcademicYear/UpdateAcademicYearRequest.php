<?php

namespace App\Http\Requests\AcademicYear;

use App\Http\Requests\BaseRequest;

class UpdateAcademicYearRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'name' => $this->translatable(required: false, max: 100),
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date', 'after:start_date'],
            'is_current' => ['sometimes', 'boolean'],
        ];
    }
}
