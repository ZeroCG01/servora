<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels — Servora Reverb Authorization
|--------------------------------------------------------------------------
*/

Broadcast::channel('App.Models.User.{id}', function (User $user, $id) {
    return (int) $user->id === (int) $id;
});

/**
 * Waiter & Admin channel for order and cashier events.
 */
Broadcast::channel('waiter.orders', function (User $user) {
    return $user->isAdmin() || $user->isWaiter();
});

/**
 * Kitchen station category channel (e.g. Indonesian Food, Western Food, Beverages).
 * Accessible by Admin, or Kitchen staff assigned to this category.
 */
Broadcast::channel('kitchen.category.{categoryId}', function (User $user, $categoryId) {
    if ($user->isAdmin()) {
        return true;
    }

    if ($user->isKitchen()) {
        return $user->categories()->where('categories.id', (int)$categoryId)->exists();
    }

    return false;
});

/**
 * General broadcast channel for all kitchen staff.
 */
Broadcast::channel('kitchen.all', function (User $user) {
    return $user->isAdmin() || $user->isKitchen();
});
