<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HoneypotMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check for the presence of the honeypot field.
        // If it's present and filled, it's likely a bot.
        if ($request->has('_honey') && !empty($request->input('_honey'))) {
            // Return a generic error or simply abort.
            // Aborting with 403 Forbidden is standard.
            abort(403, 'Forbidden');
        }

        return $next($request);
    }
}
