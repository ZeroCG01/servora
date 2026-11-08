<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminRole = Role::where('name', UserRole::ADMIN->value)->first();
        $waiterRole = Role::where('name', UserRole::WAITER->value)->first();
        $kitchenRole = Role::where('name', UserRole::KITCHEN->value)->first();

        // 1. Admin
        User::firstOrCreate(
            ['username' => 'admin'],
            [
                'role_id' => $adminRole->id,
                'name' => 'Manager Servora',
                'email' => 'admin@servora.test',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );

        // 2. Waiter & Cashier
        User::firstOrCreate(
            ['username' => 'waiter'],
            [
                'role_id' => $waiterRole->id,
                'name' => 'Staff Waiter & Kasir',
                'email' => 'waiter@servora.test',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );

        // Categories
        $indoCat = Category::where('slug', 'indonesian-food')->first();
        $westernCat = Category::where('slug', 'western-food')->first();
        $beverageCat = Category::where('slug', 'beverages')->first();

        // 3. Koki Indonesian Food
        $kokiIndo = User::firstOrCreate(
            ['username' => 'koki_indo'],
            [
                'role_id' => $kitchenRole->id,
                'name' => 'Chef Masakan Indo',
                'email' => 'koki.indo@servora.test',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        if ($indoCat) {
            $kokiIndo->categories()->syncWithoutDetaching([$indoCat->id]);
        }

        // 4. Koki Western Food
        $kokiWestern = User::firstOrCreate(
            ['username' => 'koki_western'],
            [
                'role_id' => $kitchenRole->id,
                'name' => 'Chef Masakan Western',
                'email' => 'koki.western@servora.test',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        if ($westernCat) {
            $kokiWestern->categories()->syncWithoutDetaching([$westernCat->id]);
        }

        // 5. Barista (Beverages)
        $barista = User::firstOrCreate(
            ['username' => 'barista'],
            [
                'role_id' => $kitchenRole->id,
                'name' => 'Barista Minuman',
                'email' => 'barista@servora.test',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        if ($beverageCat) {
            $barista->categories()->syncWithoutDetaching([$beverageCat->id]);
        }
    }
}

