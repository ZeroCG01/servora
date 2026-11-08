<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ingredient\AdjustStockRequest;
use App\Http\Requests\Ingredient\StoreIngredientRequest;
use App\Http\Requests\Ingredient\UpdateIngredientRequest;
use App\Http\Resources\IngredientResource;
use App\Http\Resources\IngredientStockLogResource;
use App\Models\Ingredient;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IngredientController extends Controller
{
    /**
     * Display a listing of ingredients.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Ingredient::with('category');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        if ($request->boolean('is_low_stock')) {
            $query->whereColumn('current_stock', '<=', 'minimum_stock');
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%");
        }

        $ingredients = $query->orderBy('name')->get();

        return $this->successResponse(IngredientResource::collection($ingredients), 'Daftar bahan baku berhasil diambil.');
    }

    /**
     * Store a newly created ingredient (Admin only).
     */
    public function store(StoreIngredientRequest $request): JsonResponse
    {
        $ingredient = Ingredient::create($request->validated());
        $ingredient->load('category');

        return $this->successResponse(new IngredientResource($ingredient), 'Bahan baku berhasil ditambahkan.', 201);
    }

    /**
     * Display the specified ingredient with its 10 recent stock logs.
     */
    public function show(Ingredient $ingredient): JsonResponse
    {
        $ingredient->load(['category', 'stockLogs' => function ($q) {
            $q->with('adjuster')->orderByDesc('id')->limit(10);
        }]);

        return $this->successResponse(new IngredientResource($ingredient), 'Detail bahan baku berhasil diambil.');
    }

    /**
     * Update the specified ingredient (Admin only).
     */
    public function update(UpdateIngredientRequest $request, Ingredient $ingredient): JsonResponse
    {
        $ingredient->update($request->validated());
        $ingredient->load('category');

        return $this->successResponse(new IngredientResource($ingredient), 'Data bahan baku berhasil diperbarui.');
    }

    /**
     * Remove the specified ingredient (Soft delete, Admin only).
     */
    public function destroy(Ingredient $ingredient): JsonResponse
    {
        $ingredient->delete();

        return $this->successResponse(null, 'Bahan baku berhasil dihapus.');
    }

    /**
     * Record stock mutation (in, out, adjustment) - Accessible by Admin & assigned Kitchen.
     */
    public function adjust(AdjustStockRequest $request, Ingredient $ingredient): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        // Check if kitchen staff is allowed to manage this ingredient's category
        if ($user->isKitchen() && $ingredient->category_id) {
            $hasAccess = $user->categories()->where('categories.id', $ingredient->category_id)->exists();
            if (!$hasAccess) {
                return $this->errorResponse(
                    'Akses ditolak. Anda hanya dapat memperbarui bahan baku untuk stasiun yang ditugaskan kepada Anda.',
                    403
                );
            }
        }

        $validated = $request->validated();
        $log = $ingredient->recordStockChange(
            $validated['change_type'],
            (float) $validated['amount'],
            $user->id,
            $validated['reason'] ?? null
        );

        $ingredient->load(['category', 'stockLogs' => function ($q) {
            $q->with('adjuster')->orderByDesc('id')->limit(1);
        }]);

        return $this->successResponse([
            'ingredient' => new IngredientResource($ingredient),
            'log' => new IngredientStockLogResource($log->load('adjuster')),
        ], 'Penyesuaian stok bahan baku berhasil dicatat.');
    }

    /**
     * Get stock mutation history for this ingredient.
     */
    public function logs(Request $request, Ingredient $ingredient): JsonResponse
    {
        $logs = $ingredient->stockLogs()
            ->with('adjuster')
            ->orderByDesc('id')
            ->paginate((int) $request->input('per_page', 20));

        return $this->successResponse(
            IngredientStockLogResource::collection($logs)->response()->getData(true),
            'Riwayat mutasi bahan baku berhasil diambil.'
        );
    }
}

