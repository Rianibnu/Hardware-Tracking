<?php

use App\Models\User;
use App\Models\Category;
use App\Models\Location;
use App\Models\Asset;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin can create asset', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $category = Category::create(['name' => 'IT']);
    $location = Location::create(['name' => 'HQ']);

    $response = $this->actingAs($admin)->post(route('assets.store'), [
        'code' => 'IT-001',
        'name' => 'Laptop Lenovo',
        'category_id' => $category->id,
        'serial_number' => 'SN12345',
        'status' => 'available',
        'location_id' => $location->id,
    ]);

    $response->assertRedirect();
    
    $this->assertDatabaseHas('assets', [
        'code' => 'IT-001',
        'name' => 'Laptop Lenovo',
        'status' => 'available',
    ]);
});

test('public can view asset by code', function () {
    $category = Category::create(['name' => 'IT']);
    $location = Location::create(['name' => 'HQ']);
    $asset = Asset::create([
        'code' => 'IT-002',
        'name' => 'Projector Epson',
        'category_id' => $category->id,
        'status' => 'in_use',
        'location_id' => $location->id,
    ]);

    $response = $this->get(route('assets.public-show', $asset->code));

    $response->assertStatus(200);
});

test('admin can update asset status', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $category = Category::create(['name' => 'IT']);
    $location = Location::create(['name' => 'HQ']);
    $asset = Asset::create([
        'code' => 'IT-003',
        'name' => 'Printer HP',
        'category_id' => $category->id,
        'status' => 'available',
        'location_id' => $location->id,
    ]);

    $response = $this->actingAs($admin)->put(route('assets.update', $asset->id), [
        'code' => 'IT-003',
        'name' => 'Printer HP',
        'category_id' => $category->id,
        'status' => 'broken',
        'location_id' => $location->id,
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('assets', [
        'id' => $asset->id,
        'status' => 'broken',
    ]);
});
