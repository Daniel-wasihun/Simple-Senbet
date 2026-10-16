<?php

namespace App\Http\Middleware;

use Carbon\Carbon;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Config;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to determine, set, and enforce application localization per request,
 * and attach standard localization headers and metadata to every response.
 */
class LocalizationMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param Closure(Request): (Response) $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $supportedLocales = Config::get('app.available_locales', ['en', 'am', 'om', 'ti']);
        $defaultLocale = Config::get('app.locale', 'en');

        $locale = $this->determineLocale($request, $supportedLocales, $defaultLocale);

        // Apply locale to Laravel App and Carbon
        App::setLocale($locale);
        Carbon::setLocale($locale);

        $response = $next($request);

        // Enforce localization headers in every response
        $response->headers->set('Content-Language', $locale);
        $response->headers->set('Vary', 'Accept-Language, X-Locale', false);

        return $response;
    }

    /**
     * Determine the appropriate locale from query parameters, headers, or client preferences.
     *
     * Priority:
     * 1. Query parameter: ?locale= or ?lang=
     * 2. Header: X-Locale
     * 3. Header: Accept-Language (weighted quality factors)
     * 4. Authenticated User: user()->preferred_locale
     * 5. Default app locale
     *
     * @param Request $request
     * @param array<string> $supported
     * @param string $default
     * @return string
     */
    protected function determineLocale(Request $request, array $supported, string $default): string
    {
        // 1. Explicit query parameter
        $param = $request->query('locale') ?: $request->query('lang');
        if ($param && $this->isSupported($param, $supported)) {
            return $this->normalizeLocale($param);
        }

        // 2. Custom header (e.g. X-Locale sent by Next.js / API client)
        $headerLocale = $request->header('X-Locale');
        if ($headerLocale && $this->isSupported($headerLocale, $supported)) {
            return $this->normalizeLocale($headerLocale);
        }

        // 3. User preference if authenticated
        $user = $request->user();
        if ($user && isset($user->preferred_locale) && $this->isSupported($user->preferred_locale, $supported)) {
            return $this->normalizeLocale($user->preferred_locale);
        }

        // 4. Accept-Language header parsing
        $acceptLanguage = $request->header('Accept-Language');
        if ($acceptLanguage) {
            $parsed = $this->parseAcceptLanguage($acceptLanguage, $supported);
            if ($parsed) {
                return $parsed;
            }
        }

        return $default;
    }

    /**
     * Check if a locale candidate is in the supported list.
     *
     * @param string $candidate
     * @param array<string> $supported
     * @return bool
     */
    protected function isSupported(string $candidate, array $supported): bool
    {
        $normalized = $this->normalizeLocale($candidate);
        return in_array($normalized, $supported, true);
    }

    /**
     * Normalize a locale string (e.g., 'en-US' -> 'en', 'am_ET' -> 'am').
     *
     * @param string $locale
     * @return string
     */
    protected function normalizeLocale(string $locale): string
    {
        $locale = str_replace('_', '-', trim(strtolower($locale)));
        $parts = explode('-', $locale);
        return $parts[0];
    }

    /**
     * Parse the Accept-Language header according to RFC 7231 quality values.
     *
     * @param string $header
     * @param array<string> $supported
     * @return string|null
     */
    protected function parseAcceptLanguage(string $header, array $supported): ?string
    {
        $locales = [];

        foreach (explode(',', $header) as $part) {
            $tokens = explode(';', trim($part));
            $code = $this->normalizeLocale($tokens[0]);
            $q = 1.0;

            if (isset($tokens[1])) {
                $qTokens = explode('=', trim($tokens[1]));
                if (isset($qTokens[0], $qTokens[1]) && trim($qTokens[0]) === 'q') {
                    $q = (float) trim($qTokens[1]);
                }
            }

            if (!empty($code)) {
                $locales[$code] = $q;
            }
        }

        // Sort locales by quality factor descending
        arsort($locales);

        foreach (array_keys($locales) as $candidate) {
            if (in_array($candidate, $supported, true)) {
                return $candidate;
            }
        }

        return null;
    }
}
