<?php

namespace App\Http\Controllers;

use App\Events\RecordingEventReceived;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class RecordingController extends Controller
{
    /**
     * Receive real-time recording event from APK device
     * Broadcasts event to web flow editor via socket
     */
    public function receiveEvent(Request $request)
    {
        $validated = $request->validate([
            'device_id' => 'required|string',
            'flow_id' => 'nullable|integer',
            'event_type' => 'required|string',
            'event_data' => 'required|array',
            'timestamp' => 'required|integer',
        ]);

        Log::info('Recording event received', [
            'device' => $validated['device_id'],
            'type' => $validated['event_type'],
        ]);

        // Broadcast to web listeners via socket
        broadcast(new RecordingEventReceived(
            $validated['device_id'],
            $validated['flow_id'],
            $validated['event_type'],
            $validated['event_data'],
            $validated['timestamp']
        ));

        return response()->json([
            'success' => true,
            'message' => 'Event broadcasted',
        ]);
    }
}
