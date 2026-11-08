<?php

namespace App\Enums;

enum PaymentType: string
{
    case DOWN_PAYMENT = 'down_payment';
    case SETTLEMENT = 'settlement';
    case FULL = 'full';

    public function label(): string
    {
        return match ($this) {
            self::DOWN_PAYMENT => 'Uang Muka (DP)',
            self::SETTLEMENT => 'Pelunasan',
            self::FULL => 'Bayar Penuh',
        };
    }
}

