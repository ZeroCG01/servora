<?php

namespace App\Enums;

enum OrderStatus: string
{
    case SCHEDULED = 'scheduled';
    case PENDING = 'pending';
    case IN_PROGRESS = 'in_progress';
    case READY = 'ready';
    case SERVED = 'served';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::SCHEDULED => 'Terjadwal (Pre-Order)',
            self::PENDING => 'Menunggu Dapur',
            self::IN_PROGRESS => 'Sedang Dimasak',
            self::READY => 'Siap Disajikan',
            self::SERVED => 'Selesai / Disajikan',
            self::CANCELLED => 'Dibatalkan',
        };
    }
}

