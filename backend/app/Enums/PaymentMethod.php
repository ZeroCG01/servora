<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case CASH = 'cash';
    case QRIS = 'qris';
    case DEBIT_CARD = 'debit_card';
    case CREDIT_CARD = 'credit_card';
    case OTHER = 'other';

    public function label(): string
    {
        return match ($this) {
            self::CASH => 'Tunai (Cash)',
            self::QRIS => 'QRIS',
            self::DEBIT_CARD => 'Kartu Debit',
            self::CREDIT_CARD => 'Kartu Kredit',
            self::OTHER => 'Lainnya',
        };
    }
}

