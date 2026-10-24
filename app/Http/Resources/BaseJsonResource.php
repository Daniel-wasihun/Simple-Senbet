<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\App;

/**
 * Base JSON Resource providing automatic localization metadata
 * and convenient translatable attribute helpers.
 */
abstract class BaseJsonResource extends JsonResource
{
    /**
     * Get additional data that should be returned with the resource array.
     *
     * @return array<string, mixed>
     */
    public function with(Request $request): array
    {
        return [
            'meta' => [
                'locale' => App::getLocale(),
                'timestamp' => now()->toIso8601String(),
            ],
        ];
    }

    /**
     * Helper to append localized strings for translatable model fields into resource arrays.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function appendLocalized(array $data): array
    {
        if (isset($this->resource) && is_object($this->resource) && method_exists($this->resource, 'getTranslatableAttributes')) {
            foreach ($this->resource->getTranslatableAttributes() as $field) {
                if (array_key_exists($field, $data)) {
                    $data["{$field}_localized"] = $this->resource->getTranslation($field);
                }
            }
        }

        return $data;
    }
}
