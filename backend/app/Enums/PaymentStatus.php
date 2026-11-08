<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case UNPAID = 'unpaid';
    case PARTIALLY_PAID = 'partially_paid';
    case PAID = 'paid';

    public function label(): string
    {
        return match ($this) {
            self::UNPAID => 'Belum Lunas',
            self::PARTIALLY_PAID => 'DP Dibayar',
            self::PAID => 'Lunas',
        };
    }
}

