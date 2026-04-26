<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Location;
use Illuminate\Http\JsonResponse;

class ReferenceController extends Controller
{
    public function categories(): JsonResponse
    {
        return response()->json(Category::orderBy('name')->get());
    }

    public function locations(): JsonResponse
    {
        return response()->json(Location::orderBy('name')->get());
    }

    public function teknisi(): JsonResponse
    {
        return response()->json(
            \App\Models\User::where('role', 'teknisi')
                ->select('id', 'name', 'email')
                ->orderBy('name')
                ->get()
        );
    }
}
