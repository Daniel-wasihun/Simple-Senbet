<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\App;

/**
 * Standardized API Response factory for consistent, localized JSON responses.
 */
class ApiResponse
{
    /**
     * Return a successful JSON response.
     *
     * @param mixed $data Response payload
     * @param string $message User-facing message
     * @param int $status HTTP status code
     * @param array<string, string> $headers Additional headers
     * @return JsonResponse
     */
    public static function success(mixed $data = null, string $message = 'Success', int $status = 200, array $headers = []): JsonResponse
    {
        $payload = [
            'success' => true,
            'message' => $message,
            'data' => $data,
            'meta' => [
                'locale' => App::getLocale(),
                'timestamp' => now()->toIso8601String(),
            ],
        ];

        return response()->json($payload, $status, $headers);
    }

    /**
     * Return a 201 Created JSON response.
     *
     * @param mixed $data
     * @param string $message
     * @return JsonResponse
     */
    public static function created(mixed $data = null, string $message = 'Created successfully'): JsonResponse
    {
        return self::success($data, $message, 201);
    }

    /**
     * Return an error JSON response.
     *
     * @param string $message
     * @param mixed $errors Validation or error details
     * @param int $status HTTP status code
     * @return JsonResponse
     */
    public static function error(string $message = 'Error', mixed $errors = null, int $status = 400): JsonResponse
    {
        $payload = [
            'success' => false,
            'message' => $message,
            'errors' => $errors,
            'meta' => [
                'locale' => App::getLocale(),
                'timestamp' => now()->toIso8601String(),
            ],
        ];

        return response()->json($payload, $status);
    }

    /**
     * Return a 403 Forbidden JSON response.
     *
     * @param string $message
     * @return JsonResponse
     */
    public static function forbidden(string $message = 'Forbidden'): JsonResponse
    {
        return self::error($message, null, 403);
    }

    /**
     * Return a 404 Not Found JSON response.
     *
     * @param string $message
     * @return JsonResponse
     */
    public static function notFound(string $message = 'Resource not found'): JsonResponse
    {
        return self::error($message, null, 404);
    }

    /**
     * Return a paginated JSON response with metadata.
     *
     * @param LengthAwarePaginator $paginator
     * @param string $message
     * @return JsonResponse
     */
    public static function paginated(LengthAwarePaginator $paginator, string $message = 'Data retrieved successfully'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $paginator->items(),
            'pagination' => [
                'total' => $paginator->total(),
                'count' => $paginator->count(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'total_pages' => $paginator->lastPage(),
            ],
            'meta' => [
                'locale' => App::getLocale(),
                'timestamp' => now()->toIso8601String(),
            ],
        ], 200);
    }
}
