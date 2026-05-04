<?php

use App\Models\User;
use App\Models\Category;
use App\Models\Location;
use App\Models\Asset;
use App\Models\Ticket;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('public can create a ticket for an asset', function () {
    $category = Category::create(['name' => 'IT']);
    $location = Location::create(['name' => 'HQ']);
    $asset = Asset::create([
        'code' => 'IT-004',
        'name' => 'Router Mikrotik',
        'category_id' => $category->id,
        'status' => 'available',
        'location_id' => $location->id,
    ]);

    $response = $this->post(route('tickets.public-store', $asset->code), [
        'title' => 'Router mati',
        'description' => 'Router tiba-tiba mati tidak ada lampu indikator',
        'priority' => 'high',
        'reporter_name' => 'Andi',
        'reporter_email' => 'andi@example.com',
        'reporter_phone' => '0812345678',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('tickets', [
        'asset_id' => $asset->id,
        'title' => 'Router mati',
        'status' => 'open',
    ]);
});

test('technician can progress and finish a ticket', function () {
    $technician = User::factory()->create(['role' => 'teknisi']);
    $category = Category::create(['name' => 'IT']);
    $location = Location::create(['name' => 'HQ']);
    $asset = Asset::create([
        'code' => 'IT-005',
        'name' => 'Monitor Dell',
        'category_id' => $category->id,
        'status' => 'available',
        'location_id' => $location->id,
    ]);

    $ticket = Ticket::create([
        'asset_id' => $asset->id,
        'title' => 'Layar bergaris',
        'description' => 'Ada garis vertikal di layar',
        'priority' => 'medium',
        'status' => 'open',
        'reporter_name' => 'Budi',
    ]);

    // Assign
    $this->actingAs($technician)->post(route('tickets.assign', $ticket->id), [
        'assigned_to' => $technician->id
    ]);

    // Progress
    $response = $this->actingAs($technician)->post(route('tickets.progress', $ticket->id), [
        'note' => 'Mulai diperiksa'
    ]);
    
    $response->assertRedirect();
    $this->assertDatabaseHas('tickets', [
        'id' => $ticket->id,
        'status' => 'progress',
        'assigned_to' => $technician->id,
    ]);

    // Done
    $responseDone = $this->actingAs($technician)->post(route('tickets.done', $ticket->id), [
        'note' => 'Ganti panel LCD'
    ]);

    $responseDone->assertRedirect();
    $this->assertDatabaseHas('tickets', [
        'id' => $ticket->id,
        'status' => 'done',
    ]);

    $this->assertDatabaseHas('ticket_logs', [
        'ticket_id' => $ticket->id,
        'status_to' => 'done',
        'note' => 'Ganti panel LCD',
    ]);
});
