<?php

namespace App\Http\Requests;

use App\Models\SchoolClass;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SchoolClassRequest extends FormRequest
{
    public function authorize(): bool
    {
        $subject = $this->route('school_class') ?? SchoolClass::class;

        return $this->user()?->can($this->isMethod('POST') ? 'create' : 'update', $subject) ?? false;
    }

    public function rules(): array
    {
        $classParam = $this->route('school_class');
        $classId = $classParam instanceof SchoolClass ? $classParam->id : $classParam;

        return [
            'name' => ['required', 'array'],
            'name.en' => ['required', 'string', 'max:255'],
            'name.am' => ['nullable', 'string', 'max:255'],
            'name.om' => ['nullable', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', Rule::unique('classes', 'code')->ignore($classId)],
            'number_of_sections' => ['required', 'integer', 'min:1'],
            'passing_score' => ['required', 'numeric', 'between:0,100'],
            'next_class_id' => ['sometimes', 'nullable', 'integer', 'exists:classes,id'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $name = $this->input('name', []);
        if (is_string($name)) $name = ['en' => $name];
        if (!is_array($name)) $name = [];
        $existing = $this->route('school_class');
        if ($existing instanceof SchoolClass) {
            $stored = $existing->getTranslations('name');
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
