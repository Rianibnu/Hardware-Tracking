<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Asset;
use App\Models\Ticket;
use App\Models\ServiceRecord;
use App\Models\User;
use App\Models\Category;
use App\Models\Location;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\TechnicianWorkloadExport;
use App\Exports\TicketReportExport;
use App\Exports\ServiceReportExport;
use App\Exports\AssetMappingExport;
use App\Exports\AssetImportTemplate;
use App\Imports\AssetsImport;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $type = $request->get('type', 'tickets'); // tickets, services, technicians, assets
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        $technicianId = $request->get('technician_id');
        $categoryId = $request->get('category_id');

        $data = [];

        // Fetch filter options
        $technicians = User::whereIn('role', ['teknisi', 'admin'])->select('id', 'name')->get();
        $categories = Category::select('id', 'name')->get();

        if ($type === 'tickets') {
            $query = Ticket::with(['asset.category', 'reporter', 'assignee'])
                ->when($request->sort, function ($q) use ($request) {
                    $q->orderBy($request->sort, $request->dir === 'asc' ? 'asc' : 'desc');
                }, fn ($q) => $q->latest());
            
            if ($startDate) $query->whereDate('created_at', '>=', $startDate);
            if ($endDate) $query->whereDate('created_at', '<=', $endDate);
            if ($technicianId) $query->where('assigned_to', $technicianId);
            if ($categoryId) {
                $query->whereHas('asset', function($q) use ($categoryId) {
                    $q->where('category_id', $categoryId);
                });
            }

            $data = $query->paginate(15)->withQueryString();
        } 
        elseif ($type === 'services') {
            $query = ServiceRecord::with(['asset.category', 'creator'])
                ->when($request->sort, function ($q) use ($request) {
                    $q->orderBy($request->sort, $request->dir === 'asc' ? 'asc' : 'desc');
                }, fn ($q) => $q->latest());
            
            if ($startDate) $query->whereDate('created_at', '>=', $startDate);
            if ($endDate) $query->whereDate('created_at', '<=', $endDate);
            // Service record doesn't have assignee, but we can filter by who sent it (created_by) if we treat it as technician
            if ($technicianId) $query->where('created_by', $technicianId);
            if ($categoryId) {
                $query->whereHas('asset', function($q) use ($categoryId) {
                    $q->where('category_id', $categoryId);
                });
            }

            $data = $query->paginate(15)->withQueryString();
        }
        elseif ($type === 'technicians') {
            $query = Ticket::with(['asset.category', 'assignee'])
                ->whereNotNull('assigned_to')
                ->when($request->sort, function ($q) use ($request) {
                    $q->orderBy($request->sort, $request->dir === 'asc' ? 'asc' : 'desc');
                }, fn ($q) => $q->latest('updated_at'));

            if ($startDate) $query->whereDate('updated_at', '>=', $startDate);
            if ($endDate) $query->whereDate('updated_at', '<=', $endDate);
            if ($technicianId) $query->where('assigned_to', $technicianId);
            if ($categoryId) {
                $query->whereHas('asset', function($q) use ($categoryId) {
                    $q->where('category_id', $categoryId);
                });
            }

            $data = $query->paginate(15)->withQueryString();
        }
        elseif ($type === 'assets') {
            $query = Asset::with(['category', 'location', 'brand'])
                ->when($request->sort, function ($q) use ($request) {
                    $q->orderBy($request->sort, $request->dir === 'asc' ? 'asc' : 'desc');
                }, fn ($q) => $q->latest());
            
            if ($startDate) $query->whereDate('purchase_date', '>=', $startDate);
            if ($endDate) $query->whereDate('purchase_date', '<=', $endDate);
            if ($categoryId) $query->where('category_id', $categoryId);

            $data = $query->paginate(15)->withQueryString();
        }

        return Inertia::render('reports/index', [
            'type' => $type,
            'filters' => $request->only(['start_date', 'end_date', 'technician_id', 'category_id', 'sort', 'dir']),
            'data' => $data,
            'technicians' => $technicians,
            'categories' => $categories
        ]);
    }

    public function export(Request $request)
    {
        $type = $request->get('type', 'tickets');
        $filters = $request->only(['start_date', 'end_date', 'technician_id', 'category_id']);

        if ($type === 'tickets') {
            return Excel::download(new TicketReportExport($filters), 'laporan_kerusakan.xlsx');
        } elseif ($type === 'services') {
            return Excel::download(new ServiceReportExport($filters), 'laporan_service_pihak3.xlsx');
        } elseif ($type === 'technicians') {
            return Excel::download(new TechnicianWorkloadExport($filters), 'laporan_kerja_teknisi.xlsx');
        } elseif ($type === 'assets') {
            return Excel::download(new AssetMappingExport($filters), 'laporan_mapping_asset.xlsx');
        }

        return back()->with('error', 'Tipe laporan tidak valid.');
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240',
        ]);

        $import = new AssetsImport();
        Excel::import($import, $request->file('file'));

        $imported = $import->getImportedCount();
        $skipped = $import->getSkippedCount();
        $failures = $import->failures();

        $message = "Berhasil mengimpor {$imported} data asset.";
        if ($skipped > 0) {
            $message .= " {$skipped} baris dilewati (duplikat/tidak lengkap).";
        }
        if ($failures->count() > 0) {
            $message .= " {$failures->count()} baris gagal validasi.";
        }

        return back()->with('success', $message);
    }

    public function downloadTemplate()
    {
        return Excel::download(new AssetImportTemplate(), 'template_import_asset.xlsx');
    }
}
