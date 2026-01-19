<?php

namespace App\Http\Middleware;

use App\Models\ApiLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogApiRequests
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);

        $response = $next($request);

        // Calculate response time in milliseconds
        $responseTime = (microtime(true) - $startTime) * 1000;

        // Only log API routes (not Inertia page loads)
        if ($this->shouldLog($request)) {
            $this->logRequest($request, $response, $responseTime);
        }

        return $response;
    }

    /**
     * Determine if the request should be logged
     */
    protected function shouldLog(Request $request): bool
    {
        // Log API routes and AJAX requests
        $isApiRoute = $request->is('api/*');
        $isAjax = $request->ajax() || $request->wantsJson();

        // Skip certain endpoints to avoid noise (high-frequency/monitoring endpoints)
        $skipEndpoints = [
            'api/broadcasting/*',
            'api/pusher/*',
            'api/devices/status',
            'api/devices/*/status',
            'api/heartbeat',
            'api/health',
            'up',
        ];

        foreach ($skipEndpoints as $pattern) {
            if ($request->is($pattern)) {
                return false;
            }
        }

        return $isApiRoute || $isAjax;
    }

    /**
     * Log the API request
     */
    protected function logRequest(Request $request, Response $response, float $responseTime): void
    {
        try {
            // Get response body (limit size)
            $responseBody = null;
            $content = $response->getContent();
            if ($content && strlen($content) < 10000) {
                $decoded = json_decode($content, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $responseBody = $decoded;
                }
            }

            // Get request body (sanitize sensitive data)
            $requestBody = $request->except(['password', 'password_confirmation', 'token']);

            ApiLog::create([
                'user_id' => auth()->id(),
                'method' => $request->method(),
                'endpoint' => $request->path(),
                'status_code' => $response->getStatusCode(),
                'response_time' => round($responseTime, 2),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'request_headers' => $this->sanitizeHeaders($request->headers->all()),
                'request_body' => !empty($requestBody) ? $requestBody : null,
                'response_body' => $responseBody,
                'error_message' => $response->getStatusCode() >= 400 ? ($responseBody['message'] ?? null) : null,
            ]);
        } catch (\Exception $e) {
            // Silently fail - don't break the app if logging fails
            \Log::warning('API logging failed: ' . $e->getMessage());
        }
    }

    /**
     * Remove sensitive headers
     */
    protected function sanitizeHeaders(array $headers): array
    {
        $sensitiveHeaders = ['authorization', 'cookie', 'x-csrf-token'];

        foreach ($sensitiveHeaders as $header) {
            if (isset($headers[$header])) {
                $headers[$header] = ['[REDACTED]'];
            }
        }

        return $headers;
    }
}
