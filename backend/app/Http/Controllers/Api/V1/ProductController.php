<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductAvailabilityRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Http\Requests\Product\UpdateProductStockRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    /**
     * Display a listing of products.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::with('category');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        if ($request->filled('is_available')) {
            $query->where('is_available', filter_var($request->input('is_available'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $products = $query->orderBy('sort_order')->orderBy('name')->get();

        return $this->successResponse(ProductResource::collection($products), 'Daftar produk berhasil diambil.');
    }

    /**
     * Store a newly created product.
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']) . '-' . Str::random(4);
        }

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('products', 'public');
        }

        $product = Product::create($data);
        $product->load('category');

        return $this->successResponse(new ProductResource($product), 'Produk berhasil ditambahkan.', 201);
    }

    /**
     * Display the specified product.
     */
    public function show(Product $product): JsonResponse
    {
        $product->load('category');

        return $this->successResponse(new ProductResource($product), 'Detail produk berhasil diambil.');
    }

    /**
     * Update the specified product.
     */
    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $data = $request->validated();

        if (!empty($data['name']) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']) . '-' . Str::random(4);
        }

        if ($request->hasFile('image')) {
            if ($product->image_path && Storage::disk('public')->exists($product->image_path)) {
                Storage::disk('public')->delete($product->image_path);
            }
            $data['image_path'] = $request->file('image')->store('products', 'public');
        }

        $product->update($data);
        $product->load('category');

        return $this->successResponse(new ProductResource($product), 'Produk berhasil diperbarui.');
    }

    /**
     * Remove the specified product (Soft delete).
     */
    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return $this->successResponse(null, 'Produk berhasil dihapus/dinonaktifkan.');
    }

    /**
     * Toggle product availability (Admin or assigned Kitchen staff).
     */
    public function updateAvailability(UpdateProductAvailabilityRequest $request, Product $product): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (!$this->canKitchenManageProduct($user, $product)) {
            return $this->errorResponse(
                'Akses ditolak. Anda hanya dapat memperbarui menu untuk stasiun dapur yang ditugaskan kepada Anda.',
                403
            );
        }

        $product->update([
            'is_available' => $request->validated()['is_available'],
        ]);

        $product->load('category');

        event(new \App\Events\ProductAvailabilityUpdated($product));

        $statusStr = $product->is_available ? 'Tersedia' : 'Habis / Sold Out';
        return $this->successResponse(new ProductResource($product), "Status menu diubah menjadi {$statusStr}.");
    }

    /**
     * Update product portion stock (Admin or assigned Kitchen staff).
     */
    public function updateStock(UpdateProductStockRequest $request, Product $product): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (!$this->canKitchenManageProduct($user, $product)) {
            return $this->errorResponse(
                'Akses ditolak. Anda hanya dapat memperbarui stok menu untuk stasiun dapur yang ditugaskan kepada Anda.',
                403
            );
        }

        $validated = $request->validated();
        $stockQty = $validated['stock_quantity'];

        $updateData = [
            'stock_quantity' => $stockQty,
            'track_stock' => $validated['track_stock'] ?? true,
        ];

        // If stock is set to 0, automatically mark as not available
        if ($stockQty <= 0) {
            $updateData['is_available'] = false;
        } else {
            $updateData['is_available'] = true;
        }

        $product->update($updateData);
        $product->load('category');

        event(new \App\Events\ProductAvailabilityUpdated($product));

        return $this->successResponse(new ProductResource($product), "Stok porsi menu {$product->name} berhasil diperbarui.");
    }

    /**
     * Check if user is authorized to manage this product's availability/stock.
     */
    protected function canKitchenManageProduct(User $user, Product $product): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isKitchen()) {
            return $user->categories()->where('categories.id', $product->category_id)->exists();
        }

        return false;
    }
}

