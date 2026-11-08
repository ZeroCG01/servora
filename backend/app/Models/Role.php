<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'display_name',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'name' => UserRole::class,
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}

