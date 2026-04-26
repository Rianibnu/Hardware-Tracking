<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Location;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ─── Users ───────────────────────────────────────────────────────────
        $admin = User::firstOrCreate(
            ['email' => 'admin@tracking.test'],
            [
                'name'     => 'Admin IT',
                'password' => Hash::make('password'),
                'role'     => 'admin',
            ]
        );

        $teknisi1 = User::firstOrCreate(
            ['email' => 'teknisi1@tracking.test'],
            [
                'name'     => 'Budi Teknisi',
                'password' => Hash::make('password'),
                'role'     => 'teknisi',
            ]
        );

        $teknisi2 = User::firstOrCreate(
            ['email' => 'teknisi2@tracking.test'],
            [
                'name'     => 'Sari Teknisi',
                'password' => Hash::make('password'),
                'role'     => 'teknisi',
            ]
        );

        // ─── Categories ──────────────────────────────────────────────────────
        $categories = [
            ['name' => 'Komputer', 'description' => 'Desktop, Laptop, AIO'],
            ['name' => 'Printer', 'description' => 'Inkjet, Laser, Plotter'],
            ['name' => 'Jaringan', 'description' => 'Switch, Router, AP, Modem'],
            ['name' => 'Monitor', 'description' => 'Monitor & Display'],
            ['name' => 'Server', 'description' => 'Server & NAS'],
            ['name' => 'UPS', 'description' => 'Uninterruptible Power Supply'],
            ['name' => 'Telepon', 'description' => 'PABX, IP Phone'],
            ['name' => 'CCTV', 'description' => 'Kamera & DVR'],
            ['name' => 'Lainnya', 'description' => 'Perangkat lain-lain'],
        ];

        foreach ($categories as $cat) {
            Category::firstOrCreate(['name' => $cat['name']], $cat);
        }

        // ─── Locations ───────────────────────────────────────────────────────
        $locations = [
            ['name' => 'Lantai 1 - Lobby', 'building' => 'Gedung Utama', 'floor' => '1', 'room' => 'Lobby'],
            ['name' => 'Lantai 1 - Ruang IT', 'building' => 'Gedung Utama', 'floor' => '1', 'room' => 'IT'],
            ['name' => 'Lantai 2 - HRD', 'building' => 'Gedung Utama', 'floor' => '2', 'room' => 'HRD'],
            ['name' => 'Lantai 2 - Keuangan', 'building' => 'Gedung Utama', 'floor' => '2', 'room' => 'Keuangan'],
            ['name' => 'Lantai 3 - Direksi', 'building' => 'Gedung Utama', 'floor' => '3', 'room' => 'Direksi'],
            ['name' => 'Gudang', 'building' => 'Gedung Samping', 'floor' => '1', 'room' => 'Gudang'],
            ['name' => 'Server Room', 'building' => 'Gedung Utama', 'floor' => '1', 'room' => 'Server Room'],
        ];

        foreach ($locations as $loc) {
            Location::firstOrCreate(['name' => $loc['name']], $loc);
        }

        // ─── Brands ──────────────────────────────────────────────────────────
        $brands = [
            ['name' => 'HP', 'description' => 'Hewlett-Packard'],
            ['name' => 'Dell', 'description' => 'Dell Technologies'],
            ['name' => 'Lenovo', 'description' => 'Lenovo Group Limited'],
            ['name' => 'Asus', 'description' => 'ASUSTeK Computer Inc.'],
            ['name' => 'Acer', 'description' => 'Acer Inc.'],
            ['name' => 'Apple', 'description' => 'Apple Inc.'],
            ['name' => 'Cisco', 'description' => 'Cisco Systems'],
            ['name' => 'MikroTik', 'description' => 'MikroTikls SIA'],
            ['name' => 'Ubiquiti', 'description' => 'Ubiquiti Networks'],
            ['name' => 'Epson', 'description' => 'Seiko Epson Corp.'],
            ['name' => 'Canon', 'description' => 'Canon Inc.'],
            ['name' => 'Samsung', 'description' => 'Samsung Electronics'],
            ['name' => 'APC', 'description' => 'APC by Schneider Electric'],
            ['name' => 'Hikvision', 'description' => 'Hikvision Digital Technology'],
            ['name' => 'Dahua', 'description' => 'Dahua Technology'],
            ['name' => 'Lainnya', 'description' => 'Merek lain-lain'],
        ];

        foreach ($brands as $brand) {
            Brand::firstOrCreate(['name' => $brand['name']], $brand);
        }
    }
}
