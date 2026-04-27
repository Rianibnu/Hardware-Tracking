<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Google Sheets Integration
    |--------------------------------------------------------------------------
    |
    | Configuration for Google Sheets API integration.
    | You need a Google Cloud service account with Sheets API enabled.
    |
    */

    'sheets' => [
        'enabled' => env('GOOGLE_SHEETS_ENABLED', false),

        // Path to the service account credentials JSON file
        'credentials_path' => env('GOOGLE_SHEETS_CREDENTIALS_PATH', storage_path('app/google/credentials.json')),

        // Application name for Google API
        'application_name' => env('GOOGLE_SHEETS_APP_NAME', 'Monitoring Inventaris'),

        // Default sync interval in minutes
        'sync_interval' => env('GOOGLE_SHEETS_SYNC_INTERVAL', 30),
    ],

];
