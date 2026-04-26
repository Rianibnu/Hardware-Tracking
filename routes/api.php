<?php

use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ReferenceController;
use App\Http\Controllers\Api\TicketController;
use Illuminate\Support\Facades\Route;

// ─── Auth ────────────────────────────────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // ─── Reference data ──────────────────────────────────────────────────────
    Route::get('/categories', [ReferenceController::class, 'categories']);
    Route::get('/locations', [ReferenceController::class, 'locations']);
    Route::get('/teknisi', [ReferenceController::class, 'teknisi']);

    // ─── QR Scan (public to all authenticated) ───────────────────────────────
    Route::get('/assets/code/{code}', [AssetController::class, 'showByCode']);
    Route::get('/assets/{asset}/logs', [AssetController::class, 'logs']);

    // ─── Assets (Admin only) ─────────────────────────────────────────────────
    Route::middleware('role:admin')->group(function () {
        Route::post('/assets', [AssetController::class, 'store']);
        Route::put('/assets/{asset}', [AssetController::class, 'update']);
        Route::delete('/assets/{asset}', [AssetController::class, 'destroy']);
    });

    // ─── Assets (read for all) ───────────────────────────────────────────────
    Route::get('/assets', [AssetController::class, 'index']);
    Route::get('/assets/{asset}', [AssetController::class, 'show']);

    // ─── Tickets ─────────────────────────────────────────────────────────────
    Route::get('/tickets', [TicketController::class, 'index']);
    Route::get('/tickets/{ticket}', [TicketController::class, 'show']);
    Route::get('/tickets/{ticket}/logs', [TicketController::class, 'logs']);

    Route::post('/tickets', [TicketController::class, 'store']);
    Route::put('/tickets/{ticket}', [TicketController::class, 'update']);
    Route::post('/tickets/{ticket}/assign', [TicketController::class, 'assign'])->middleware('role:admin');
    Route::post('/tickets/{ticket}/progress', [TicketController::class, 'progress']);
    Route::post('/tickets/{ticket}/done', [TicketController::class, 'done']);
    Route::post('/tickets/{ticket}/close', [TicketController::class, 'close'])->middleware('role:admin');
});
