<?php

namespace App\Support\Http;

use App\Models\Team;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;

/**
 * Guard trait for admin-scoped team access.
 *
 * Ensures the authenticated admin can only act on teams within
 * their own field (bidang). Throws 403 on mismatch.
 */
trait ResolvesFieldScope
{
    /**
     * Verify the given team belongs to the authenticated admin's field.
     *
     * @throws HttpResponseException 403 if admin has no field or team is outside it.
     */
    protected function ensureTeamInAdminField(Request $request, Team $team): void
    {
        $fieldId = $request->user()?->team?->field?->id;

        if (! $fieldId || $team->field_id !== $fieldId) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Tim tidak ditemukan dalam bidang Anda.',
            ], 403));
        }
    }
}
