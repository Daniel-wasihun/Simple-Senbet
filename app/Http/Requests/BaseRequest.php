<?php

namespace App\Http\Requests;

use App\Rules\TranslatableRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\App;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;

/**
 * Base Form Request providing clean, reusable validation helpers
 * and unified JSON validation error responses.
 */
abstract class BaseRequest extends FormRequest
{
    protected function authorizePolicy(string $ability, string $modelClass, ?string $routeKey = null): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }

        $subject = $routeKey ? $this->route($routeKey) : $modelClass;

        return $subject !== null && $user->can($ability, $subject);
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return false;
    }

    /**
     * Helper to build a clean translatable rule array.
     *
     * @param bool $required Whether at least one language translation is required
     * @param int $max Maximum character length per translation
     * @param array<string> $allowed Optional whitelist of language codes
     * @return array<mixed>
     */
    protected function translatable(bool $required = true, int $max = 255, array $allowed = []): array
    {
        return [
            $required ? 'required' : 'nullable',
            'array',
            new TranslatableRule(required: $required, maxLength: $max, allowedLocales: $allowed),
        ];
    }

    /**
     * Helper to build a unique rule that automatically ignores the current resource on updates.
     *
     * @param string $table
     * @param string $column
     * @param mixed|null $ignoreId
     * @return Unique
     */
    protected function uniqueIgnore(string $table, string $column, mixed $ignoreId = null): Unique
    {
        $id = $ignoreId
            ?? $this->route('id')
            ?? $this->route(rtrim($table, 's'))
            ?? $this->route('school_class')
            ?? $this->route('class')
            ?? $this->input('id');

        return Rule::unique($table, $column)->ignore($id);
    }

    /**
     * Handle a failed validation attempt and return a standardized JSON response.
     *
     * @param Validator $validator
     * @throws HttpResponseException
     */
    protected function failedValidation(Validator $validator): void
    {
        $response = new JsonResponse([
            'success' => false,
            'message' => __('Validation failed.'),
            'errors' => $validator->errors(),
        ], 422);

        $response->headers->set('Content-Language', App::getLocale());

        throw new HttpResponseException($response);
    }
}
