<?php

namespace App\Console\Commands;

use App\Models\GoogleSheetConfig;
use App\Services\GoogleSheetsService;
use Illuminate\Console\Command;

class SyncGoogleSheets extends Command
{
    protected $signature = 'sheets:sync
        {--config= : Specific config ID to sync}
        {--all : Sync all active configs regardless of interval}';

    protected $description = 'Sync data to Google Sheets for active configurations';

    public function handle(GoogleSheetsService $sheetsService): int
    {
        if (!$sheetsService->hasCredentials()) {
            $this->error('Google Sheets credentials not found. Please upload credentials first.');
            return self::FAILURE;
        }

        $query = GoogleSheetConfig::query()
            ->where('status', '!=', 'paused');

        if ($configId = $this->option('config')) {
            $query->where('id', $configId);
        } else {
            $query->where('auto_sync', true);

            if (!$this->option('all')) {
                // Only sync configs that are due based on their interval
                $query->where(function ($q) {
                    $q->whereNull('last_synced_at')
                        ->orWhereRaw('last_synced_at <= NOW() - INTERVAL sync_interval_minutes MINUTE');
                });
            }
        }

        $configs = $query->get();

        if ($configs->isEmpty()) {
            $this->info('No configurations to sync.');
            return self::SUCCESS;
        }

        $this->info("Syncing {$configs->count()} configuration(s)...");

        foreach ($configs as $config) {
            $this->line("  → Syncing: {$config->name}");

            $log = $sheetsService->sync($config, 'scheduled');

            if ($log->status === 'success') {
                $this->info("    ✓ Success: {$log->total_rows} rows in {$log->duration_seconds}s");
            } else {
                $this->error("    ✗ Failed: {$log->error_message}");
            }
        }

        $this->newLine();
        $this->info('Sync complete!');

        return self::SUCCESS;
    }
}
