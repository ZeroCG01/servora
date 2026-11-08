<?php

namespace App\Enums;

enum ReminderStatus: string
{
    case WAITING = 'waiting';
    case SENT = 'sent';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::WAITING => 'Menunggu Alarm',
            self::SENT => 'Alarm Terkirim',
            self::CANCELLED => 'Dibatalkan',
        };
    }
}

