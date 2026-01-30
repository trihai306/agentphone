<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use App\Models\DataCollection;
use App\Models\Device;
use App\Models\Flow;
use App\Models\Task;
use App\Models\TaskApplication;
use App\Models\WorkflowJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TaskController extends Controller
{
    /**
     * Display list of open tasks
     */
    public function index(Request $request)
    {
        $query = Task::with(['creator', 'flow', 'dataCollection'])
            ->where('status', Task::STATUS_OPEN)
            ->notExpired()
            ->latest();

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by tag/category
        if ($request->filled('category') && $request->category !== 'all') {
            $query->whereJsonContains('tags', $request->category);
        }

        // Filter by price type
        if ($request->filled('price_type')) {
            if ($request->price_type === 'free') {
                $query->where('reward_amount', 0);
            } elseif ($request->price_type === 'paid') {
                $query->where('reward_amount', '>', 0);
            }
        }

        // Sort
        $sort = $request->input('sort', 'newest');
        match ($sort) {
            'reward_high' => $query->orderByDesc('reward_amount'),
            'reward_low' => $query->orderBy('reward_amount'),
            'deadline' => $query->orderBy('deadline_at'),
            default => $query->latest(),
        };

        $tasks = $query->paginate(12)->withQueryString();

        // Stats
        $stats = [
            'total_tasks' => Task::open()->count(),
            'total_free' => Task::open()->where('reward_amount', 0)->count(),
            'total_rewards' => Task::open()->sum('reward_amount'),
        ];

        return Inertia::render('Tasks/Index', [
            'tasks' => $tasks,
            'filters' => $request->only(['search', 'category', 'price_type', 'sort']),
            'stats' => $stats,
        ]);
    }

    /**
     * Show create task form
     */
    public function create(Request $request)
    {
        $user = $request->user();

        // Get user's campaigns with workflow and device counts
        $campaigns = $user->campaigns()
            ->select('id', 'name', 'icon', 'color', 'description', 'status')
            ->withCount(['workflows', 'devices'])
            ->with(['dataCollection:id,name'])
            ->orderBy('updated_at', 'desc')
            ->get();

        return Inertia::render('Tasks/Create', [
            'campaigns' => $campaigns,
        ]);
    }

    /**
     * Store a new task
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'campaign_id' => 'required|exists:campaigns,id',
            'tags' => 'nullable|array',
            'reward_amount' => 'required|integer|min:1000', // Minimum 1000 VND
            'price_per_device' => 'required|integer|min:100', // Price per device
            'required_devices' => 'required|integer|min:1|max:100',
            'deadline_at' => 'nullable|date|after:now',
        ]);

        // Verify user owns the campaign
        $campaign = Campaign::where('id', $validated['campaign_id'])
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        // Calculate total cost
        $totalCost = $validated['price_per_device'] * $validated['required_devices'];

        // Check user has enough balance
        $user = $request->user();
        if ($user->wallet_balance < $totalCost) {
            return back()->withErrors([
                'reward_amount' => __('tasks.insufficient_balance', ['required' => number_format($totalCost)]),
            ]);
        }

        // Deduct from wallet
        $user->decrement('wallet_balance', $totalCost);

        $task = Task::create([
            'creator_id' => $user->id,
            'campaign_id' => $campaign->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'icon' => $campaign->icon,
            'color' => $campaign->color,
            'tags' => $validated['tags'] ?? [],
            'reward_amount' => $totalCost,
            'required_devices' => $validated['required_devices'],
            'execution_config' => [
                'price_per_device' => $validated['price_per_device'],
            ],
            'deadline_at' => $validated['deadline_at'] ?? null,
            'status' => Task::STATUS_OPEN,
        ]);

        return redirect()->route('tasks.show', $task)
            ->with('success', __('tasks.created_success'));
    }

    /**
     * Show task details
     */
    public function show(Task $task)
    {
        $task->load([
            'creator',
            'flow',
            'dataCollection',
            'applications' => function ($query) {
                $query->with(['user', 'device'])->latest();
            },
        ]);

        $user = auth()->user();
        $userApplication = null;
        $userDevices = [];

        if ($user) {
            $userApplication = $task->applications()->where('user_id', $user->id)->first();
            $userDevices = $user->devices()->select('id', 'name', 'brand', 'model')->get();
        }

        return Inertia::render('Tasks/Show', [
            'task' => $task,
            'userApplication' => $userApplication,
            'userDevices' => $userDevices,
            'canApply' => $user && $task->canApply($user),
            'isCreator' => $user && $task->creator_id === $user->id,
        ]);
    }

    /**
     * My tasks page (created + accepted)
     */
    public function myTasks(Request $request)
    {
        $user = $request->user();

        $createdTasks = Task::with(['flow', 'applications.user', 'applications.device'])
            ->where('creator_id', $user->id)
            ->latest()
            ->get();

        $acceptedApplications = TaskApplication::with(['task.creator', 'task.flow', 'device', 'workflowJob'])
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        return Inertia::render('Tasks/MyTasks', [
            'createdTasks' => $createdTasks,
            'acceptedApplications' => $acceptedApplications,
        ]);
    }

    /**
     * Apply to a task
     */
    public function apply(Request $request, Task $task)
    {
        $user = $request->user();

        if (!$task->canApply($user)) {
            return back()->with('error', __('tasks.cannot_apply'));
        }

        $validated = $request->validate([
            'device_id' => 'required|exists:devices,id',
            'data_collection_id' => $task->user_provides_data ? 'required|exists:data_collections,id' : 'nullable',
        ]);

        // Verify user owns the device
        $device = Device::where('id', $validated['device_id'])
            ->where('user_id', $user->id)
            ->firstOrFail();

        // Check if device already applied
        $existing = TaskApplication::where('task_id', $task->id)
            ->where('device_id', $device->id)
            ->first();

        if ($existing) {
            return back()->with('error', __('tasks.device_already_applied'));
        }

        TaskApplication::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'device_id' => $device->id,
            'data_collection_id' => $validated['data_collection_id'] ?? null,
            'status' => TaskApplication::STATUS_PENDING,
        ]);

        return back()->with('success', __('tasks.applied_success'));
    }

    /**
     * Handle application (accept/reject)
     */
    public function handleApplication(Request $request, Task $task, TaskApplication $application)
    {
        // Only creator can handle applications
        if ($task->creator_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'action' => 'required|in:accept,reject',
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        if ($validated['action'] === 'accept') {
            $application->accept();
            return back()->with('success', __('tasks.application_accepted'));
        } else {
            $application->reject($validated['rejection_reason'] ?? null);
            return back()->with('success', __('tasks.application_rejected'));
        }
    }

    /**
     * Start execution for an accepted application
     */
    public function startExecution(Request $request, Task $task, TaskApplication $application)
    {
        // Verify ownership
        if ($application->user_id !== $request->user()->id) {
            abort(403);
        }

        if (!$application->canStart()) {
            return back()->with('error', __('tasks.cannot_start'));
        }

        DB::transaction(function () use ($task, $application) {
            // Create workflow job
            $job = WorkflowJob::create([
                'user_id' => $application->user_id,
                'flow_id' => $task->flow_id,
                'device_id' => $application->device_id,
                'data_collection_id' => $application->data_collection_id ?? $task->data_collection_id,
                'name' => "Task: {$task->title}",
                'status' => WorkflowJob::STATUS_PENDING,
                'config' => $task->execution_config ?? [],
            ]);

            $application->markAsRunning($job);
        });

        return back()->with('success', __('tasks.execution_started'));
    }

    /**
     * Cancel a task (creator only)
     */
    public function cancel(Request $request, Task $task)
    {
        if ($task->creator_id !== $request->user()->id) {
            abort(403);
        }

        $task->update(['status' => Task::STATUS_CANCELLED]);

        return back()->with('success', __('tasks.cancelled'));
    }
}
