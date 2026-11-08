<?php

namespace App\Enums;

enum OrderItemStatus: string
{
    case PENDING = 'pending';
    case ON_PROGRESS = 'on_progress';
    case READY = 'ready';
    case SERVED = 'served';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Menunggu',
            self::ON_PROGRESS => 'Sedang Dimasak',
            self::READY => 'Siap',
            self::SERVED => 'Disajikan',
            self::CANCELLED => 'Dibatalkan',
        };
    }
}

