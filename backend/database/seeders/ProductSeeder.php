<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $indo = Category::where('slug', 'indonesian-food')->first();
        $western = Category::where('slug', 'western-food')->first();
        $beverages = Category::where('slug', 'beverages')->first();

        $products = [
            // INDONESIAN FOOD
            [
                'category_id' => $indo->id,
                'name' => 'Nasi Goreng Spesial Servora',
                'slug' => 'nasi-goreng-spesial-servora',
                'description' => 'Nasi goreng harum rempah nusantara dengan suwiran ayam, telur mata sapi, sate ayam, dan kerupuk udang.',
                'price' => 28000,
                'is_available' => true,
                'is_active' => true,
                'track_stock' => true,
                'stock_quantity' => 25,
                'sort_order' => 1,
            ],
            [
                'category_id' => $indo->id,
                'name' => 'Ayam Bakar Taliwang',
                'slug' => 'ayam-bakar-taliwang',
                'description' => 'Paha ayam bakar bumbu pedas manis khas Lombok, disajikan dengan lalapan segar dan sambal terasi.',
                'price' => 35000,
                'is_available' => true,
                'is_active' => true,
                'track_stock' => true,
                'stock_quantity' => 20,
                'sort_order' => 2,
            ],
            [
                'category_id' => $indo->id,
                'name' => 'Soto Betawi Daging Sapi',
                'slug' => 'soto-betawi-daging-sapi',
                'description' => 'Kuah santan gurih kaya rempah dengan irisan daging sapi empuk, kentang, tomat, dan emping melinjo.',
                'price' => 38000,
                'is_available' => true,
                'is_active' => true,
                'track_stock' => true,
                'stock_quantity' => 15,
                'sort_order' => 3,
            ],
            [
                'category_id' => $indo->id,
                'name' => 'Mie Goreng Jawa Nyemek',
                'slug' => 'mie-goreng-jawa-nyemek',
                'description' => 'Mie kuning telur tumis kekian, telur bebek, sayuran sawi dan kubis dengan kuah kental gurih manis.',
                'price' => 25000,
                'is_available' => true,
                'is_active' => true,
                'track_stock' => false,
                'stock_quantity' => 0,
                'sort_order' => 4,
            ],

            // WESTERN FOOD
            [
                'category_id' => $western->id,
                'name' => 'Servora Beef Burger Deluxe',
                'slug' => 'servora-beef-burger-deluxe',
                'description' => 'Patty daging sapi Australia panggang, keju cheddar leleh, selada romaine, saus barbeque spesial dalam roti brioche.',
                'price' => 42000,
                'is_available' => true,
                'is_active' => true,
                'track_stock' => true,
                'stock_quantity' => 15,
                'sort_order' => 1,
            ],
            [
                'category_id' => $western->id,
                'name' => 'Spaghetti Creamy Carbonara',
                'slug' => 'spaghetti-creamy-carbonara',
                'description' => 'Pasta al dente dalam saus krim telur parmesan gurih, smoked beef krispi, dan taburan parsley.',
                'price' => 38000,
                'is_available' => true,
                'is_active' => true,
                'track_stock' => true,
                'stock_quantity' => 18,
                'sort_order' => 2,
            ],
            [
                'category_id' => $western->id,
                'name' => 'Grilled Chicken Steak Mushroom',
                'slug' => 'grilled-chicken-steak-mushroom',
                'description' => 'Dada ayam tanpa tulang panggang dengan saus jamur kental, mashed potato halus, dan sayuran tumis mentega.',
                'price' => 45000,
                'is_available' => true,
                'is_active' => true,
                'track_stock' => true,
                'stock_quantity' => 12,
                'sort_order' => 3,
            ],
            [
                'category_id' => $western->id,
                'name' => 'Truffle Parmesan French Fries',
                'slug' => 'truffle-parmesan-french-fries',
                'description' => 'Kentang goreng renyah dibalut minyak truffle harum, taburan keju parmesan parut dan mayones cocolan.',
                'price' => 22000,
                'is_available' => true,
                'is_active' => true,
                'track_stock' => false,
                'stock_quantity' => 0,
                'sort_order' => 4,
            ],

            // BEVERAGES
            [
                'category_id' => $beverages->id,
                'name' => 'Kopi Susu Gula Aren Servora',
                'slug' => 'kopi-susu-gula-aren-servora',
                'description' => 'Double shot espresso biji arabika-robusta pilihan dipadukan susu segar creamy dan gula aren murni.',
                'price' => 20000,
                'is_available' => true,
                'is_active' => true,
                'track_stock' => true,
                'stock_quantity' => 30,
                'sort_order' => 1,
            ],
            [
                'category_id' => $beverages->id,
                'name' => 'Espresso Citrus Tonic',
                'slug' => 'espresso-citrus-tonic',
                'description' => 'Kombinasi sparkling tonic water dingin, perasan jeruk lemon segar, dan tuangan espresso pekat di atasnya.',
                'price' => 24000,
                'is_available' => true,
                'is_active' => true,
                'track_stock' => false,
                'stock_quantity' => 0,
                'sort_order' => 2,
            ],
            [
                'category_id' => $beverages->id,
                'name' => 'Iced Uji Matcha Latte',
                'slug' => 'iced-uji-matcha-latte',
                'description' => 'Bubuk matcha murni berkualitas dari Uji Jepang, dilarutkan dengan susu cair manis lembut dingin.',
                'price' => 25000,
                'is_available' => true,
                'is_active' => true,
                'track_stock' => true,
                'stock_quantity' => 20,
                'sort_order' => 3,
            ],
            [
                'category_id' => $beverages->id,
                'name' => 'Artisan Lemon Iced Tea',
                'slug' => 'artisan-lemon-iced-tea',
                'description' => 'Seduhan daun teh hitam pilihan dengan perasan lemon asli dan daun mint segar pelepas dahaga.',
                'price' => 18000,
                'is_available' => true,
                'is_active' => true,
                'track_stock' => false,
                'stock_quantity' => 0,
                'sort_order' => 4,
            ],
            [
                'category_id' => $beverages->id,
                'name' => 'Air Mineral Botol 600ml',
                'slug' => 'air-mineral-botol-600ml',
                'description' => 'Air mineral pegunungan alami kemasan botol higienis dingin atau biasa.',
                'price' => 8000,
                'is_available' => true,
                'is_active' => true,
                'track_stock' => true,
                'stock_quantity' => 50,
                'sort_order' => 5,
            ],
        ];

        foreach ($products as $item) {
            Product::firstOrCreate(['slug' => $item['slug']], $item);
        }
    }
}

