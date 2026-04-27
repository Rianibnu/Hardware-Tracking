<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Google Sheets auto-sync — runs every 5 min but each config has its own interval check
Schedule::command('sheets:sync')->everyFiveMinutes()->withoutOverlapping();
