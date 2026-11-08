<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\DiningTable\StoreDiningTableRequest;
use App\Http\Requests\DiningTable\UpdateDiningTableRequest;
use App\Http\Resources\DiningTableResource;
use App\Models\DiningTable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiningTableController extends Controller
{
    /**
     * Display a listing of dining tables.
     */
    public function index(Request $request): JsonResponse
    {
        $query = DiningTable::with(['orders' => function ($q) {
            $q->whereIn('status', [
                OrderStatus::PENDING,
                OrderStatus::IN_PROGRESS,
                OrderStatus::READY,
            ]);
        }]);

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('area')) {
            $query->where('area', $request->input('area'));
        }

        $tables = $query->orderBy('number')->get();

        return $this->successResponse(DiningTableResource::collection($tables), 'Daftar meja berhasil diambil.');
    }

    /**
     * Store a newly created dining table.
     */
    public function store(StoreDiningTableRequest $request): JsonResponse
    {
        $table = DiningTable::create($request->validated());

        return $this->successResponse(new DiningTableResource($table), 'Meja berhasil ditambahkan.', 201);
    }

    /**
     * Display the specified dining table.
     */
    public function show(DiningTable $diningTable): JsonResponse
    {
        $diningTable->load(['orders' => function ($q) {
            $q->whereIn('status', [
                OrderStatus::PENDING,
                OrderStatus::IN_PROGRESS,
                OrderStatus::READY,
            ]);
        }]);

        return $this->successResponse(new DiningTableResource($diningTable), 'Detail meja berhasil diambil.');
    }

    /**
     * Update the specified dining table.
     */
    public function update(UpdateDiningTableRequest $request, DiningTable $diningTable): JsonResponse
    {
        $diningTable->update($request->validated());

        return $this->successResponse(new DiningTableResource($diningTable), 'Data meja berhasil diperbarui.');
    }

    /**
     * Remove the specified dining table.
     */
    public function destroy(DiningTable $diningTable): JsonResponse
    {
        $hasActiveOrder = $diningTable->orders()
            ->whereIn('status', [OrderStatus::PENDING, OrderStatus::IN_PROGRESS, OrderStatus::READY])
            ->exists();

        if ($hasActiveOrder) {
            return $this->errorResponse('Meja tidak dapat dihapus karena sedang ada pesanan aktif.', 422);
        }

        $diningTable->delete();

        return $this->successResponse(null, 'Meja berhasil dihapus.');
    }
}

