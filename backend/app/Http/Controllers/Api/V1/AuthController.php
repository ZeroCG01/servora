<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\UpdatePasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Authenticate user and issue Sanctum token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $loginInput = $request->input('login');
        $throttleKey = Str::transliterate(Str::lower($loginInput) . '|' . $request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return $this->errorResponse(
                "Terlalu banyak percobaan login. Silakan coba lagi dalam {$seconds} detik.",
                429
            );
        }

        $user = User::with(['role', 'categories'])
            ->where('username', $loginInput)
            ->orWhere('email', $loginInput)
            ->first();

        if (!$user || !Hash::check($request->input('password'), $user->password)) {
            RateLimiter::hit($throttleKey, 60);
            return $this->errorResponse('Username/email atau password salah.', 401);
        }

        if (!$user->is_active) {
            return $this->errorResponse('Akun Anda dinonaktifkan. Silakan hubungi Manager / Admin.', 403);
        }

        RateLimiter::clear($throttleKey);

        // Revoke old tokens if any to keep 1 active session per user in UMKM context
        $user->tokens()->delete();

        $token = $user->createToken('servora-token')->plainTextToken;

        return $this->successResponse([
            'user' => new UserResource($user),
            'token' => $token,
        ], 'Login berhasil.');
    }

    /**
     * Revoke current access token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return $this->successResponse(null, 'Logout berhasil.');
    }

    /**
     * Get authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['role', 'categories']);

        return $this->successResponse(new UserResource($user), 'Data pengguna berhasil diambil.');
    }

    /**
     * Update current user's password.
     */
    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        $user->update([
            'password' => Hash::make($request->input('password')),
        ]);

        return $this->successResponse(null, 'Password berhasil diperbarui.');
    }
}

