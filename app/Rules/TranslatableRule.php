<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validation rule ensuring a translatable field is an array/JSON object
 * containing at least one valid, non-empty language translation.
 */
class TranslatableRule implements ValidationRule
{
    /**
     * @param bool $required Whether at least one translation is required
     * @param int $maxLength Maximum allowed characters for each translation string
     * @param array<string> $allowedLocales Optional whitelist of allowed language codes
     */
    public function __construct(
        protected bool $required = true,
        protected int $maxLength = 255,
        protected array $allowedLocales = []
    ) {}

    /**
     * Run the validation rule.
     *
     * @param string $attribute
     * @param mixed $value
     * @param Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // 1. Check null/empty handling
        if (is_null($value) || $value === '' || $value === []) {
            if ($this->required) {
                $fail("The :attribute field must contain at least one language translation (e.g., 'en', 'am').");
            }
            return;
        }

        // 2. Must be an array / JSON object
        if (!is_array($value)) {
            $fail("The :attribute must be an object containing language translations.");
            return;
        }

        $validCount = 0;

        foreach ($value as $locale => $translation) {
            // Validate language key format (ISO 639-1 / BCP 47 format: e.g. en, am, om, ti, en-US)
            if (!is_string($locale) || !preg_match('/^[a-z]{2,3}(-[a-zA-Z0-9]+)?$/i', $locale)) {
                $fail("The :attribute contains an invalid language code [:locale].");
                return;
            }

            if (!empty($this->allowedLocales) && !in_array(strtolower($locale), array_map('strtolower', $this->allowedLocales), true)) {
                $fail("The language [{$locale}] is not supported for :attribute. Allowed: " . implode(', ', $this->allowedLocales) . '.');
                return;
            }

            // If a translation is provided for this locale, check its type and length
            if (!is_null($translation)) {
                if (!is_string($translation)) {
                    $fail("The :attribute translation for [{$locale}] must be a text string.");
                    return;
                }

                $trimmed = trim($translation);
                if ($trimmed !== '') {
                    if (mb_strlen($trimmed) > $this->maxLength) {
                        $fail("The :attribute translation for [{$locale}] may not exceed {$this->maxLength} characters.");
                        return;
                    }
                    $validCount++;
                }
            }
        }

        // 3. Must have at least one valid, non-empty translation if required
        if ($this->required && $validCount === 0) {
            $fail("The :attribute must contain at least one non-empty language translation (e.g., 'en', 'am').");
        }
    }
}
