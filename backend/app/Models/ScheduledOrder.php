<?php

namespace App\Models;

use App\Enums\ReminderStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduledOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'scheduled_for',
        'remind_at',
        'reminder_status',
        'reminder_sent_at',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_for' => 'datetime',
            'remind_at' => 'datetime',
            'reminder_sent_at' => 'datetime',
            'reminder_status' => ReminderStatus::class,
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}

