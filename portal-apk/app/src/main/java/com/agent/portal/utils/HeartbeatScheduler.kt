package com.agent.portal.utils

import android.content.Context
import android.util.Log
import androidx.work.*
import com.agent.portal.worker.HeartbeatWorker
import java.util.concurrent.TimeUnit

object HeartbeatScheduler {
    private const val TAG = "HeartbeatScheduler"
    
    fun schedule(context: Context) {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
        
        val heartbeatRequest = PeriodicWorkRequestBuilder<HeartbeatWorker>(
            15, TimeUnit.MINUTES
        )
            .setConstraints(constraints)
            .addTag("device_heartbeat")
            .build()
        
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            "device_heartbeat",
            ExistingPeriodicWorkPolicy.KEEP,
            heartbeatRequest
        )
        
        Log.i(TAG, "📡 Heartbeat scheduled (every 15 min)")
    }
}
