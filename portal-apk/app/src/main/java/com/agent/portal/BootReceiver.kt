package com.agent.portal

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.agent.portal.server.HttpServerService

/**
 * Boot receiver to start services after device restart
 */
class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "BootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.i(TAG, "Boot completed, starting services...")

            // Start HTTP server service
            val serviceIntent = Intent(context, HttpServerService::class.java)
            context.startForegroundService(serviceIntent)
        }
    }
}
