<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\Ticket;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $query = $request->query('q');

        if (!$query) {
            return response()->json(['assets' => [], 'tickets' => []]);
        }

        $assets = Asset::with(['category:id,name', 'location:id,name'])
            ->where('name', 'like', "%{$query}%")
            ->orWhere('code', 'like', "%{$query}%")
            ->orWhere('status', 'like', "%{$query}%")
            ->orWhereHas('location', function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%");
            })
            ->orWhereHas('category', function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%");
            })
            ->orWhereHas('brand', function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%");
            })
            ->limit(8)
            ->get(['id', 'name', 'code', 'status', 'category_id', 'location_id']);

        $tickets = Ticket::with(['asset:id,name,code'])
            ->where('title', 'like', "%{$query}%")
            ->orWhere('description', 'like', "%{$query}%")
            ->orWhere('status', 'like', "%{$query}%")
            ->orWhere('id', 'like', "%{$query}%")
            ->orWhereHas('asset', function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('code', 'like', "%{$query}%");
            })
            ->limit(5)
            ->get(['id', 'title', 'status', 'asset_id']);

        return response()->json([
            'assets' => $assets,
            'tickets' => $tickets,
        ]);
    }
}
