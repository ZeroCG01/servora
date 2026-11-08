<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DiningTableController;
use App\Http\Controllers\Api\V1\IngredientController;
use App\Http\Controllers\Api\V1\KitchenController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Servora System v1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // -------------------------------------------------------------
    // Public Auth
    // -------------------------------------------------------------
    Route::post('/auth/login', [AuthController::class, 'login']);

    // -------------------------------------------------------------
    // Authenticated Routes (Sanctum + EnsureUserIsActive)
    // -------------------------------------------------------------
    Route::middleware(['auth:sanctum', 'active'])->group(function () {

        // Reverb Broadcast Auth
        Broadcast::routes();

        // User Self Management
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::put('/auth/password', [AuthController::class, 'updatePassword']);

        // ---------------------------------------------------------
        // Operational Dashboard Overview (Admin & Waiter)
        // ---------------------------------------------------------
        Route::get('/dashboard/overview', [DashboardController::class, 'overview']);

        // ---------------------------------------------------------
        // Master Data Read (Accessible by Admin, Waiter & Kitchen)
        // ---------------------------------------------------------
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::get('/categories/{category}', [CategoryController::class, 'show']);

        Route::get('/products', [ProductController::class, 'index']);
        Route::get('/products/{product}', [ProductController::class, 'show']);

        Route::get('/tables', [DiningTableController::class, 'index']);
        Route::get('/tables/{dining_table}', [DiningTableController::class, 'show']);

        // Raw Ingredients Read (Accessible by all staff)
        Route::get('/ingredients', [IngredientController::class, 'index']);
        Route::get('/ingredients/{ingredient}', [IngredientController::class, 'show']);
        Route::get('/ingredients/{ingredient}/logs', [IngredientController::class, 'logs']);

        // ---------------------------------------------------------
        // Orders Read (Accessible by Admin, Waiter & Kitchen)
        // ---------------------------------------------------------
        Route::get('/orders', [OrderController::class, 'index']);
        Route::get('/orders/{order}', [OrderController::class, 'show']);

        // ---------------------------------------------------------
        // Orders & Cashier / DP Management (Admin & Waiter / Kasir)
        // ---------------------------------------------------------
        Route::middleware('role:admin,waiter')->group(function () {
            Route::post('/orders', [OrderController::class, 'store']);
            Route::post('/orders/{order}/items', [OrderController::class, 'addItems']);
            Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);
            Route::post('/orders/{order}/items/{item}/cancel', [OrderController::class, 'cancelItem']);

            // Cashier & Payments
            Route::get('/orders/{order}/payments', [PaymentController::class, 'index']);
            Route::post('/orders/{order}/payments', [PaymentController::class, 'store']);
        });

        // ---------------------------------------------------------
        // Kitchen Display & Status Tracking (Admin & Kitchen Staff)
        // ---------------------------------------------------------
        Route::middleware('role:admin,kitchen')->group(function () {
            Route::get('/kitchen/orders', [KitchenController::class, 'index']);
            Route::get('/kitchen/scheduled', [KitchenController::class, 'scheduled']);
            Route::patch('/kitchen/items/{item}/status', [KitchenController::class, 'updateItemStatus']);

            // Raw Material Stock Adjustments by Station
            Route::post('/ingredients/{ingredient}/adjust', [IngredientController::class, 'adjust']);
        });

        // ---------------------------------------------------------
        // Product Quick Toggles (Admin & Kitchen Staff for assigned station)
        // ---------------------------------------------------------
        Route::middleware('role:admin,kitchen')->group(function () {
            Route::patch('/products/{product}/availability', [ProductController::class, 'updateAvailability']);
            Route::patch('/products/{product}/stock', [ProductController::class, 'updateStock']);
        });

        // ---------------------------------------------------------
        // Admin Only Management (role:admin)
        // ---------------------------------------------------------
        Route::middleware('role:admin')->group(function () {
            // User Management
            Route::apiResource('users', UserController::class);
            Route::put('/users/{user}/categories', [UserController::class, 'syncCategories']);

            // Category CRUD (Write)
            Route::post('/categories', [CategoryController::class, 'store']);
            Route::put('/categories/{category}', [CategoryController::class, 'update']);
            Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

            // Product CRUD (Write)
            Route::post('/products', [ProductController::class, 'store']);
            Route::put('/products/{product}', [ProductController::class, 'update']);
            Route::delete('/products/{product}', [ProductController::class, 'destroy']);

            // Dining Table CRUD (Write)
            Route::post('/tables', [DiningTableController::class, 'store']);
            Route::put('/tables/{dining_table}', [DiningTableController::class, 'update']);
            Route::delete('/tables/{dining_table}', [DiningTableController::class, 'destroy']);

            // Raw Ingredients CRUD (Write)
            Route::post('/ingredients', [IngredientController::class, 'store']);
            Route::put('/ingredients/{ingredient}', [IngredientController::class, 'update']);
            Route::delete('/ingredients/{ingredient}', [IngredientController::class, 'destroy']);

            // Sales Reporting & CSV Export
            Route::get('/reports/summary', [ReportController::class, 'summary']);
            Route::get('/reports/top-products', [ReportController::class, 'topProducts']);
            Route::get('/reports/category-sales', [ReportController::class, 'categorySales']);
            Route::get('/reports/export', [ReportController::class, 'exportCsv']);
        });

    });

});
