<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use App\Services\CampaignService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CampaignController extends Controller
{
    public function __construct(
        protected CampaignService $campaignService
    ) {
    }

    /**
     * Display campaigns list
     */
    public function index(Request $request)
    {
        $user = $request->user();

        return Inertia::render('Campaigns/Index', [
            'campaigns' => $this->campaignService->getCampaignsForUser($user),
            'stats' => $this->campaignService->getCampaignStats($user),
        ]);
    }

    /**
     * Show create form data
     */
    public function create(Request $request)
    {
        return Inertia::render(
            'Campaigns/Create',
            $this->campaignService->getCreateResources($request->user())
        );
    }

    /**
     * Store new campaign
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:10',
            'color' => 'nullable|string|max:20',
            'data_collection_id' => 'nullable|exists:data_collections,id',
            'workflow_configs' => 'nullable|array|min:1',
            'workflow_configs.*.flow_id' => 'required|exists:flows,id',
            'workflow_configs.*.sequence' => 'required|integer|min:0',
            'workflow_configs.*.repeat_count' => 'required|integer|min:1|max:1000',
            'workflow_configs.*.execution_mode' => 'required|in:once,repeat,conditional',
            'workflow_configs.*.delay_between_repeats' => 'nullable|integer|min:0|max:3600',
            'workflow_configs.*.variable_source_collection_id' => 'nullable|exists:data_collections,id',
            'workflow_configs.*.iteration_strategy' => 'nullable|in:sequential,random',
            'workflow_ids' => 'required_without:workflow_configs|array|min:1',
            'workflow_ids.*' => 'exists:flows,id',
            'device_ids' => 'required|array|min:1',
            'device_ids.*' => 'exists:devices,id',
            'execution_mode' => 'nullable|in:sequential,parallel',
            'records_per_batch' => 'nullable|integer|min:1|max:100',
            'repeat_per_record' => 'nullable|integer|min:1|max:100',
            'record_filter' => 'nullable|array',
            'data_config' => 'nullable|array',
            'data_config.primary' => 'nullable|array',
            'data_config.primary.collection_id' => 'nullable|exists:data_collections,id',
            'data_config.pools' => 'nullable|array',
            'records_per_device' => 'nullable|integer|min:1',
            'device_record_assignments' => 'nullable|array',
            'device_collection_assignments' => 'nullable|array',
            'device_collection_assignments.*' => 'nullable|exists:data_collections,id',
        ]);

        $campaign = $this->campaignService->createCampaign($request->user(), $validated);

        return redirect()->route('campaigns.show', $campaign)
            ->with('success', 'Campaign đã được tạo!');
    }

    /**
     * Show campaign detail
     */
    public function show(Campaign $campaign)
    {
        $this->authorize('view', $campaign);

        $campaign->load([
            'dataCollection.records' => fn($q) => $q->take(10),
            'workflows',
            'devices',
            'jobs' => fn($q) => $q->latest()->take(20),
        ]);

        return Inertia::render('Campaigns/Show', [
            'campaign' => $campaign,
        ]);
    }

    /**
     * Update campaign
     */
    public function update(Request $request, Campaign $campaign)
    {
        $this->authorize('update', $campaign);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:10',
            'color' => 'nullable|string|max:20',
            'execution_mode' => 'nullable|in:sequential,parallel',
            'records_per_batch' => 'nullable|integer|min:1|max:100',
            'repeat_per_record' => 'nullable|integer|min:1|max:100',
            'status' => 'nullable|in:draft,active,paused',
        ]);

        $campaign->update($validated);

        return back()->with('success', 'Campaign đã cập nhật!');
    }

    /**
     * Delete campaign
     */
    public function destroy(Campaign $campaign)
    {
        $this->authorize('delete', $campaign);

        $campaign->delete();

        return redirect()->route('campaigns.index')
            ->with('success', 'Campaign đã xóa!');
    }

    /**
     * Run campaign
     */
    public function run(Request $request, Campaign $campaign)
    {
        $this->authorize('update', $campaign);

        $result = $this->campaignService->runCampaign($campaign);

        if (!$result['success']) {
            return back()->with('error', $result['error']);
        }

        return back()->with('success', "🚀 Campaign đã bắt đầu! Tạo {$result['job_count']} jobs.");
    }

    /**
     * Pause campaign
     */
    public function pause(Campaign $campaign)
    {
        $this->authorize('update', $campaign);

        $campaign->update(['status' => Campaign::STATUS_PAUSED]);

        return back()->with('success', 'Campaign đã tạm dừng!');
    }
}
