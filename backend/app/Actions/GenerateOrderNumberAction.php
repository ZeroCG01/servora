<?php

namespace App\Actions;

use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class GenerateOrderNumberAction
{
    /**
     * Generate unique sequential order number for today: SVR-YYYYMMDD-XXXX
     */
    public function execute(?Carbon $date = null): string
    {
        $date = $date ?? Carbon::now();
        $datePrefix = 'SVR-' . $date->format('Ymd') . '-';

        return DB::transaction(function () use ($datePrefix) {
            $latest = Order::where('order_number', 'like', $datePrefix . '%')
                ->lockForUpdate()
                ->orderByDesc('id')
                ->value('order_number');

            if ($latest) {
                $lastNumber = (int) substr($latest, strlen($datePrefix));
                $nextNumber = $lastNumber + 1;
            } else {
                $nextNumber = 1;
            }

            return $datePrefix . str_pad((string) $nextNumber, 4, '0', STR_PAD_LEFT);
        });
    }
}

