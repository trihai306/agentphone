package com.agent.portal

import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.LinearInterpolator
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.agent.portal.accessibility.PortalAccessibilityService
import com.agent.portal.databinding.ActivityMainBinding
import com.agent.portal.overlay.OverlayService
import com.agent.portal.recording.RecordingManager

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val handler = Handler(Looper.getMainLooper())
    private var isRefreshing = false

    // Track previous states for animation optimization
    private var prevA11yEnabled: Boolean? = null
    private var prevKeyboardState: Int? = null
    private var prevOverlayEnabled: Boolean? = null

    // Recording listener to sync UI when recording stops from floating bubble
    private val recordingListener = object : RecordingManager.RecordingListener {
        override fun onRecordingStarted(recordingId: String, targetApp: String?) {
            runOnUiThread { updateRecordingUI() }
        }
        override fun onRecordingStopped(result: RecordingManager.RecordingResult) {
            Log.i(TAG, "Recording stopped callback received - updating UI")
            runOnUiThread { 
                updateRecordingUI()
                stopRecordingPulseAnimation()
            }
        }
        override fun onRecordingError(error: String, exception: Throwable?) {
            Log.e(TAG, "Recording error: $error", exception)
        }
        override fun onEventAdded(event: com.agent.portal.recording.RecordedEvent, totalCount: Int) {
            runOnUiThread {
                binding.tvEventCount.text = "$totalCount events"
            }
        }
        override fun onRecordingPaused(recordingId: String) {
            runOnUiThread { updateRecordingUI() }
        }
        override fun onRecordingResumed(recordingId: String) {
            runOnUiThread { updateRecordingUI() }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Check authentication
        val sessionManager = com.agent.portal.auth.SessionManager(this)
        if (!sessionManager.isLoggedIn()) {
            Log.w("MainActivity", "User not authenticated, redirecting to LoginActivity")
            val intent = Intent(this, LoginActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(intent)
            finish()
            return
        }

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Set toolbar as ActionBar for menu to work
        setSupportActionBar(binding.toolbar)

        // Initialize RecordingManager
        RecordingManager.init(this)

        // Initialize Socket connection
        initializeSocket()

        setupUserInfo()
        setupConnectionCard()
        setupJobMonitor()
        setupQuickActions()
        setupRecordingControls()
        setupDeveloperTools()
        updateStatus()

        // Update device info on backend
        updateDeviceOnBackend()

        // Schedule periodic heartbeat
        com.agent.portal.utils.HeartbeatScheduler.schedule(this)

        // Register recording listener to sync UI when recording stops from floating bubble
        RecordingManager.addListener(recordingListener)
        Log.i(TAG, "Recording listener registered")
    }

    private fun initializeSocket() {
        if (com.agent.portal.socket.SocketJobManager.isConnected()) {
            Log.d("MainActivity", "Socket already connected")
            return
        }

        try {
            val appKey = "clickai-key"
            val socketUrl = com.agent.portal.utils.NetworkUtils.getSocketUrl()
            val host = com.agent.portal.utils.NetworkUtils.getSocketHost()
            val port = com.agent.portal.utils.NetworkUtils.getSocketPort()
            val encrypted = com.agent.portal.utils.NetworkUtils.isSocketEncrypted()

            Log.i("MainActivity", "Initializing Pusher connection: $host:$port (encrypted: $encrypted)")

            com.agent.portal.socket.SocketJobManager.init(
                context = this,
                appKey = appKey,
                host = host,
                port = port,
                encrypted = encrypted
            )
            com.agent.portal.socket.SocketJobManager.connect()

            Log.i("MainActivity", "✅ Pusher connection initiated")
        } catch (e: Exception) {
            Log.e("MainActivity", "❌ Socket initialization error: ${e.message}", e)
        }
    }

    private fun updateDeviceOnBackend() {
        val sessionManager = com.agent.portal.auth.SessionManager(this)
        val session = sessionManager.getSession() ?: return

        Thread {
            try {
                val deviceService = com.agent.portal.auth.DeviceRegistrationService(this@MainActivity)
                val result = kotlinx.coroutines.runBlocking {
                    deviceService.registerDevice(session.token)
                }

                if (result.success) {
                    Log.i("MainActivity", "✅ Device info updated on backend: ${result.device?.name}")
                } else {
                    Log.w("MainActivity", "⚠️ Device update failed: ${result.message}")
                }
            } catch (e: Exception) {
                Log.e("MainActivity", "❌ Error updating device: ${e.message}", e)
            }
        }.start()
    }

    private fun setupUserInfo() {
        val sessionManager = com.agent.portal.auth.SessionManager(this)
        val session = sessionManager.getSession()

        session?.let {
            binding.tvUserName.text = it.userName ?: "User"
            binding.tvUserEmail.text = it.userEmail
            val initials = (it.userName ?: it.userEmail).firstOrNull()?.uppercase() ?: "U"
            binding.tvUserInitials.text = initials
        } ?: run {
            binding.tvUserName.text = "Guest"
            binding.tvUserEmail.text = "Not logged in"
            binding.tvUserInitials.text = "G"
        }

        // Device ID
        val prefs = getSharedPreferences("portal_device", Context.MODE_PRIVATE)
        val deviceId = prefs.getString("unique_device_id", null) ?: run {
            val androidId = android.provider.Settings.Secure.getString(
                contentResolver,
                android.provider.Settings.Secure.ANDROID_ID
            )
            val uniqueSuffix = java.util.UUID.randomUUID().toString().take(8)
            val newDeviceId = "${androidId}_$uniqueSuffix"
            prefs.edit().putString("unique_device_id", newDeviceId).apply()
            newDeviceId
        }
        binding.tvDeviceId.text = "ID: $deviceId"

        // Copy button
        binding.btnCopyDeviceId.setOnClickListener {
            val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
            val clip = android.content.ClipData.newPlainText("Device ID", deviceId)
            clipboard.setPrimaryClip(clip)
            Toast.makeText(this, "✓ Device ID copied", Toast.LENGTH_SHORT).show()
            it.animate().scaleX(0.8f).scaleY(0.8f).setDuration(100).withEndAction {
                it.animate().scaleX(1f).scaleY(1f).setDuration(100).start()
            }.start()
        }

        setupSocketStatus()
    }

    private fun setupSocketStatus() {
        val socketListener = object : com.agent.portal.socket.JobListener {
            override fun onConnected() {
                runOnUiThread { updateConnectionBadge(true) }
            }

            override fun onDisconnected() {
                runOnUiThread { updateConnectionBadge(false) }
            }

            override fun onConnectionError(error: String) {
                runOnUiThread { updateConnectionBadge(false) }
            }

            override fun onJobReceived(job: com.agent.portal.socket.Job) {
                runOnUiThread { showActiveJob(job) }
            }

            override fun onJobStarted(job: com.agent.portal.socket.Job) {
                runOnUiThread { showActiveJob(job) }
            }

            override fun onJobCompleted(job: com.agent.portal.socket.Job, result: com.agent.portal.socket.JobResult) {
                runOnUiThread {
                    hideActiveJob()
                    fetchJobStats()
                }
            }

            override fun onJobFailed(job: com.agent.portal.socket.Job, error: String) {
                runOnUiThread {
                    hideActiveJob()
                    fetchJobStats()
                }
            }

            override fun onJobCancelled(jobId: String) {
                runOnUiThread { hideActiveJob() }
            }

            override fun onConfigUpdate(config: String) {}
        }

        com.agent.portal.socket.SocketJobManager.addJobListener(socketListener)

        val status = com.agent.portal.socket.SocketJobManager.getStatus()
        updateConnectionBadge(status.connected)
    }

    private fun updateConnectionBadge(connected: Boolean) {
        if (connected) {
            binding.indicatorConnection.setBackgroundResource(R.drawable.status_indicator_on)
            binding.tvConnectionStatus.text = "Connected"
            binding.tvConnectionStatus.setTextColor(getColor(R.color.accent_green))
            binding.badgeConnected.backgroundTintList = ContextCompat.getColorStateList(this, R.color.accent_green_container)
        } else {
            binding.indicatorConnection.setBackgroundResource(R.drawable.status_indicator_off)
            binding.tvConnectionStatus.text = "Offline"
            binding.tvConnectionStatus.setTextColor(getColor(R.color.text_tertiary))
            binding.badgeConnected.backgroundTintList = ContextCompat.getColorStateList(this, R.color.surface_elevated)
        }
    }

    private fun setupConnectionCard() {
        // Setup clickable status indicators for permissions
        binding.statusAccessibilityContainer.setOnClickListener {
            if (!PortalAccessibilityService.isRunning()) {
                openAccessibilitySettings()
            } else {
                Toast.makeText(this, "Accessibility is enabled", Toast.LENGTH_SHORT).show()
            }
        }

        binding.statusKeyboardContainer.setOnClickListener {
            if (!isKeyboardEnabled()) {
                openKeyboardSettings()
            } else if (!isKeyboardSelected()) {
                showInputMethodPicker()
            } else {
                Toast.makeText(this, "Keyboard is active", Toast.LENGTH_SHORT).show()
            }
        }

        binding.statusOverlayContainer.setOnClickListener {
            if (!Settings.canDrawOverlays(this)) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:$packageName")
                )
                startActivity(intent)
            } else {
                Toast.makeText(this, "Overlay permission granted", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun setupJobMonitor() {
        binding.btnRefreshJobs.setOnClickListener {
            it.animate()
                .rotation(it.rotation + 360f)
                .setDuration(500)
                .setInterpolator(AccelerateDecelerateInterpolator())
                .start()
            fetchJobStats()
        }

        // Initial state - show idle
        hideActiveJob()
        fetchJobStats()
    }

    private fun showActiveJob(job: com.agent.portal.socket.Job) {
        binding.cardActiveJob.visibility = View.VISIBLE
        binding.layoutIdleState.visibility = View.GONE
        binding.tvActiveJobName.text = job.workflowName ?: "Running workflow..."
        binding.tvActiveJobStep.text = "Processing ${job.type}..."
        binding.progressJob.isIndeterminate = true
    }

    private fun hideActiveJob() {
        binding.cardActiveJob.visibility = View.GONE
        binding.layoutIdleState.visibility = View.VISIBLE
    }

    private fun fetchJobStats() {
        val sessionManager = com.agent.portal.auth.SessionManager(this)
        val session = sessionManager.getSession() ?: return

        val apiUrl = com.agent.portal.utils.NetworkUtils.getApiBaseUrl()

        Thread {
            try {
                val client = okhttp3.OkHttpClient.Builder()
                    .connectTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
                    .readTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
                    .build()

                val request = okhttp3.Request.Builder()
                    .url("$apiUrl/jobs/stats/today")
                    .addHeader("Authorization", "Bearer ${session.token}")
                    .addHeader("Accept", "application/json")
                    .build()

                val response = client.newCall(request).execute()
                val responseBody = response.body?.string()

                if (response.isSuccessful && responseBody != null) {
                    val json = org.json.JSONObject(responseBody)
                    val data = json.optJSONObject("data")

                    if (data != null) {
                        val completed = data.optInt("completed", 0)
                        val failed = data.optInt("failed", 0)

                        runOnUiThread {
                            binding.tvJobsCompleted.text = completed.toString()
                            binding.tvJobsFailed.text = failed.toString()
                        }
                    }
                }
                response.close()
            } catch (e: Exception) {
                Log.e("MainActivity", "Error fetching job stats", e)
            }
        }.start()
    }

    private fun setupQuickActions() {
        binding.btnRefresh.setOnClickListener {
            updateStatus()
            Toast.makeText(this, "Status refreshed", Toast.LENGTH_SHORT).show()
        }

        binding.btnJobHistory.setOnClickListener {
            // Open job history (could navigate to a web view or new activity)
            Toast.makeText(this, "Opening job history...", Toast.LENGTH_SHORT).show()
        }
    }

    private fun setupRecordingControls() {
        // Initialize UI based on current recording state
        updateRecordingUI()

        // Start Recording Button - Check workflow listener first, then show App Chooser
        binding.btnStartRecording.setOnClickListener {
            Log.i("MainActivity", "=== START RECORDING BUTTON CLICKED ===")
            
            if (!checkRecordingPrerequisites()) {
                Log.w("MainActivity", "checkRecordingPrerequisites() returned FALSE")
                return@setOnClickListener
            }
            
            Log.i("MainActivity", "checkRecordingPrerequisites() PASSED - checking workflow listener")

            // Check if workflow editor is listening before showing app chooser
            checkWorkflowListener { isListening, message ->
                if (!isListening) {
                    Log.w("MainActivity", "No workflow listener: $message")
                    runOnUiThread {
                        Toast.makeText(
                            this,
                            "❌ $message",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                    return@checkWorkflowListener
                }

                Log.i("MainActivity", "Workflow listener confirmed - showing AppChooserDialog")

                runOnUiThread {
                    // Show app chooser dialog
                    val appChooser = AppChooserDialog(this) { selectedApp ->
                        Log.i("MainActivity", "App selected for recording: ${selectedApp.packageName}")

                        // Start recording with selected app
                        RecordingManager.startRecording(selectedApp.packageName)
                        updateRecordingUI()

                        // Launch the selected app with fresh start
                        try {
                            // Force-stop the app first to ensure fresh start
                            val activityManager = getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
                            try {
                                activityManager.killBackgroundProcesses(selectedApp.packageName)
                                Log.i("MainActivity", "Killed background processes for: ${selectedApp.packageName}")
                            } catch (e: Exception) {
                                Log.w("MainActivity", "Could not kill background processes: ${e.message}")
                            }
                            
                            // Small delay to allow app to fully terminate
                            android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                                val launchIntent = packageManager.getLaunchIntentForPackage(selectedApp.packageName)
                                if (launchIntent != null) {
                                    // Clear task and start fresh
                                    launchIntent.addFlags(
                                        Intent.FLAG_ACTIVITY_NEW_TASK or 
                                        Intent.FLAG_ACTIVITY_CLEAR_TASK or
                                        Intent.FLAG_ACTIVITY_CLEAR_TOP
                                    )
                                    startActivity(launchIntent)
                                    Log.i("MainActivity", "Launched app (fresh start): ${selectedApp.packageName}")
                                } else {
                                    Log.w("MainActivity", "No launch intent for: ${selectedApp.packageName}")
                                }
                            }, 200) // 200ms delay for app to terminate
                        } catch (e: Exception) {
                            Log.e("MainActivity", "Failed to launch app: ${e.message}", e)
                        }

                        // Start floating recording service for visual feedback
                        val intent = Intent(this, com.agent.portal.overlay.FloatingRecordingService::class.java).apply {
                            action = com.agent.portal.overlay.FloatingRecordingService.ACTION_SHOW
                        }
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            startForegroundService(intent)
                        } else {
                            startService(intent)
                        }

                        Toast.makeText(this, "🎬 Recording ${selectedApp.appName}...", Toast.LENGTH_SHORT).show()
                    }
                    appChooser.show()
                }
            }
        }

        // Pause/Resume Button
        binding.btnPauseRecording.setOnClickListener {
            val state = RecordingManager.getState()
            when (state) {
                RecordingManager.RecordingState.RECORDING -> {
                    RecordingManager.pauseRecording()
                    binding.btnPauseRecording.text = "Resume"
                    binding.btnPauseRecording.setIconResource(R.drawable.ic_play)
                    Toast.makeText(this, "⏸ Recording paused", Toast.LENGTH_SHORT).show()
                }
                RecordingManager.RecordingState.PAUSED -> {
                    RecordingManager.resumeRecording()
                    binding.btnPauseRecording.text = "Pause"
                    binding.btnPauseRecording.setIconResource(R.drawable.ic_pause)
                    Toast.makeText(this, "▶ Recording resumed", Toast.LENGTH_SHORT).show()
                }
                else -> {}
            }
            updateRecordingUI()
        }

        // Stop Recording Button
        binding.btnStopRecording.setOnClickListener {
            val eventCount = RecordingManager.getEventCount()
            RecordingManager.stopRecording()
            updateRecordingUI()

            // Stop floating recording service
            stopService(Intent(this, com.agent.portal.overlay.FloatingRecordingService::class.java))

            Toast.makeText(this, "⏹ Recording stopped - $eventCount events", Toast.LENGTH_SHORT).show()
        }
    }

    private fun updateRecordingUI() {
        val state = RecordingManager.getState()
        val eventCount = RecordingManager.getEventCount()

        when (state) {
            RecordingManager.RecordingState.IDLE -> {
                binding.btnStartRecording.visibility = View.VISIBLE
                binding.layoutRecordingActive.visibility = View.GONE
                binding.recordingDot.visibility = View.GONE
                stopRecordingPulseAnimation()
            }
            RecordingManager.RecordingState.RECORDING -> {
                binding.btnStartRecording.visibility = View.GONE
                binding.layoutRecordingActive.visibility = View.VISIBLE
                binding.recordingDot.visibility = View.VISIBLE
                binding.recordingDot.setBackgroundResource(R.drawable.status_indicator_on)
                binding.tvRecordingStatus.text = "Recording..."
                binding.tvRecordingStatus.setTextColor(getColor(R.color.accent_green))
                binding.tvEventCount.text = "$eventCount events"
                binding.btnPauseRecording.text = "Pause"
                binding.btnPauseRecording.setIconResource(R.drawable.ic_pause)
                startRecordingPulseAnimation()
            }
            RecordingManager.RecordingState.PAUSED -> {
                binding.btnStartRecording.visibility = View.GONE
                binding.layoutRecordingActive.visibility = View.VISIBLE
                binding.recordingDot.visibility = View.VISIBLE
                binding.recordingDot.setBackgroundResource(R.drawable.status_indicator_warning)
                binding.tvRecordingStatus.text = "Paused"
                binding.tvRecordingStatus.setTextColor(getColor(R.color.accent_orange))
                binding.tvEventCount.text = "$eventCount events"
                binding.btnPauseRecording.text = "Resume"
                binding.btnPauseRecording.setIconResource(R.drawable.ic_play)
                stopRecordingPulseAnimation()
            }
        }
    }

    private var recordingPulseAnimator: ObjectAnimator? = null

    private fun startRecordingPulseAnimation() {
        recordingPulseAnimator?.cancel()
        recordingPulseAnimator = ObjectAnimator.ofFloat(binding.recordingPulse, "alpha", 1f, 0.3f).apply {
            duration = 500
            repeatCount = ValueAnimator.INFINITE
            repeatMode = ValueAnimator.REVERSE
            interpolator = LinearInterpolator()
            start()
        }
    }

    private fun stopRecordingPulseAnimation() {
        recordingPulseAnimator?.cancel()
        binding.recordingPulse.alpha = 1f
    }

    private fun checkRecordingPrerequisites(): Boolean {
        if (!PortalAccessibilityService.isRunning()) {
            Toast.makeText(this, "Please enable Accessibility Service first", Toast.LENGTH_SHORT).show()
            openAccessibilitySettings()
            return false
        }
        return true
    }

    private fun setupDeveloperTools() {
        // Initialize switch states from OverlayService
        binding.switchBounds.isChecked = OverlayService.showBounds
        binding.switchIndexes.isChecked = OverlayService.showIndexes
        updateToggleContainerState(binding.toggleBoundsContainer, OverlayService.showBounds, R.color.accent_blue_container)
        updateToggleContainerState(binding.toggleIndexesContainer, OverlayService.showIndexes, R.color.accent_purple_container)

        // Show Bounds Toggle
        binding.switchBounds.setOnCheckedChangeListener { view, isChecked ->
            if (view.isPressed) {
                if (!checkOverlayPrerequisites()) {
                    binding.switchBounds.isChecked = false
                    return@setOnCheckedChangeListener
                }

                if (isChecked) {
                    startOverlayServiceAction(OverlayService.Actions.SHOW_BOUNDS)
                } else {
                    startOverlayServiceAction(OverlayService.Actions.HIDE_BOUNDS)
                }
                updateToggleContainerState(binding.toggleBoundsContainer, isChecked, R.color.accent_blue_container)
                animateToggle(view)
            }
        }

        // Show Indexes Toggle
        binding.switchIndexes.setOnCheckedChangeListener { view, isChecked ->
            if (view.isPressed) {
                if (!checkOverlayPrerequisites()) {
                    binding.switchIndexes.isChecked = false
                    return@setOnCheckedChangeListener
                }

                if (isChecked) {
                    startOverlayServiceAction(OverlayService.Actions.SHOW_INDEXES)
                } else {
                    startOverlayServiceAction(OverlayService.Actions.HIDE_INDEXES)
                }
                updateToggleContainerState(binding.toggleIndexesContainer, isChecked, R.color.accent_purple_container)
                animateToggle(view)
            }
        }
    }

    private fun updateToggleContainerState(container: View, isActive: Boolean, activeColorRes: Int) {
        if (isActive) {
            container.setBackgroundResource(R.drawable.toggle_container_active)
            container.backgroundTintList = ContextCompat.getColorStateList(this, activeColorRes)
        } else {
            container.setBackgroundResource(R.drawable.toggle_container_background)
            container.backgroundTintList = null
        }
    }

    private fun checkOverlayPrerequisites(): Boolean {
        if (!PortalAccessibilityService.isRunning()) {
            Toast.makeText(this, "Please enable Accessibility Service first", Toast.LENGTH_SHORT).show()
            openAccessibilitySettings()
            return false
        }

        if (!Settings.canDrawOverlays(this)) {
            Toast.makeText(this, "Please grant Overlay permission first", Toast.LENGTH_SHORT).show()
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:$packageName")
            )
            startActivity(intent)
            return false
        }

        return true
    }

    /**
     * Check if workflow editor is listening for this device via backend API
     * @param callback (isListening: Boolean, message: String) -> Unit
     */
    private fun checkWorkflowListener(callback: (Boolean, String) -> Unit) {
        val sessionManager = com.agent.portal.auth.SessionManager(this)
        val session = sessionManager.getSession()
        
        if (session == null) {
            callback(false, "Not logged in. Please login first.")
            return
        }

        val prefs = getSharedPreferences("portal_device", Context.MODE_PRIVATE)
        val deviceId = prefs.getString("unique_device_id", null)
        
        if (deviceId.isNullOrEmpty()) {
            callback(false, "Device not registered. Restart app to register device.")
            return
        }
        
        val apiUrl = com.agent.portal.utils.NetworkUtils.getApiBaseUrl()

        Thread {
            try {
                val client = okhttp3.OkHttpClient.Builder()
                    .connectTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
                    .readTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
                    .build()

                val requestBody = okhttp3.FormBody.Builder()
                    .add("device_id", deviceId)
                    .build()

                val request = okhttp3.Request.Builder()
                    .url("$apiUrl/recording-listener/check")
                    .addHeader("Authorization", "Bearer ${session.token}")
                    .addHeader("Accept", "application/json")
                    .post(requestBody)
                    .build()

                val response = client.newCall(request).execute()
                val responseBody = response.body?.string()

                if (response.isSuccessful && responseBody != null) {
                    val json = org.json.JSONObject(responseBody)
                    val isListening = json.optBoolean("is_listening", false)
                    val message = json.optString("message", "No workflow editor listening")
                    
                    Log.i("MainActivity", "checkWorkflowListener: isListening=$isListening, message=$message")
                    callback(isListening, message)
                } else {
                    Log.w("MainActivity", "checkWorkflowListener API failed: ${response.code}")
                    callback(false, "Failed to check workflow status (${response.code})")
                }
                response.close()
            } catch (e: Exception) {
                Log.e("MainActivity", "checkWorkflowListener error", e)
                callback(false, "Network error: ${e.message}")
            }
        }.start()
    }

    private fun startOverlayServiceAction(action: String) {
        val intent = Intent(this, OverlayService::class.java).apply {
            this.action = action
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }

    private fun animateToggle(view: View) {
        view.animate()
            .scaleX(1.1f)
            .scaleY(1.1f)
            .setDuration(100)
            .withEndAction {
                view.animate()
                    .scaleX(1f)
                    .scaleY(1f)
                    .setDuration(100)
                    .start()
            }
            .start()
    }

    override fun onResume() {
        super.onResume()
        updateStatus()
    }

    override fun onCreateOptionsMenu(menu: Menu?): Boolean {
        menuInflater.inflate(R.menu.main_menu, menu)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_settings -> {
                startActivity(Intent(this, SettingsActivity::class.java))
                true
            }
            R.id.action_device_info -> {
                startActivity(Intent(this, DeviceInfoActivity::class.java))
                true
            }
            R.id.action_logout -> {
                performLogout()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }

    private fun performLogout() {
        Log.i("MainActivity", "User logging out")

        try {
            com.agent.portal.socket.SocketJobManager.disconnect()
        } catch (e: Exception) {
            Log.e("MainActivity", "Error disconnecting socket: ${e.message}", e)
        }

        try {
            val deviceService = com.agent.portal.auth.DeviceRegistrationService(this)
            deviceService.clearDeviceInfo()
        } catch (e: Exception) {
            Log.e("MainActivity", "Error clearing device info: ${e.message}", e)
        }

        val sessionManager = com.agent.portal.auth.SessionManager(this)
        sessionManager.clearSession()

        Toast.makeText(this, "Logged out", Toast.LENGTH_SHORT).show()

        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacksAndMessages(null)
        // Unregister recording listener to prevent memory leaks
        RecordingManager.removeListener(recordingListener)
        Log.i(TAG, "Recording listener unregistered")
    }

    private fun updateStatus() {
        // Accessibility status
        val a11yEnabled = PortalAccessibilityService.isRunning()
        binding.statusAccessibility.text = if (a11yEnabled) "Access" else "⚠ Access"
        binding.statusAccessibility.setTextColor(
            ContextCompat.getColor(this, if (a11yEnabled) R.color.accent_green else R.color.status_warning)
        )
        binding.indicatorAccessibility.setBackgroundResource(
            if (a11yEnabled) R.drawable.status_indicator_on else R.drawable.status_indicator_warning
        )

        // Keyboard status
        val keyboardSelected = isKeyboardSelected()
        val keyboardEnabled = isKeyboardEnabled()
        binding.statusKeyboard.text = when {
            keyboardSelected -> "Keyboard"
            keyboardEnabled -> "⚠ Keyboard"
            else -> "⚠ Keyboard"
        }
        binding.statusKeyboard.setTextColor(
            ContextCompat.getColor(this, if (keyboardSelected) R.color.accent_green else R.color.status_warning)
        )
        binding.indicatorKeyboard.setBackgroundResource(
            if (keyboardSelected) R.drawable.status_indicator_on else R.drawable.status_indicator_warning
        )

        // Overlay status
        val overlayEnabled = Settings.canDrawOverlays(this)
        binding.statusOverlay.text = if (overlayEnabled) "Overlay" else "⚠ Overlay"
        binding.statusOverlay.setTextColor(
            ContextCompat.getColor(this, if (overlayEnabled) R.color.accent_green else R.color.status_warning)
        )
        binding.indicatorOverlay.setBackgroundResource(
            if (overlayEnabled) R.drawable.status_indicator_on else R.drawable.status_indicator_warning
        )

        // Show permission hint if any warnings
        val hasWarnings = !a11yEnabled || !keyboardSelected || !overlayEnabled
        binding.tvPermissionHint.visibility = if (hasWarnings) View.VISIBLE else View.GONE
    }

    private fun isKeyboardEnabled(): Boolean {
        return try {
            val enabledKeyboards = Settings.Secure.getString(
                contentResolver,
                Settings.Secure.ENABLED_INPUT_METHODS
            ) ?: ""
            enabledKeyboards.contains(packageName)
        } catch (e: SecurityException) {
            // Android 14+ restricts this API
            Log.w(TAG, "Cannot check keyboard enabled status on this Android version")
            false
        }
    }

    private fun isKeyboardSelected(): Boolean {
        return try {
            val currentKeyboard = Settings.Secure.getString(
                contentResolver,
                Settings.Secure.DEFAULT_INPUT_METHOD
            ) ?: ""
            currentKeyboard.contains(packageName)
        } catch (e: SecurityException) {
            // Android 14+ restricts this API
            Log.w(TAG, "Cannot check keyboard selected status on this Android version")
            false
        }
    }

    private fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        startActivity(intent)
    }

    private fun openKeyboardSettings() {
        val intent = Intent(Settings.ACTION_INPUT_METHOD_SETTINGS)
        startActivity(intent)
    }

    private fun showInputMethodPicker() {
        val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as android.view.inputmethod.InputMethodManager
        imm.showInputMethodPicker()
    }

    companion object {
        private const val TAG = "MainActivity"
    }
}
