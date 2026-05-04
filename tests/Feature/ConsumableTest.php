<?php

use App\Models\User;
use App\Models\Consumable;
use App\Models\ConsumableRequest;
use App\Models\Category;
use App\Models\Location;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin can create consumable', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $category = Category::create(['name' => 'IT']);

    $response = $this->actingAs($admin)->post(route('consumables.store'), [
        'name' => 'Kertas A4',
        'category_id' => $category->id,
        'unit' => 'rim',
        'min_stock' => 5,
        'description' => 'Kertas hvs',
    ]);

    $response->assertRedirect();
    
    $this->assertDatabaseHas('consumables', [
        'name' => 'Kertas A4',
        'unit' => 'rim',
        'min_stock' => 5,
    ]);
});

test('admin can add stock to consumable', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $consumable = Consumable::create(['name' => 'Kertas A4', 'unit' => 'rim', 'current_stock' => 10, 'min_stock' => 5, 'stock_status' => 'safe']);

    $response = $this->actingAs($admin)->post(route('consumables.stock-in', $consumable->id), [
        'quantity' => 20,
        'unit_price' => 50000,
        'supplier' => 'Toko Buku Maju',
        'notes' => 'Pembelian rutin',
    ]);

    $response->assertRedirect();
    
    $this->assertDatabaseHas('consumables', [
        'id' => $consumable->id,
        'current_stock' => 30,
    ]);

    $this->assertDatabaseHas('consumable_transactions', [
        'consumable_id' => $consumable->id,
        'type' => 'in',
        'quantity' => 20,
        'supplier' => 'Toko Buku Maju',
    ]);
});

test('public can request consumable', function () {
    $consumable = Consumable::create(['name' => 'Kertas A4', 'unit' => 'rim', 'current_stock' => 50, 'min_stock' => 5, 'stock_status' => 'safe']);
    $location = Location::create(['name' => 'HQ']);

    $response = $this->post(route('consumables.public-request'), [
        'consumable_id' => $consumable->id,
        'public_requester_name' => 'John Doe',
        'public_requester_email' => 'john@example.com',
        'quantity' => 5,
        'location_id' => $location->id,
        'reason' => 'Untuk meeting',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('consumable_requests', [
        'consumable_id' => $consumable->id,
        'public_requester_name' => 'John Doe',
        'quantity' => 5,
        'status' => 'pending',
    ]);
});

test('admin can fulfill consumable request and it reduces stock', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $consumable = Consumable::create(['name' => 'Kertas A4', 'unit' => 'rim', 'current_stock' => 50, 'min_stock' => 5, 'stock_status' => 'safe']);
    $request = ConsumableRequest::create([
        'consumable_id' => $consumable->id,
        'quantity' => 10,
        'status' => 'pending'
    ]);

    $response = $this->actingAs($admin)->post(route('consumable-requests.fulfill', $request->id));

    $response->assertRedirect();

    $this->assertDatabaseHas('consumables', [
        'id' => $consumable->id,
        'current_stock' => 40,
    ]);

    $this->assertDatabaseHas('consumable_requests', [
        'id' => $request->id,
        'status' => 'fulfilled',
        'approved_by' => $admin->id,
    ]);

    $this->assertDatabaseHas('consumable_transactions', [
        'consumable_id' => $consumable->id,
        'type' => 'out',
        'quantity' => 10,
        'request_id' => $request->id,
    ]);
});
