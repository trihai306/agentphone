<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeviceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'device_id' => $this->device_id,
            'name' => $this->name,
            'model' => $this->model,
            'android_version' => $this->android_version,
            'status' => $this->status,
            'is_online' => $this->isOnline(),
            'last_active_at' => $this->last_active_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),

            // Include activity logs if loaded
            'activity_logs' => DeviceActivityLogResource::collection($this->whenLoaded('activityLogs')),
        ];
    }

}
