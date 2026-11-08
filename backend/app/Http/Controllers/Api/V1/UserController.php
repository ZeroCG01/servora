<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\SyncCategoriesRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['role', 'categories']);

        if ($request->filled('role')) {
            $roleParam = $request->input('role');
            $query->whereHas('role', fn($q) => $q->where('name', $roleParam));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('name')->get();

        return $this->successResponse(UserResource::collection($users), 'Daftar pengguna berhasil diambil.');
    }

    /**
     * Store a newly created user.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['password'] = Hash::make($data['password']);
        $categoryIds = $data['category_ids'] ?? [];
        unset($data['category_ids']);

        $user = User::create($data);

        if (!empty($categoryIds)) {
            $user->categories()->sync($categoryIds);
        }

        $user->load(['role', 'categories']);

        return $this->successResponse(new UserResource($user), 'Pengguna berhasil ditambahkan.', 201);
    }

    /**
     * Display the specified user.
     */
    public function show(User $user): JsonResponse
    {
        $user->load(['role', 'categories']);

        return $this->successResponse(new UserResource($user), 'Detail pengguna berhasil diambil.');
    }

    /**
     * Update the specified user.
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $categoryIds = $data['category_ids'] ?? null;
        unset($data['category_ids']);

        $user->update($data);

        if ($categoryIds !== null) {
            $user->categories()->sync($categoryIds);
        }

        $user->load(['role', 'categories']);

        return $this->successResponse(new UserResource($user), 'Data pengguna berhasil diperbarui.');
    }

    /**
     * Remove the specified user (Soft delete).
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return $this->errorResponse('Anda tidak dapat menghapus akun Anda sendiri.', 400);
        }

        if ($user->username === 'admin') {
            return $this->errorResponse('Akun admin utama tidak boleh dihapus.', 400);
        }

        // Revoke any active token
        $user->tokens()->delete();
        $user->delete();

        return $this->successResponse(null, 'Pengguna berhasil dinonaktifkan/dihapus.');
    }

    /**
     * Sync kitchen station categories for this user.
     */
    public function syncCategories(SyncCategoriesRequest $request, User $user): JsonResponse
    {
        $user->categories()->sync($request->validated()['category_ids']);
        $user->load(['role', 'categories']);

        return $this->successResponse(new UserResource($user), 'Stasiun dapur pengguna berhasil diperbarui.');
    }
}

