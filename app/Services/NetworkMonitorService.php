<?php

namespace App\Services;

use App\Models\Asset;
use Illuminate\Support\Collection;

class NetworkMonitorService
{
    /**
     * Ping a single IP address and return latency in ms.
     * Returns -1 if unreachable.
     */
    public function ping(string $ip, int $timeout = 2): float
    {
        // Validate IP format
        if (!filter_var($ip, FILTER_VALIDATE_IP)) {
            return -1;
        }

        $startTime = microtime(true);

        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            // Windows: ping -n 1 -w <timeout_ms>
            $cmd = sprintf('ping -n 1 -w %d %s 2>NUL', $timeout * 1000, escapeshellarg($ip));
        } else {
            // Linux/Mac: ping -c 1 -W <timeout_sec>
            $cmd = sprintf('ping -c 1 -W %d %s 2>/dev/null', $timeout, escapeshellarg($ip));
        }

        exec($cmd, $output, $returnCode);

        if ($returnCode === 0) {
            $latency = round((microtime(true) - $startTime) * 1000, 1);

            // Try to extract actual RTT from output
            $outputStr = implode("\n", $output);
            if (preg_match('/time[=<](\d+\.?\d*)/', $outputStr, $matches)) {
                $latency = (float) $matches[1];
            }

            return $latency;
        }

        return -1;
    }

    /**
     * Ping multiple assets and return results.
     */
    public function pingAssets(Collection $assets): array
    {
        $results = [];

        foreach ($assets as $asset) {
            if (empty($asset->ip_address)) {
                $results[] = [
                    'asset_id' => $asset->id,
                    'code'     => $asset->code,
                    'name'     => $asset->name,
                    'ip'       => null,
                    'status'   => 'no_ip',
                    'latency'  => null,
                ];
                continue;
            }

            $latency = $this->ping($asset->ip_address);

            $results[] = [
                'asset_id'       => $asset->id,
                'code'           => $asset->code,
                'name'           => $asset->name,
                'ip'             => $asset->ip_address,
                'status'         => $latency >= 0 ? 'online' : 'offline',
                'latency'        => $latency >= 0 ? $latency : null,
                'last_heartbeat' => $asset->last_heartbeat,
                'location'       => $asset->location?->name,
                'category'       => $asset->category?->name,
            ];
        }

        return $results;
    }

    /**
     * Get network overview stats.
     */
    public function getNetworkStats(array $pingResults): array
    {
        $total   = count($pingResults);
        $online  = count(array_filter($pingResults, fn($r) => $r['status'] === 'online'));
        $offline = count(array_filter($pingResults, fn($r) => $r['status'] === 'offline'));
        $noIp    = count(array_filter($pingResults, fn($r) => $r['status'] === 'no_ip'));

        $avgLatency = 0;
        $onlineWithLatency = array_filter($pingResults, fn($r) => $r['status'] === 'online' && $r['latency'] !== null);
        if (count($onlineWithLatency) > 0) {
            $avgLatency = round(array_sum(array_column($onlineWithLatency, 'latency')) / count($onlineWithLatency), 1);
        }

        return [
            'total'       => $total,
            'online'      => $online,
            'offline'     => $offline,
            'no_ip'       => $noIp,
            'avg_latency' => $avgLatency,
        ];
    }
}
