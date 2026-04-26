Berikut versi **PRD lengkap + ERD final + turunan teknis (Laravel Migration & API clean architecture)** yang sudah disesuaikan dengan **2 role saja: Admin IT & Teknisi**.

Aku buat ini supaya bisa langsung kamu implementasikan di stack kamu (Laravel 12 + React + Sanctum + TypeScript).

---

# 📄 1. PRD (Final Version)

## 🎯 Tujuan

Menyediakan sistem:

* Inventaris asset
* Tracking lokasi
* Pelaporan & perbaikan via QR
* Ticketing teknisi
* Audit & histori lengkap

---

## 👥 Role

### 👑 Admin IT

* Kelola asset
* Generate QR
* Monitoring ticket
* Assign teknisi

### 🛠️ Teknisi

* Scan QR
* Buat ticket
* Kerjakan ticket
* Update hasil perbaikan

---

## 🔄 Core Flow (Final)

```text
Scan QR → Asset Detail → Laporkan Masalah → 
Ticket dibuat → Teknisi ambil → 
Perbaikan → Selesai → Tercatat di histori
```

---

## 🧩 Fitur Utama

### 1. Asset Management

* CRUD asset
* Status:

  * Available
  * In Use
  * Maintenance
  * Broken
  * Disposed

---

### 2. QR Code

* Generate QR unik per asset
* Scan → buka halaman asset

---

### 3. Ticketing

* Create ticket dari asset
* Assign teknisi
* Status:

  * Open
  * On Progress
  * Done
  * Closed

---

### 4. Tracking & Audit

* Log semua aktivitas:

  * Create
  * Move
  * Maintenance
  * Status change

---

# 🧱 2. ERD FINAL (Sederhana tapi scalable)

```text
users
- id
- name
- email
- password
- role (admin, teknisi)

categories
- id
- name

locations
- id
- name

assets
- id
- code
- name
- category_id
- serial_number
- status
- location_id

tickets
- id
- asset_id
- reported_by
- assigned_to
- description
- status
- priority

ticket_logs
- id
- ticket_id
- note
- created_by

asset_logs
- id
- asset_id
- action
- description
- created_by
```

---

# 🗄️ 3. Laravel Migration (Siap Pakai)

## 🧾 users (tambahan role)

```php
$table->enum('role', ['admin', 'teknisi'])->default('teknisi');
```

---

## 📦 assets

```php
Schema::create('assets', function (Blueprint $table) {
    $table->id();
    $table->string('code')->unique();
    $table->string('name');
    $table->foreignId('category_id')->constrained();
    $table->string('serial_number')->nullable();
    $table->enum('status', ['available','in_use','maintenance','broken','disposed']);
    $table->foreignId('location_id')->constrained();
    $table->timestamps();
});
```

---

## 🎫 tickets

```php
Schema::create('tickets', function (Blueprint $table) {
    $table->id();
    $table->foreignId('asset_id')->constrained();
    $table->foreignId('reported_by')->constrained('users');
    $table->foreignId('assigned_to')->nullable()->constrained('users');
    $table->text('description');
    $table->enum('status', ['open','progress','done','closed'])->default('open');
    $table->enum('priority', ['low','medium','high'])->default('medium');
    $table->timestamps();
});
```

---

## 🛠️ ticket_logs

```php
Schema::create('ticket_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('ticket_id')->constrained();
    $table->text('note');
    $table->foreignId('created_by')->constrained('users');
    $table->timestamps();
});
```

---

## 📜 asset_logs

```php
Schema::create('asset_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('asset_id')->constrained();
    $table->string('action');
    $table->text('description')->nullable();
    $table->foreignId('created_by')->constrained('users');
    $table->timestamps();
});
```

---

# ⚙️ 4. API Design (Clean Architecture Style)

## 📁 Struktur Folder Laravel

```bash
app/
 ├── Http/
 ├── Models/
 ├── Repositories/
 ├── Services/
 ├── Actions/
```

---

# 🔌 5. API ENDPOINTS

## 🔐 Auth (Sanctum)

```http
POST /api/login
POST /api/logout
GET  /api/me
```

---

## 📦 Asset

```http
GET    /api/assets
POST   /api/assets
GET    /api/assets/{id}
PUT    /api/assets/{id}
DELETE /api/assets/{id}
```

---

## 📷 Scan QR (Important)

```http
GET /api/assets/code/{code}
```

➡️ dipakai saat scan QR

---

## 🎫 Ticket

```http
GET    /api/tickets
POST   /api/tickets
GET    /api/tickets/{id}
PUT    /api/tickets/{id}
POST   /api/tickets/{id}/assign
POST   /api/tickets/{id}/progress
POST   /api/tickets/{id}/done
```

---

## 🧾 Logs

```http
GET /api/assets/{id}/logs
GET /api/tickets/{id}/logs
```

---

# 🧠 6. Service Layer (Best Practice)

## Contoh: Create Ticket Service

```php
class CreateTicketService {
    public function execute($data) {
        $ticket = Ticket::create($data);

        TicketLog::create([
            'ticket_id' => $ticket->id,
            'note' => 'Ticket created',
            'created_by' => auth()->id()
        ]);

        Asset::where('id', $data['asset_id'])
            ->update(['status' => 'maintenance']);

        return $ticket;
    }
}
```

---

# 🔐 7. Middleware & Role Check

```php
Route::middleware(['auth:sanctum'])->group(function () {
    Route::middleware('role:admin')->group(function () {
        Route::post('/assets', ...);
    });

    Route::middleware('role:teknisi')->group(function () {
        Route::post('/tickets', ...);
    });
});
```

---

# ⚛️ 8. Frontend Flow (React)

## Scan QR

* Gunakan camera (html5-qrcode / react-qr-reader)
* Redirect ke:

```bash
/assets/{code}
```

---

## Halaman Asset

* Info asset
* Tombol:

  * Laporkan masalah

---

## Halaman Ticket

* List ticket
* Update status
* Input hasil perbaikan

---

# 🔥 9. Best Practice (WAJIB)

* Semua perubahan → masuk log
* Jangan update langsung tanpa histori
* Gunakan enum untuk status
* Gunakan QR code berbasis URL
* Pisahkan Service & Controller

---

