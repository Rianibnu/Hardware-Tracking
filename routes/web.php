<?php

use App\Http\Controllers\AssetController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    $assets = \App\Models\Asset::query();
    $tickets = \App\Models\Ticket::query();

    $stats = [
        'total_assets'    => (clone $assets)->count(),
        'by_status'       => (clone $assets)->selectRaw('status, count(*) as count')->groupBy('status')->pluck('count', 'status'),
        'open_tickets'    => (clone $tickets)->whereIn('status', ['open', 'progress'])->count(),
        'done_tickets'    => (clone $tickets)->where('status', 'done')->count(),
        'total_tickets'   => (clone $tickets)->count(),
        'recent_tickets'  => \App\Models\Ticket::with(['asset:id,name,code', 'assignee:id,name'])
            ->whereIn('status', ['open', 'progress'])
            ->latest()
            ->limit(10)
            ->get(['id', 'title', 'status', 'priority', 'asset_id', 'assigned_to', 'created_at']),
        'recent_logs'     => \App\Models\AssetLog::with(['asset:id,name,code', 'creator:id,name'])
            ->latest()
            ->limit(10)
            ->get(['id', 'asset_id', 'action', 'description', 'created_by', 'created_at']),
    ];

    return Inertia::render('welcome', [
        'stats'       => $stats,
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

// QR Scan redirect
Route::get('/scan/{code}', function (string $code) {
    if (auth()->check()) {
        $asset = \App\Models\Asset::where('code', $code)->first();
        if ($asset) {
            return redirect()->route('assets.show', $asset->id);
        }
    }
    return redirect()->route('assets.public-show', $code);
})->name('scan');

// Public Asset & Reporting
Route::get('/public/assets/{code}', [AssetController::class, 'publicShow'])->name('assets.public-show');
Route::post('/public/assets/{code}/tickets', [TicketController::class, 'publicStore'])->name('tickets.public-store');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $user = auth()->user();

        $assetQuery = \App\Models\Asset::query();
        $ticketQuery = \App\Models\Ticket::query();
        $recentQuery = \App\Models\Ticket::with(['asset:id,name', 'reporter:id,name']);

        if ($user->role === 'teknisi') {
            $ticketQuery->where(fn ($q) => $q->where('assigned_to', $user->id)->orWhere('reported_by', $user->id));
            $recentQuery->where(fn ($q) => $q->where('assigned_to', $user->id)->orWhere('reported_by', $user->id));
        }

        $stats = [
            'assets' => [
                'total'     => $assetQuery->count(),
                'by_status' => $assetQuery->selectRaw('status, count(*) as count')->groupBy('status')->pluck('count', 'status'),
            ],
            'tickets' => [
                'total'     => (clone $ticketQuery)->count(),
                'by_status' => (clone $ticketQuery)->selectRaw('status, count(*) as count')->groupBy('status')->pluck('count', 'status'),
            ],
            'recent_tickets' => $recentQuery->latest()->limit(15)->get(),
        ];

        return \Inertia\Inertia::render('dashboard', ['stats' => $stats]);
    })->name('dashboard');

    // QR Scanner page
    Route::inertia('scan-qr', 'scan')->name('scan-qr');

    // Assets
    Route::resource('assets', AssetController::class);
    Route::post('assets/{asset}/quick-maintenance', [TicketController::class, 'quickMaintenance'])->name('assets.quick-maintenance');
    Route::post('assets/{asset}/mutate', [AssetController::class, 'mutate'])->name('assets.mutate');

    // Master Data Routes
    Route::resource('categories', CategoryController::class)->except(['create', 'show', 'edit']);
    Route::resource('locations', LocationController::class)->except(['create', 'show', 'edit']);
    Route::resource('brands', BrandController::class)->except(['create', 'show', 'edit']);

    // Tickets
    Route::resource('tickets', TicketController::class)->except(['destroy', 'edit', 'update']);
    Route::post('tickets/{ticket}/assign', [TicketController::class, 'assign'])->name('tickets.assign');
    Route::post('tickets/{ticket}/progress', [TicketController::class, 'progress'])->name('tickets.progress');
    Route::post('tickets/{ticket}/done', [TicketController::class, 'done'])->name('tickets.done');
    Route::post('tickets/{ticket}/close', [TicketController::class, 'close'])->name('tickets.close');
    // Service Records
    Route::get('/tickets/{ticket}/service-records/create', [\App\Http\Controllers\ServiceRecordController::class, 'create'])->name('service-records.create');
    Route::post('/tickets/{ticket}/service-records', [\App\Http\Controllers\ServiceRecordController::class, 'store'])->name('service-records.store');

    Route::get('/search', [\App\Http\Controllers\SearchController::class, 'search'])->name('global.search');
    
    Route::get('services', [\App\Http\Controllers\ServiceRecordController::class, 'index'])->name('services.index');
    Route::post('services', [\App\Http\Controllers\ServiceRecordController::class, 'store'])->name('services.store');
    Route::post('services/{serviceRecord}/complete', [\App\Http\Controllers\ServiceRecordController::class, 'complete'])->name('services.complete');

    // Reports
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    Route::post('reports/export', [ReportController::class, 'export'])->name('reports.export');
    Route::post('reports/import', [ReportController::class, 'import'])->name('reports.import');
    Route::get('reports/template', [ReportController::class, 'downloadTemplate'])->name('reports.template');

    // User Management (Admin only)
    Route::middleware('role:admin')->group(function () {
        Route::get('users', [UserController::class, 'index'])->name('users.index');
        Route::post('users', [UserController::class, 'store'])->name('users.store');
        Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });

    // Notifications API
    Route::get('notifications/json', [NotificationController::class, 'index'])->name('notifications.json');
    Route::post('notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
});

require __DIR__.'/settings.php';
