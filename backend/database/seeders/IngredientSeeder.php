<?php

namespace Database\Seeders;

use App\Enums\StockChangeType;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\User;
use Illuminate\Database\Seeder;

class IngredientSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::where('username', 'admin')->first();
        $indo = Category::where('slug', 'indonesian-food')->first();
        $western = Category::where('slug', 'western-food')->first();
        $beverages = Category::where('slug', 'beverages')->first();

        $ingredients = [
            // INDONESIAN FOOD
            [
                'category_id' => $indo?->id,
                'name' => 'Daging Sapi Rawon/Soto',
                'current_stock' => 8.50,
                'unit' => 'kg',
                'minimum_stock' => 3.00,
                'notes' => 'Potongan daging sapi bagian sandung lamur dan sengkel.',
            ],
            [
                'category_id' => $indo?->id,
                'name' => 'Daging Ayam Fillet',
                'current_stock' => 12.00,
                'unit' => 'kg',
                'minimum_stock' => 4.00,
                'notes' => 'Paha dan dada ayam fillet segar bersih.',
            ],
            [
                'category_id' => $indo?->id,
                'name' => 'Beras Premium',
                'current_stock' => 35.00,
                'unit' => 'kg',
                'minimum_stock' => 10.00,
                'notes' => 'Beras pulen wangi untuk nasi uduk, nasi putih, dan nasi goreng.',
            ],
            [
                'category_id' => $indo?->id,
                'name' => 'Bumbu Rempah Dasar Kuning & Merah',
                'current_stock' => 5.00,
                'unit' => 'kg',
                'minimum_stock' => 2.00,
                'notes' => 'Bawang merah, putih, kunyit, kemiri halus matang.',
            ],

            // WESTERN FOOD
            [
                'category_id' => $western?->id,
                'name' => 'Patty Daging Burger 120gr',
                'current_stock' => 25.00,
                'unit' => 'pcs',
                'minimum_stock' => 10.00,
                'notes' => 'Patty frozen beef siap panggang.',
            ],
            [
                'category_id' => $western?->id,
                'name' => 'Kulit Tortilla Wrap',
                'current_stock' => 30.00,
                'unit' => 'lembar',
                'minimum_stock' => 10.00,
                'notes' => 'Tortilla gandum diameter 25cm.',
            ],
            [
                'category_id' => $western?->id,
                'name' => 'Pasta Spaghetti No. 5',
                'current_stock' => 6.00,
                'unit' => 'kg',
                'minimum_stock' => 2.00,
                'notes' => 'Semolina durum wheat pasta kering.',
            ],
            [
                'category_id' => $western?->id,
                'name' => 'Cooking Cream UHT',
                'current_stock' => 4.50,
                'unit' => 'liter',
                'minimum_stock' => 2.00,
                'notes' => 'Krim masak kental untuk carbonara dan mushroom sauce.',
            ],

            // BEVERAGES
            [
                'category_id' => $beverages?->id,
                'name' => 'Biji Kopi House Blend (Arabica-Robusta)',
                'current_stock' => 4.00,
                'unit' => 'kg',
                'minimum_stock' => 1.50,
                'notes' => 'Medium dark roast racikan 70% Arabica Gayo, 30% Robusta Temanggung.',
            ],
            [
                'category_id' => $beverages?->id,
                'name' => 'Susu Cair UHT Full Cream',
                'current_stock' => 15.00,
                'unit' => 'liter',
                'minimum_stock' => 5.00,
                'notes' => 'Susu segar pasteurisasi untuk kopi susu dan matcha.',
            ],
            [
                'category_id' => $beverages?->id,
                'name' => 'Sirup Gula Aren Organik',
                'current_stock' => 5.00,
                'unit' => 'liter',
                'minimum_stock' => 2.00,
                'notes' => 'Kekentalan brix tinggi tanpa pengawet.',
            ],
            [
                'category_id' => $beverages?->id,
                'name' => 'Bubuk Uji Matcha Pure',
                'current_stock' => 1.20,
                'unit' => 'kg',
                'minimum_stock' => 0.50,
                'notes' => 'Bubuk matcha grade seremonial/kafe.',
            ],
        ];

        foreach ($ingredients as $data) {
            $ingredient = Ingredient::firstOrCreate(
                [
                    'name' => $data['name'],
                    'category_id' => $data['category_id'],
                ],
                $data
            );

            // Log initial stock entry if no logs exist
            if ($ingredient->stockLogs()->count() === 0 && $admin) {
                $ingredient->stockLogs()->create([
                    'change_type' => StockChangeType::IN->value,
                    'amount' => $ingredient->current_stock,
                    'previous_stock' => 0,
                    'final_stock' => $ingredient->current_stock,
                    'reason' => 'Stok awal sistem Servora (Initial Seed)',
                    'adjusted_by' => $admin->id,
                    'created_at' => now(),
                ]);
            }
        }
    }
}

