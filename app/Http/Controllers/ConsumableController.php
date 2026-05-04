<?php

namespace App\Http\Controllers;

use App\Models\Consumable;
use App\Models\ConsumableRequest;
use App\Models\ConsumableTransaction;
use App\Models\Category;
use App\Models\Location;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ConsumableController extends Controller
{
    /**
     * Display all consumables with stock levels + pending requests
     */
    public function index(Request $request): Response
    {
        $consumables = Consumable::with('category')
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('sku', 'like', "%{$request->search}%"))
            ->when($request->category_id, fn ($q) => $q->where('category_id', $request->category_id))
            ->when($request->stock_status, function ($q) use ($request) {
                if ($request->stock_status === 'empty') {
                    $q->where('current_stock', '<=', 0);
                } elseif ($request->stock_status === 'low') {
                    $q->where('current_stock', '>', 0)
                      ->whereColumn('current_stock', '<=', 'min_stock');
                } elseif ($request->stock_status === 'safe') {
                    $q->whereColumn('current_stock', '>', 'min_stock');
                }
            })
            ->when($request->sort, function ($q) use ($request) {
                $q->orderBy($request->sort, $request->dir === 'asc' ? 'asc' : 'desc');
            }, fn ($q) => $q->latest())
            ->paginate(15)
            ->withQueryString();

        // Pending requests count for badge
        $pendingRequestsCount = ConsumableRequest::where('status', 'pending')->count();

        // Pending requests for the tab
        $pendingRequests = ConsumableRequest::with(['consumable', 'requester', 'location'])
            ->where('status', 'pending')
            ->latest()
            ->get();

        return Inertia::render('consumables/index', [
            'consumables' => $consumables,
            'filters' => $request->only(['search', 'category_id', 'stock_status', 'sort', 'dir']),
            'categories' => Category::select('id', 'name')->orderBy('name')->get(),
            'locations' => Location::select('id', 'name', 'building', 'floor', 'room')->orderBy('name')->get(),
            'users' => User::select('id', 'name')->orderBy('name')->get(),
            'pendingRequestsCount' => $pendingRequestsCount,
            'pendingRequests' => $pendingRequests,
            'auth' => ['user' => auth()->user()],
        ]);
    }

    /**
     * Public page to view and request consumables
     */
    public function publicIndex(Request $request): Response
    {
        $consumables = Consumable::with('category')
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('sku', 'like', "%{$request->search}%"))
            ->when($request->category_id, fn ($q) => $q->where('category_id', $request->category_id))
            ->when($request->sort, function ($q) use ($request) {
                $q->orderBy($request->sort, $request->dir === 'asc' ? 'asc' : 'desc');
            }, fn ($q) => $q->orderBy('name', 'asc'))
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('public/consumables', [
            'consumables' => $consumables,
            'filters' => $request->only(['search', 'category_id', 'sort', 'dir']),
            'categories' => Category::select('id', 'name')->orderBy('name')->get(),
            'locations' => Location::select('id', 'name', 'building', 'floor', 'room')->orderBy('name')->get(),
        ]);
    }


    /**
     * Show detail of a consumable with transaction history
     */
    public function show(Consumable $consumable): Response
    {
        $consumable->load('category');

        $transactions = $consumable->transactions()
            ->with(['recipient', 'location', 'creator', 'request'])
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $requests = $consumable->requests()
            ->with(['requester', 'approver', 'location'])
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('consumables/show', [
            'consumable' => $consumable,
            'transactions' => $transactions,
            'requests' => $requests,
            'locations' => Location::select('id', 'name', 'building', 'floor', 'room')->orderBy('name')->get(),
            'users' => User::select('id', 'name')->orderBy('name')->get(),
            'auth' => ['user' => auth()->user()],
        ]);
    }

    /**
     * Store a new consumable item
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:100|unique:consumables,sku',
            'category_id' => 'nullable|exists:categories,id',
            'unit' => 'required|string|max:50',
            'min_stock' => 'required|integer|min:0',
            'description' => 'nullable|string',
        ]);

        $data['current_stock'] = 0;
        Consumable::create($data);

        return back()->with('success', 'Barang habis pakai berhasil ditambahkan!');
    }

    /**
     * Update a consumable item
     */
    public function update(Request $request, Consumable $consumable): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:100|unique:consumables,sku,' . $consumable->id,
            'category_id' => 'nullable|exists:categories,id',
            'unit' => 'required|string|max:50',
            'min_stock' => 'required|integer|min:0',
            'description' => 'nullable|string',
        ]);

        $consumable->update($data);

        return back()->with('success', 'Barang habis pakai berhasil diperbarui!');
    }

    /**
     * Delete a consumable item
     */
    public function destroy(Consumable $consumable): RedirectResponse
    {
        $consumable->delete();

        return redirect()->route('consumables.index')->with('success', 'Barang habis pakai berhasil dihapus!');
    }

    /**
     * Stock In — add stock
     */
    public function stockIn(Request $request, Consumable $consumable): RedirectResponse
    {
        $data = $request->validate([
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'nullable|numeric|min:0',
            'supplier' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($consumable, $data) {
            ConsumableTransaction::create([
                'consumable_id' => $consumable->id,
                'type' => 'in',
                'quantity' => $data['quantity'],
                'unit_price' => $data['unit_price'] ?? null,
                'supplier' => $data['supplier'] ?? null,
                'notes' => $data['notes'] ?? null,
                'created_by' => auth()->id(),
            ]);

            $consumable->increment('current_stock', $data['quantity']);
        });

        return back()->with('success', "Stok masuk {$data['quantity']} {$consumable->unit} berhasil dicatat!");
    }

    /**
     * Distribute — reduce stock (direct by admin)
     */
    public function distribute(Request $request, Consumable $consumable): RedirectResponse
    {
        $data = $request->validate([
            'quantity' => 'required|integer|min:1',
            'distributed_to' => 'nullable|exists:users,id',
            'location_id' => 'nullable|exists:locations,id',
            'notes' => 'nullable|string',
            'request_id' => 'nullable|exists:consumable_requests,id',
        ]);

        if ($data['quantity'] > $consumable->current_stock) {
            return back()->with('error', 'Stok tidak mencukupi! Stok saat ini: ' . $consumable->current_stock . ' ' . $consumable->unit);
        }

        DB::transaction(function () use ($consumable, $data) {
            ConsumableTransaction::create([
                'consumable_id' => $consumable->id,
                'type' => 'out',
                'quantity' => $data['quantity'],
                'distributed_to' => $data['distributed_to'] ?? null,
                'location_id' => $data['location_id'] ?? null,
                'notes' => $data['notes'] ?? null,
                'request_id' => $data['request_id'] ?? null,
                'created_by' => auth()->id(),
            ]);

            $consumable->decrement('current_stock', $data['quantity']);

            // If fulfilling a request, mark it as fulfilled
            if (!empty($data['request_id'])) {
                ConsumableRequest::where('id', $data['request_id'])->update([
                    'status' => 'fulfilled',
                ]);
            }
        });

        return back()->with('success', "Distribusi {$data['quantity']} {$consumable->unit} berhasil dicatat!");
    }

    // ===== REQUEST / APPROVAL FLOW =====

    /**
     * Create a new request (any user)
     */
    public function requestItem(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'consumable_id' => 'required|exists:consumables,id',
            'quantity' => 'required|integer|min:1',
            'location_id' => 'nullable|exists:locations,id',
            'reason' => 'nullable|string',
        ]);

        ConsumableRequest::create([
            'consumable_id' => $data['consumable_id'],
            'quantity' => $data['quantity'],
            'requested_by' => auth()->id(),
            'location_id' => $data['location_id'] ?? null,
            'reason' => $data['reason'] ?? null,
            'status' => 'pending',
        ]);

        return back()->with('success', 'Permintaan barang berhasil dikirim!');
    }

    /**
     * Create a new request (public user)
     */
    public function publicRequestItem(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'consumable_id' => 'required|exists:consumables,id',
            'quantity' => 'required|integer|min:1',
            'public_requester_name' => 'required|string|max:255',
            'public_requester_email' => 'nullable|email|max:255',
            'location_id' => 'nullable|exists:locations,id',
            'reason' => 'nullable|string',
        ]);

        $consumable = Consumable::findOrFail($data['consumable_id']);

        $req = ConsumableRequest::create([
            'consumable_id' => $data['consumable_id'],
            'quantity' => $data['quantity'],
            'requested_by' => null, // Public user
            'public_requester_name' => $data['public_requester_name'],
            'public_requester_email' => $data['public_requester_email'] ?? null,
            'location_id' => $data['location_id'] ?? null,
            'reason' => $data['reason'] ?? null,
            'status' => 'pending',
        ]);

        // Notify Admins
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            \App\Models\Notification::send(
                $admin->id,
                'info',
                'Permintaan Stok Masuk',
                "Permintaan {$data['quantity']} {$consumable->unit} {$consumable->name} dari publik ({$data['public_requester_name']})",
                "/consumables"
            );
        }

        return back()->with('success', 'Permintaan barang berhasil dikirim! Tim IT akan menindaklanjuti.');
    }

    /**
     * Approve a request (admin)
     */
    public function approveRequest(ConsumableRequest $consumableRequest): RedirectResponse
    {
        if ($consumableRequest->status !== 'pending') {
            return back()->with('error', 'Permintaan ini sudah diproses.');
        }

        $consumableRequest->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Permintaan disetujui! Silakan distribusikan barang.');
    }

    /**
     * Reject a request (admin)
     */
    public function rejectRequest(Request $request, ConsumableRequest $consumableRequest): RedirectResponse
    {
        if ($consumableRequest->status !== 'pending') {
            return back()->with('error', 'Permintaan ini sudah diproses.');
        }

        $data = $request->validate([
            'rejected_reason' => 'nullable|string',
        ]);

        $consumableRequest->update([
            'status' => 'rejected',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
            'rejected_reason' => $data['rejected_reason'] ?? null,
        ]);

        return back()->with('success', 'Permintaan ditolak.');
    }

    /**
     * Fulfill a request — approve + distribute in one step
     */
    public function fulfillRequest(Request $request, ConsumableRequest $consumableRequest): RedirectResponse
    {
        if (!in_array($consumableRequest->status, ['pending', 'approved'])) {
            return back()->with('error', 'Permintaan ini sudah diproses.');
        }

        $consumable = $consumableRequest->consumable;

        if ($consumableRequest->quantity > $consumable->current_stock) {
            return back()->with('error', 'Stok tidak mencukupi! Stok saat ini: ' . $consumable->current_stock . ' ' . $consumable->unit);
        }

        DB::transaction(function () use ($consumable, $consumableRequest) {
            // Approve if still pending
            if ($consumableRequest->status === 'pending') {
                $consumableRequest->update([
                    'status' => 'fulfilled',
                    'approved_by' => auth()->id(),
                    'approved_at' => now(),
                ]);
            } else {
                $consumableRequest->update(['status' => 'fulfilled']);
            }

            // Create distribution transaction
            ConsumableTransaction::create([
                'consumable_id' => $consumable->id,
                'type' => 'out',
                'quantity' => $consumableRequest->quantity,
                'distributed_to' => $consumableRequest->requested_by,
                'location_id' => $consumableRequest->location_id,
                'request_id' => $consumableRequest->id,
                'notes' => 'Fulfillment dari permintaan #' . $consumableRequest->id,
                'created_by' => auth()->id(),
            ]);

            $consumable->decrement('current_stock', $consumableRequest->quantity);
        });

        return back()->with('success', "Permintaan telah dipenuhi! {$consumableRequest->quantity} {$consumable->unit} telah didistribusikan.");
    }
}
