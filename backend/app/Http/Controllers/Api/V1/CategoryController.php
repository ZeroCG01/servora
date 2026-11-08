<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Category\StoreCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Category::withCount('products');

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $categories = $query->orderBy('sort_order')->orderBy('name')->get();

        return $this->successResponse(CategoryResource::collection($categories), 'Daftar kategori berhasil diambil.');
    }

    /**
     * Store a newly created category.
     */
    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $category = Category::create($data);

        return $this->successResponse(new CategoryResource($category), 'Kategori berhasil ditambahkan.', 201);
    }

    /**
     * Display the specified category.
     */
    public function show(Category $category): JsonResponse
    {
        $category->loadCount('products');

        return $this->successResponse(new CategoryResource($category), 'Detail kategori berhasil diambil.');
    }

    /**
     * Update the specified category.
     */
    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $data = $request->validated();

        if (!empty($data['name']) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $category->update($data);
        $category->loadCount('products');

        return $this->successResponse(new CategoryResource($category), 'Kategori berhasil diperbarui.');
    }

    /**
     * Remove the specified category.
     */
    public function destroy(Category $category): JsonResponse
    {
        if ($category->products()->count() > 0) {
            return $this->errorResponse(
                'Kategori tidak dapat dihapus karena masih memiliki produk menu terkait. Silakan hapus atau pindahkan produk terlebih dahulu.',
                422
            );
        }

        if ($category->orderItems()->count() > 0) {
            return $this->errorResponse(
                'Kategori tidak dapat dihapus karena memiliki riwayat transaksi pesanan.',
                422
            );
        }

        $category->delete();

        return $this->successResponse(null, 'Kategori berhasil dihapus.');
    }
}

