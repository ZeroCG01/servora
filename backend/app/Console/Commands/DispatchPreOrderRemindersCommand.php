<?php

namespace App\Console\Commands;

use App\Enums\OrderStatus;
use App\Enums\ReminderStatus;
use App\Events\NewOrderCreated;
use App\Events\PreOrderReminderDispatched;
use App\Models\ScheduledOrder;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DispatchPreOrderRemindersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'servora:dispatch-preorders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Memeriksa dan menembakkan alarm reminder Pre-Order yang telah mencapai H-10 menit.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $now = Carbon::now();

        // Find waiting pre-orders whose remind_at is now or in the past
        $pendingReminders = ScheduledOrder::with(['order.items.category', 'order.diningTable'])
            ->where('reminder_status', ReminderStatus::WAITING)
            ->where('remind_at', '<=', $now)
            ->get();

        if ($pendingReminders->isEmpty()) {
            return Command::SUCCESS;
        }

        $this->info("Menemukan {$pendingReminders->count()} Pre-Order yang perlu ditindaklanjuti.");

        foreach ($pendingReminders as $scheduledOrder) {
            $order = $scheduledOrder->order;

            // If order was cancelled, do not dispatch
            if (!$order || $order->status === OrderStatus::CANCELLED) {
                $scheduledOrder->update(['reminder_status' => ReminderStatus::CANCELLED]);
                continue;
            }

            DB::transaction(function () use ($scheduledOrder, $order, $now) {
                // 1. Mark reminder sent
                $scheduledOrder->update([
                    'reminder_status' => ReminderStatus::SENT,
                    'reminder_sent_at' => $now,
                ]);

                // 2. Transition order from scheduled to pending (so it appears on active kitchen screens)
                $oldStatus = $order->status?->value ?? (string)$order->status;
                $order->update(['status' => OrderStatus::PENDING]);

                // 3. Log history
                $order->statusHistories()->create([
                    'from_status' => $oldStatus,
                    'to_status' => OrderStatus::PENDING->value,
                    'note' => 'Alarm Pre-Order H-10 menit dipicu otomatis oleh sistem. Pesanan dialihkan ke antrean dapur aktif.',
                    'created_at' => $now,
                ]);

                // 4. Dispatch Reverb Events
                event(new PreOrderReminderDispatched($order));
                event(new NewOrderCreated($order));

                $this->info("-> Alarm berhasil ditembakkan untuk Pesanan #{$order->order_number} (Jadwal: {$scheduledOrder->scheduled_for->format('H:i')})");
            });
        }

        return Command::SUCCESS;
    }
}

