<?php

namespace App\Enums;

enum StockChangeType: string
{
    case IN = 'in';
    case OUT = 'out';
    case ADJUSTMENT = 'adjustment';

    public function label(): string
    {
        return match ($this) {
            self::IN => 'Masuk / Restock',
            self::OUT => 'Keluar / Pemakaian',
            self::ADJUSTMENT => 'Penyesuaian / Opname',
        };
    }
}

