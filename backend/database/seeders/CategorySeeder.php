<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Indonesian Food',
                'slug' => 'indonesian-food',
                'description' => 'Menu masakan tradisional nusantara, nasi goreng, aneka soto dan lauk.',
                'sort_order' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'Western Food',
                'slug' => 'western-food',
                'description' => 'Menu barat seperti burger, pasta, steak, dan camilan kentang.',
                'sort_order' => 2,
                'is_active' => true,
            ],
            [
                'name' => 'Beverages',
                'slug' => 'beverages',
                'description' => 'Aneka kopi artisan, teh, minuman susu, mocktail, dan air mineral.',
                'sort_order' => 3,
                'is_active' => true,
            ],
        ];

        foreach ($categories as $cat) {
            Category::firstOrCreate(['slug' => $cat['slug']], $cat);
        }
    }
}

