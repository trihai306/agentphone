<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Device;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserDeviceController extends Controller
{
    public function index(Request $request)
    {
        $devices = Device::where('user_id', $request->user()->id)
            ->orderBy('last_active_at', 'desc')
            ->paginate(10);

        return Inertia::render('Devices/Index', [
            'devices' => $devices,
        ]);
    }

    public function create()
    {
        return Inertia::render('Devices/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'device_id' => 'required|string|unique:devices,device_id',
            'name' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'android_version' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:active,inactive,maintenance',
        ]);

        Device::create([
            ...$validated,
            'user_id' => $request->user()->id,
            'last_active_at' => now(),
        ]);

        return redirect()->route('devices.index')
            ->with('success', 'Device added successfully!');
    }

    public function edit(Device $device)
    {
        abort_if($device->user_id !== auth()->id(), 403, 'Unauthorized');

        return Inertia::render('Devices/Edit', [
            'device' => $device,
        ]);
    }

    public function update(Request $request, Device $device)
    {
        abort_if($device->user_id !== auth()->id(), 403, 'Unauthorized');

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'android_version' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:active,inactive,maintenance',
        ]);

        $device->update($validated);

        return redirect()->route('devices.index')
            ->with('success', 'Device updated successfully!');
    }

    public function destroy(Device $device)
    {
        abort_if($device->user_id !== auth()->id(), 403, 'Unauthorized');

        $device->delete();

        return redirect()->route('devices.index')
            ->with('success', 'Device deleted successfully!');
    }
}
