<?php

namespace App\Services;

use App\Models\Device;
use App\Models\Task;
use App\Models\TaskApplication;
use App\Models\User;
use App\Models\WorkflowJob;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class TaskService
{
    /**
     * Get open tasks with filters
     */
    public function getOpenTasks(array $filters = [], int $perPage = 12): LengthAwarePaginator
    {
        $query = Task::with(['creator', 'flow', 'dataCollection'])
            ->where('status', Task::STATUS_OPEN)
            ->notExpired()
            ->latest();

        // Search
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by tag/category
        if (!empty($filters['category']) && $filters['category'] !== 'all') {
            $query->whereJsonContains('tags', $filters['category']);
        }

        // Filter by price type
        if (!empty($filters['price_type'])) {
            if ($filters['price_type'] === 'free') {
                $query->where('reward_amount', 0);
            } elseif ($filters['price_type'] === 'paid') {
                $query->where('reward_amount', '>', 0);
            }
        }

        // Sort
        $sort = $filters['sort'] ?? 'newest';
        match ($sort) {
            'reward_high' => $query->orderByDesc('reward_amount'),
            'reward_low' => $query->orderBy('reward_amount'),
            'deadline' => $query->orderBy('deadline_at'),
            default => $query->latest(),
        };

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Get task statistics
     */
    public function getTaskStats(): array
    {
        return [
            'total_tasks' => Task::open()->count(),
            'total_free' => Task::open()->where('reward_amount', 0)->count(),
            'total_rewards' => Task::open()->sum('reward_amount'),
        ];
    }

    /**
     * Get user's campaigns for task creation
     */
    public function getCampaignsForUser(User $user)
    {
        return $user->campaigns()
            ->select('id', 'name', 'icon', 'color', 'description', 'status')
            ->withCount(['workflows', 'devices'])
            ->with(['dataCollection:id,name'])
            ->orderBy('updated_at', 'desc')
            ->get();
    }

    /**
     * Create a new task
     */
    public function createTask(User $user, array $validated): Task
    {
        $campaign = $user->campaigns()->findOrFail($validated['campaign_id']);

        // Calculate total cost
        $totalCost = $validated['price_per_device'] * $validated['required_devices'];

        // Check and deduct balance
        if ($user->wallet_balance < $totalCost) {
            throw new \Exception(__('tasks.insufficient_balance', ['required' => number_format($totalCost)]));
        }

        $user->decrement('wallet_balance', $totalCost);

        return Task::create([
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
    }

    /**
     * Get user's created tasks
     */
    public function getCreatedTasks(User $user)
    {
        return Task::with(['flow', 'applications.user', 'applications.device'])
            ->where('creator_id', $user->id)
            ->latest()
            ->get();
    }

    /**
     * Get user's accepted applications
     */
    public function getAcceptedApplications(User $user)
    {
        return TaskApplication::with(['task.creator', 'task.flow', 'device', 'workflowJob'])
            ->where('user_id', $user->id)
            ->latest()
            ->get();
    }

    /**
     * Apply to a task
     */
    public function applyToTask(User $user, Task $task, array $validated): TaskApplication
    {
        $device = Device::where('id', $validated['device_id'])
            ->where('user_id', $user->id)
            ->firstOrFail();

        // Check if device already applied
        $existing = TaskApplication::where('task_id', $task->id)
            ->where('device_id', $device->id)
            ->first();

        if ($existing) {
            throw new \Exception(__('tasks.device_already_applied'));
        }

        return TaskApplication::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'device_id' => $device->id,
            'data_collection_id' => $validated['data_collection_id'] ?? null,
            'status' => TaskApplication::STATUS_PENDING,
        ]);
    }

    /**
     * Start execution for an application
     */
    public function startExecution(Task $task, TaskApplication $application): WorkflowJob
    {
        return DB::transaction(function () use ($task, $application) {
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

            return $job;
        });
    }
}
