<?php

namespace Database\Seeders;

use App\Models\DiningTable;
use Illuminate\Database\Seeder;

class DiningTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tables = [
            ['number' => 'Meja 01', 'capacity' => 2, 'area' => 'Indoor', 'is_active' => true],
            ['number' => 'Meja 02', 'capacity' => 2, 'area' => 'Indoor', 'is_active' => true],
            ['number' => 'Meja 03', 'capacity' => 4, 'area' => 'Indoor', 'is_active' => true],
            ['number' => 'Meja 04', 'capacity' => 4, 'area' => 'Indoor', 'is_active' => true],
            ['number' => 'Meja 05', 'capacity' => 6, 'area' => 'Indoor', 'is_active' => true],
            ['number' => 'Meja 06', 'capacity' => 6, 'area' => 'Indoor', 'is_active' => true],
            ['number' => 'Meja 07', 'capacity' => 4, 'area' => 'Outdoor', 'is_active' => true],
            ['number' => 'Meja 08', 'capacity' => 4, 'area' => 'Outdoor', 'is_active' => true],
            ['number' => 'Meja 09', 'capacity' => 4, 'area' => 'Outdoor', 'is_active' => true],
            ['number' => 'Meja 10', 'capacity' => 8, 'area' => 'VIP / Family', 'is_active' => true],
        ];

        foreach ($tables as $table) {
            DiningTable::firstOrCreate(['number' => $table['number']], $table);
        }
    }
}

