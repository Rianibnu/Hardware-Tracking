<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\AssetLog;
use Illuminate\Support\Str;

class AssetService
{
    public function create(array $data): Asset
    {
        $data['code'] = $data['code'] ?? $this->generateCode($data['category_id'] ?? null);
        $asset = Asset::create($data);

        AssetLog::create([
            'asset_id'   => $asset->id,
            'action'     => 'create',
            'description' => 'Asset baru ditambahkan: ' . $asset->name,
            'metadata'   => ['status' => $asset->status, 'location_id' => $asset->location_id],
            'created_by' => auth()->id(),
        ]);

        return $asset;
    }

    public function update(Asset $asset, array $data): Asset
    {
        $before = $asset->only(['status', 'location_id', 'name']);
        $asset->update($data);
        $after = $asset->only(['status', 'location_id', 'name']);

        $action = 'update';
        if (isset($data['status']) && $data['status'] !== $before['status']) {
            $action = 'status_change';
        }
        if (isset($data['location_id']) && $data['location_id'] !== $before['location_id']) {
            $action = 'move';
        }

        AssetLog::create([
            'asset_id'    => $asset->id,
            'action'      => $action,
            'description' => 'Asset diperbarui',
            'metadata'    => ['before' => $before, 'after' => $after],
            'created_by'  => auth()->id(),
        ]);

        return $asset;
    }

    public function mutate(Asset $asset, int $newLocationId, ?string $reason = null): Asset
    {
        $oldLocation = $asset->location;
        $asset->load('location');

        $asset->update(['location_id' => $newLocationId]);
        $asset->load('location'); // reload new location

        $oldName = $oldLocation?->name ?? 'Tidak diketahui';
        $newName = $asset->location?->name ?? 'Tidak diketahui';

        AssetLog::create([
            'asset_id'    => $asset->id,
            'action'      => 'move',
            'description' => $reason
                ? "Dipindahkan dari \"{$oldName}\" ke \"{$newName}\". Alasan: {$reason}"
                : "Dipindahkan dari \"{$oldName}\" ke \"{$newName}\"",
            'metadata'    => [
                'from' => $oldName,
                'to'   => $newName,
                'from_id' => $oldLocation?->id,
                'to_id'   => $newLocationId,
                'reason'  => $reason,
            ],
            'created_by'  => auth()->id(),
        ]);

        return $asset;
    }

    public function delete(Asset $asset): void
    {
        AssetLog::create([
            'asset_id'    => $asset->id,
            'action'      => 'delete',
            'description' => 'Asset dihapus: ' . $asset->name,
            'metadata'    => $asset->toArray(),
            'created_by'  => auth()->id(),
        ]);

        $asset->delete();
    }

    private function generateCode(?int $categoryId): string
    {
        $prefix = 'AST';
        $count = Asset::count() + 1;
        return $prefix . '-' . str_pad((string) $count, 4, '0', STR_PAD_LEFT) . '-' . strtoupper(Str::random(4));
    }
}
