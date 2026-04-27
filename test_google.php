<?php
try {
    $client = new \Google\Client();
    $client->setApplicationName('Monitoring Inventaris');
    $client->setScopes([\Google\Service\Sheets::SPREADSHEETS]);
    $client->setAuthConfig(storage_path('app/google/credentials.json'));
    $service = new \Google\Service\Sheets($client);
    // Fake ID to force an API call
    $service->spreadsheets->get('fake-id');
} catch (\Exception $e) {
    echo "EXACT_ERROR: " . $e->getMessage() . "\n";
}
