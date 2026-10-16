<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeadersMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // 1. Strict Transport Security (HSTS)
        // Enforce HTTPS for 1 year, include subdomains
        $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

        // 2. X-Frame-Options
        // Prevent Clickjacking (using frame-ancestors in CSP is better, but this is a fallback)
        $response->headers->set('X-Frame-Options', 'DENY');

        // 3. X-Content-Type-Options
        // Prevent MIME Sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // 4. X-XSS-Protection
        // Enable browser XSS filtering
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // 5. Referrer Policy
        // Strict origin when cross-origin (more secure than no-referrer-when-downgrade)
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // 6. X-Permitted-Cross-Domain-Policies
        // Restrict Flash/PDFs from loading data from this domain
        $response->headers->set('X-Permitted-Cross-Domain-Policies', 'none');

        // 7. Remove Server Headers (Best effort, server config might override)
        $response->headers->remove('Server');
        $response->headers->remove('X-Powered-By');

        // 8. Content Security Policy (CSP)
        // STRICTER POLICY: No unsafe-eval, upgrade-insecure-requests, form-action self

        $scriptSrc = "script-src 'self'";

        // Relax CSP for Swagger Documentation
        if ($request->is('api/documentation*')) {
            $scriptSrc .= " 'unsafe-inline' 'unsafe-eval'";
        }

        $csp = "default-src 'self'; " .
            $scriptSrc . "; " .
            "style-src 'self' 'unsafe-inline'; " . // unsafe-inline often needed for CSS-in-JS or style attrs
            "img-src 'self' data: https:; " .
            "font-src 'self' data: https:; " .
            "connect-src 'self' " . (app()->environment('local') ? "http://127.0.0.1:8000 http://localhost:8000" : "") . "; " .
            "frame-src 'self'; " .
            "frame-ancestors 'none'; " . // Block embedding
            "form-action 'self'; " . // Restrict form submissions
            "object-src 'none'; " .
            "base-uri 'self'; ";

        if (!app()->environment('local')) {
            $csp .= "upgrade-insecure-requests;"; // Force HTTPS in production
        }

        $response->headers->set('Content-Security-Policy', $csp);

        // 9. Permissions Policy
        $permissions = "geolocation=(), microphone=(), camera=(), payment=(), usb=()";
        $response->headers->set('Permissions-Policy', $permissions);

        return $response;
    }
}
