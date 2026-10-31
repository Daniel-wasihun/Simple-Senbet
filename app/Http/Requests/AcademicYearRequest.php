<?php

namespace App\Http\Requests;

use App\Models\AcademicYear;
use Illuminate\Foundation\Http\FormRequest;

class AcademicYearRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can($this->isMethod('POST') ? 'create' : 'update', $this->route('academic_year') ?? AcademicYear::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'array'],
            'name.en' => ['required', 'string', 'max:100'],
            'name.am' => ['nullable', 'string', 'max:100'],
            'name.om' => ['nullable', 'string', 'max:100'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'is_current' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $name = $this->input('name', []);
        if (is_string($name)) $name = ['en' => $name];
        if (!is_array($name)) $name = [];
        $year = $this->route('academic_year');
        if ($year instanceof AcademicYear) {
            $stored = $year->getTranslations('name');
            foreach (['en', 'am', 'om'] as $locale) {
                if (!isset($name[$locale]) || $name[$locale] === '') $name[$locale] = $stored[$locale] ?? null;
            }
        }
        if (empty($name['en'])) {
            $name['en'] = $name['am'] ?? $name['om'] ?? null;
        }
        $this->merge(['name' => $name]);
    }
}
