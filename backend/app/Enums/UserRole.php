<?php

namespace App\Enums;

enum UserRole: string
{
    case ADMIN = 'admin';
    case WAITER = 'waiter';
    case KITCHEN = 'kitchen';

    public function label(): string
    {
        return match ($this) {
            self::ADMIN => 'Admin / Manager',
            self::WAITER => 'Waiter & Kasir',
            self::KITCHEN => 'Staff Dapur',
        };
    }
}

