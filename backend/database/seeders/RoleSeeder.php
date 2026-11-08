<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => UserRole::ADMIN->value,
                'display_name' => 'Admin / Manager',
                'description' => 'Akses penuh ke seluruh menu, konfigurasi, inventori, dan laporan penjualan.',
            ],
            [
                'name' => UserRole::WAITER->value,
                'display_name' => 'Waiter & Kasir',
                'description' => 'Membuat pesanan Dine-in/Takeaway/Pre-order, menerima pembayaran & DP kasir.',
            ],
            [
                'name' => UserRole::KITCHEN->value,
                'display_name' => 'Staff Dapur',
                'description' => 'Melihat tiket pesanan dan memperbarui status makanan sesuai stasiun dapur.',
            ],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role['name']], $role);
        }
    }
}

