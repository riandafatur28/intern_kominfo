<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequirePasswordChange
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->must_change_password) {
            return response()->json([
                'success' => false,
                'code' => 'must_change_password',
                'message' => 'Password harus diganti pada login pertama.',
            ], 403);
        }

        return $next($request);
    }
}
