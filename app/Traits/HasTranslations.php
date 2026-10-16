<?php

namespace App\Traits;

use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Config;

/**
 * Trait HasTranslations
 *
 * Provides professional multilingual translation capabilities for Eloquent models
 * with attributes stored in JSON/JSONB format.
 */
trait HasTranslations
{
    /**
     * Get the translated string for a given attribute and locale.
     *
     * @param string $attribute The attribute name
     * @param string|null $locale Target locale (defaults to current app locale)
     * @param bool $useFallback Whether to fallback if the requested locale is missing
     * @return string|null
     */
    public function getTranslation(string $attribute, ?string $locale = null, bool $useFallback = true): ?string
    {
        $locale = $locale ?: App::getLocale();
        $translations = $this->getTranslations($attribute);

        if (empty($translations)) {
            return null;
        }

        // 1. Direct match for requested locale
        if (!empty($translations[$locale]) && is_string($translations[$locale])) {
            return trim($translations[$locale]);
        }

        // 2. Language-only match (e.g., 'en-US' -> 'en')
        $shortLocale = substr($locale, 0, 2);
        if (!empty($translations[$shortLocale]) && is_string($translations[$shortLocale])) {
            return trim($translations[$shortLocale]);
        }

        if (!$useFallback) {
            return null;
        }

        // 3. Fallback locale from config
        $fallback = Config::get('app.fallback_locale', 'en');
        if (!empty($translations[$fallback]) && is_string($translations[$fallback])) {
            return trim($translations[$fallback]);
        }

        // 4. English fallback
        if (!empty($translations['en']) && is_string($translations['en'])) {
            return trim($translations['en']);
        }

        // 5. First available non-empty translation
        foreach ($translations as $text) {
            if (is_string($text) && trim($text) !== '') {
                return trim($text);
            }
        }

        return null;
    }

    /**
     * Get all translations for a given attribute as an associative array.
     *
     * @param string $attribute
     * @return array<string, string>
     */
    public function getTranslations(string $attribute): array
    {
        $value = $this->getAttributeValue($attribute);

        if (is_null($value)) {
            return [];
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? $decoded : [];
        }

        return is_array($value) ? $value : [];
    }

    /**
     * Set a specific locale translation for an attribute.
     *
     * @param string $attribute
     * @param string $locale
     * @param string|null $value
     * @return static
     */
    public function setTranslation(string $attribute, string $locale, ?string $value): static
    {
        $translations = $this->getTranslations($attribute);

        if (is_null($value) || trim($value) === '') {
            unset($translations[$locale]);
        } else {
            $translations[$locale] = trim($value);
        }

        $this->setAttribute($attribute, empty($translations) ? null : $translations);

        return $this;
    }

    /**
     * Set all translations for an attribute.
     *
     * @param string $attribute
     * @param array<string, string|null> $translations
     * @return static
     */
    public function setTranslations(string $attribute, array $translations): static
    {
        $sanitized = [];
        foreach ($translations as $locale => $value) {
            if (!is_null($value) && is_string($value) && trim($value) !== '') {
                $sanitized[$locale] = trim($value);
            }
        }

        $this->setAttribute($attribute, empty($sanitized) ? null : $sanitized);

        return $this;
    }

    /**
     * Check if a specific translation exists for an attribute.
     *
     * @param string $attribute
     * @param string|null $locale
     * @return bool
     */
    public function hasTranslation(string $attribute, ?string $locale = null): bool
    {
        $locale = $locale ?: App::getLocale();
        $translations = $this->getTranslations($attribute);

        return !empty($translations[$locale]) && is_string($translations[$locale]) && trim($translations[$locale]) !== '';
    }

    /**
     * Get the translated value for an attribute in the current application locale.
     *
     * @param string $attribute
     * @return string|null
     */
    public function translated(string $attribute): ?string
    {
        return $this->getTranslation($attribute);
    }

    /**
     * Dynamically retrieve translatable attributes or localized accessors.
     *
     * @param string $key
     * @return mixed
     */
    public function getAttribute($key)
    {
        // Support {attribute}_localized (e.g. name_localized, full_name_localized)
        if (is_string($key) && str_ends_with($key, '_localized')) {
            $baseAttr = substr($key, 0, -10);
            if ($this->isTranslatableAttribute($baseAttr)) {
                return $this->getTranslation($baseAttr);
            }
        }

        // Support translated_{attribute} (e.g. translated_name, translated_full_name)
        if (is_string($key) && str_starts_with($key, 'translated_')) {
            $baseAttr = substr($key, 11);
            if ($this->isTranslatableAttribute($baseAttr)) {
                return $this->getTranslation($baseAttr);
            }
        }

        return parent::getAttribute($key);
    }

    /**
     * Check if a given attribute is marked as translatable.
     *
     * @param string $key
     * @return bool
     */
    public function isTranslatableAttribute(string $key): bool
    {
        return in_array($key, $this->getTranslatableAttributes(), true);
    }

    /**
     * Get the list of translatable attributes for the model.
     *
     * @return array<string>
     */
    public function getTranslatableAttributes(): array
    {
        return property_exists($this, 'translatable') && is_array($this->translatable)
            ? $this->translatable
            : [];
    }

    /**
     * Returns an array of localized attribute values for all translatable attributes.
     *
     * @param string|null $locale
     * @return array<string, string|null>
     */
    public function toLocalizedArray(?string $locale = null): array
    {
        $localized = [];
        $translatable = property_exists($this, 'translatable') ? $this->translatable : [];

        foreach ($translatable as $attribute) {
            $localized[$attribute] = $this->getTranslation($attribute, $locale);
        }

        return $localized;
    }
}
