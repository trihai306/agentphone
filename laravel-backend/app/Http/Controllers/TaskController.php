<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskApplication;
use App\Services\TaskService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TaskController extends Controller
{
    public function __construct(
        protected TaskService $taskService
    ) {
    }

    /**
     * Display list of open tasks
     */
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'category', 'price_type', 'sort']);

        return Inertia::render('Tasks/Index', [
            'tasks' => $this->taskService->getOpenTasks($filters),
            'filters' => $filters,
            'stats' => $this->taskService->getTaskStats(),
        ]);
    }

    /**
     * Show create task form
     */
    public function create(Request $request)
    {
        return Inertia::render('Tasks/Create', [
            'campaigns' => $this->taskService->getCampaignsForUser($request->user()),
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
            'reward_amount' => 'required|integer|min:1000',
            'price_per_device' => 'required|integer|min:100',
            'required_devices' => 'required|integer|min:1|max:100',
            'deadline_at' => 'nullable|date|after:now',
        ]);

        try {
            $task = $this->taskService->createTask($request->user(), $validated);
            return redirect()->route('tasks.show', $task)
                ->with('success', __('tasks.created_success'));
        } catch (\Exception $e) {
            return back()->withErrors(['reward_amount' => $e->getMessage()]);
        }
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
            'applications' => fn($query) => $query->with(['user', 'device'])->latest(),
        ]);

        $user = auth()->user();

        return Inertia::render('Tasks/Show', [
            'task' => $task,
            'userApplication' => $user ? $task->applications()->where('user_id', $user->id)->first() : null,
            'userDevices' => $user ? $user->devices()->select('id', 'name', 'brand', 'model')->get() : [],
            'canApply' => $user && $task->canApply($user),
            'isCreator' => $user && $task->creator_id === $user->id,
        ]);
    }

    /**
     * My tasks page
     */
    public function myTasks(Request $request)
    {
        $user = $request->user();

        return Inertia::render('Tasks/MyTasks', [
            'createdTasks' => $this->taskService->getCreatedTasks($user),
            'acceptedApplications' => $this->taskService->getAcceptedApplications($user),
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

        try {
            $this->taskService->applyToTask($user, $task, $validated);
            return back()->with('success', __('tasks.applied_success'));
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Handle application (accept/reject)
     */
    public function handleApplication(Request $request, Task $task, TaskApplication $application)
    {
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
     * Start execution
     */
    public function startExecution(Request $request, Task $task, TaskApplication $application)
    {
        if ($application->user_id !== $request->user()->id) {
            abort(403);
        }

        if (!$application->canStart()) {
            return back()->with('error', __('tasks.cannot_start'));
        }

        $this->taskService->startExecution($task, $application);

        return back()->with('success', __('tasks.execution_started'));
    }

    /**
     * Cancel a task
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
