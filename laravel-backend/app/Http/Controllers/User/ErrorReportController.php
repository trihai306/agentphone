<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\ErrorReport;
use App\Models\ErrorReportResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ErrorReportController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $status = $request->get('status', 'all');

        $query = ErrorReport::forUser($user)
            ->with(['responses' => fn($q) => $q->latest()->limit(1)])
            ->latest();

        if ($status !== 'all') {
            $query->byStatus($status);
        }

        $reports = $query->paginate(10);

        $statusCounts = [
            'all' => ErrorReport::forUser($user)->count(),
            'pending' => ErrorReport::forUser($user)->byStatus('pending')->count(),
            'reviewing' => ErrorReport::forUser($user)->byStatus('reviewing')->count(),
            'in_progress' => ErrorReport::forUser($user)->byStatus('in_progress')->count(),
            'resolved' => ErrorReport::forUser($user)->byStatus('resolved')->count(),
            'closed' => ErrorReport::forUser($user)->byStatus('closed')->count(),
        ];

        return Inertia::render('ErrorReports/Index', [
            'reports' => $reports,
            'currentStatus' => $status,
            'statusCounts' => $statusCounts,
            'statuses' => ErrorReport::STATUSES,
            'types' => ErrorReport::TYPES,
            'severities' => ErrorReport::SEVERITIES,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('ErrorReports/Create', [
            'types' => ErrorReport::TYPES,
            'severities' => ErrorReport::SEVERITIES,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|min:10',
            'error_type' => 'required|in:' . implode(',', array_keys(ErrorReport::TYPES)),
            'severity' => 'required|in:' . implode(',', array_keys(ErrorReport::SEVERITIES)),
            'page_url' => 'nullable|string|max:500',
            'device_info' => 'nullable|array',
            'screenshots' => 'nullable|array',
            'screenshots.*' => 'string',
        ]);

        $report = ErrorReport::create([
            'user_id' => $request->user()->id,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'error_type' => $validated['error_type'],
            'severity' => $validated['severity'],
            'page_url' => $validated['page_url'] ?? null,
            'device_info' => $validated['device_info'] ?? null,
            'screenshots' => $validated['screenshots'] ?? null,
            'status' => ErrorReport::STATUS_PENDING,
        ]);

        return redirect()->route('error-reports.show', $report)
            ->with('success', 'Báo cáo lỗi đã được gửi thành công! Chúng tôi sẽ xem xét sớm nhất.');
    }

    public function show(Request $request, ErrorReport $errorReport): Response
    {
        $this->authorize('view', $errorReport);

        $errorReport->load(['responses.user', 'assignedAdmin']);

        return Inertia::render('ErrorReports/Show', [
            'report' => $errorReport,
            'statuses' => ErrorReport::STATUSES,
            'types' => ErrorReport::TYPES,
            'severities' => ErrorReport::SEVERITIES,
        ]);
    }

    public function addResponse(Request $request, ErrorReport $errorReport)
    {
        $this->authorize('respond', $errorReport);

        $validated = $request->validate([
            'message' => 'required|string|min:1',
            'attachments' => 'nullable|array',
        ]);

        ErrorReportResponse::create([
            'error_report_id' => $errorReport->id,
            'user_id' => $request->user()->id,
            'message' => $validated['message'],
            'is_admin_response' => false,
            'attachments' => $validated['attachments'] ?? null,
        ]);

        return back()->with('success', 'Phản hồi đã được gửi thành công!');
    }

    public function uploadScreenshot(Request $request)
    {
        $request->validate([
            'screenshot' => 'required|image|mimes:jpg,jpeg,png,gif,webp|max:5120',
        ]);

        $path = $request->file('screenshot')->store('error-reports/screenshots', 'public');

        return response()->json([
            'success' => true,
            'path' => $path,
            'url' => Storage::url($path),
        ]);
    }
}
