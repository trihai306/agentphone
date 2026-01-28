package com.agent.portal

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.app.ActivityManager
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.StatFs
import android.os.SystemClock
import android.provider.Settings
import android.util.DisplayMetrics
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.agent.portal.accessibility.PortalAccessibilityService
import com.agent.portal.auth.DeviceRegistrationService
import com.agent.portal.databinding.ActivityDeviceInfoBinding
import com.google.android.material.snackbar.Snackbar
import kotlin.math.pow

/**
 * Activity to display device information and hardware details
 */
class DeviceInfoActivity : AppCompatActivity() {

    private lateinit var binding: ActivityDeviceInfoBinding
    private lateinit var deviceService: DeviceRegistrationService

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDeviceInfoBinding.inflate(layoutInflater)
        setContentView(binding.root)

        deviceService = DeviceRegistrationService(this)

        setupToolbar()
        loadDeviceInfo()
        loadSystemResources()
        loadActivityStats()
        setupCopyButtons()
    }

    private fun setupToolbar() {
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }
    }

    private fun loadDeviceInfo() {
        // Device ID
        val deviceId = getAndroidDeviceId()
        binding.tvDeviceIdValue.text = deviceId

        // Device Name
        val deviceName = "${Build.MANUFACTURER} ${Build.MODEL}"
        binding.tvDeviceNameValue.text = deviceName

        // Manufacturer
        binding.tvManufacturerValue.text = Build.MANUFACTURER

        // Model
        binding.tvModelValue.text = Build.MODEL

        // Android Version
        val androidVersion = "${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})"
        binding.tvAndroidVersionValue.text = androidVersion

        // Screen Resolution
        val displayMetrics = DisplayMetrics()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            display?.getRealMetrics(displayMetrics)
        } else {
            @Suppress("DEPRECATION")
            windowManager.defaultDisplay.getMetrics(displayMetrics)
        }
        val resolution = "${displayMetrics.widthPixels} x ${displayMetrics.heightPixels}"
        binding.tvScreenResolutionValue.text = resolution

        // Screen Density
        val density = displayMetrics.densityDpi
        val densityText = "$density dpi (${getDensityBucket(density)})"
        binding.tvScreenDensityValue.text = densityText

        // Brand
        binding.tvBrandValue.text = Build.BRAND

        // Device (Hardware)
        binding.tvDeviceValue.text = Build.DEVICE

        // Board
        binding.tvBoardValue.text = Build.BOARD

        // Registration Status
        val savedDevice = deviceService.getSavedDeviceInfo()
        if (savedDevice != null) {
            binding.tvRegistrationStatusValue.text = "Registered (ID: ${savedDevice.id})"
            binding.tvRegistrationStatusValue.setTextColor(
                ContextCompat.getColor(this, R.color.status_on)
            )
            binding.indicatorRegistrationStatus.setBackgroundResource(R.drawable.status_indicator_on)
        } else {
            binding.tvRegistrationStatusValue.text = "Not registered"
            binding.tvRegistrationStatusValue.setTextColor(
                ContextCompat.getColor(this, R.color.status_off)
            )
            binding.indicatorRegistrationStatus.setBackgroundResource(R.drawable.status_indicator_off)
        }
    }

    private fun setupCopyButtons() {
        // Copy Device ID
        binding.btnCopyDeviceId.setOnClickListener {
            copyToClipboard("Device ID", binding.tvDeviceIdValue.text.toString())
        }

        // Copy Device Name
        binding.btnCopyDeviceName.setOnClickListener {
            copyToClipboard("Device Name", binding.tvDeviceNameValue.text.toString())
        }

        // Copy Model
        binding.btnCopyModel.setOnClickListener {
            copyToClipboard("Model", binding.tvModelValue.text.toString())
        }

        // Copy Android Version
        binding.btnCopyAndroidVersion.setOnClickListener {
            copyToClipboard("Android Version", binding.tvAndroidVersionValue.text.toString())
        }

        // Copy All Info
        binding.btnCopyAll.setOnClickListener {
            val allInfo = buildString {
                appendLine("Device ID: ${binding.tvDeviceIdValue.text}")
                appendLine("Device Name: ${binding.tvDeviceNameValue.text}")
                appendLine("Manufacturer: ${binding.tvManufacturerValue.text}")
                appendLine("Model: ${binding.tvModelValue.text}")
                appendLine("Brand: ${binding.tvBrandValue.text}")
                appendLine("Android Version: ${binding.tvAndroidVersionValue.text}")
                appendLine("Screen Resolution: ${binding.tvScreenResolutionValue.text}")
                appendLine("Screen Density: ${binding.tvScreenDensityValue.text}")
                appendLine("Device: ${binding.tvDeviceValue.text}")
                appendLine("Board: ${binding.tvBoardValue.text}")
                appendLine("Registration: ${binding.tvRegistrationStatusValue.text}")
            }
            copyToClipboard("All Device Info", allInfo)
        }
    }

    private fun getAndroidDeviceId(): String {
        return Settings.Secure.getString(
            contentResolver,
            Settings.Secure.ANDROID_ID
        ) ?: "unknown"
    }

    private fun getDensityBucket(dpi: Int): String {
        return when {
            dpi <= 120 -> "ldpi"
            dpi <= 160 -> "mdpi"
            dpi <= 240 -> "hdpi"
            dpi <= 320 -> "xhdpi"
            dpi <= 480 -> "xxhdpi"
            dpi <= 640 -> "xxxhdpi"
            else -> "ultra"
        }
    }

    private fun copyToClipboard(label: String, text: String) {
        val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val clip = ClipData.newPlainText(label, text)
        clipboard.setPrimaryClip(clip)

        // Show confirmation with animation
        Snackbar.make(binding.root, "Copied to clipboard", Snackbar.LENGTH_SHORT)
            .setAnchorView(binding.btnCopyAll)
            .show()

        // Also show toast for older devices
        Toast.makeText(this, "✓ $label copied", Toast.LENGTH_SHORT).show()

        // Animate button
        animateCopyButton(
            when (label) {
                "Device ID" -> binding.btnCopyDeviceId
                "Device Name" -> binding.btnCopyDeviceName
                "Model" -> binding.btnCopyModel
                "Android Version" -> binding.btnCopyAndroidVersion
                else -> binding.btnCopyAll
            }
        )
    }

    private fun animateCopyButton(button: android.view.View) {
        button.animate()
            .scaleX(0.9f)
            .scaleY(0.9f)
            .setDuration(100)
            .withEndAction {
                button.animate()
                    .scaleX(1f)
                    .scaleY(1f)
                    .setDuration(100)
                    .start()
            }
            .start()
    }

private fun loadSystemResources() {
        // RAM
        val activityManager = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val memoryInfo = ActivityManager.MemoryInfo()
        activityManager.getMemoryInfo(memoryInfo)
        
        val totalRam = memoryInfo.totalMem / (1024.0 * 1024.0 * 1024.0) // Convert to GB
        val availableRam = memoryInfo.availMem / (1024.0 * 1024.0 * 1024.0)
        val usedRam = totalRam - availableRam
        
        binding.tvRamValue.text = String.format("%.1f GB / %.1f GB (%.0f%% used)", 
            usedRam, totalRam, (usedRam / totalRam) * 100)
        
        // Internal Storage
        val statFs = StatFs(Environment.getDataDirectory().path)
        val blockSize = statFs.blockSizeLong
        val totalBlocks = statFs.blockCountLong
        val availableBlocks = statFs.availableBlocksLong
        
        val totalStorage = (totalBlocks * blockSize) / (1024.0.pow(3)) // GB
        val usedStorage = ((totalBlocks - availableBlocks) * blockSize) / (1024.0.pow(3))
        
        binding.tvStorageValue.text = String.format("%.1f GB / %.1f GB (%.0f%% used)", 
            usedStorage, totalStorage, (usedStorage / totalStorage) * 100)
    }
    
    private fun loadActivityStats() {
        // Accessibility Service Status
        val isAccessibilityRunning = PortalAccessibilityService.isRunning()
        binding.tvAccessibilityStatusValue.text = if (isAccessibilityRunning) "Enabled" else "Disabled"
        binding.tvAccessibilityStatusValue.setTextColor(
            ContextCompat.getColor(this, if (isAccessibilityRunning) R.color.status_on else R.color.status_off)
        )
        binding.indicatorAccessibilityStatus.setBackgroundResource(
            if (isAccessibilityRunning) R.drawable.status_indicator_on else R.drawable.status_indicator_off
        )
        
        // Job Stats (fetch from backend)
        fetchJobStats()
        
        // Device Uptime
        val uptimeMillis = SystemClock.elapsedRealtime()
        binding.tvUptimeValue.text = formatUptime(uptimeMillis)
    }
    
    private fun fetchJobStats() {
        val sessionManager = com.agent.portal.auth.SessionManager(this)
        val session = sessionManager.getSession()
        
        if (session == null) {
            binding.tvJobsCompletedValue.text = "Not logged in"
            return
        }
        
        val apiUrl = com.agent.portal.utils.NetworkUtils.getApiBaseUrl()
        
        Thread {
            try {
                val client = okhttp3.OkHttpClient.Builder()
                    .connectTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
                    .readTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
                    .build()
                
                val request = okhttp3.Request.Builder()
                    .url("$apiUrl/jobs/stats/total")
                    .addHeader("Authorization", "Bearer ${session.token}")
                    .addHeader("Accept", "application/json")
                    .build()
                
                val response = client.newCall(request).execute()
                val responseBody = response.body?.string()
                
                if (response.isSuccessful && responseBody != null) {
                    val json = org.json.JSONObject(responseBody)
                    val data = json.optJSONObject("data")
                    
                    if (data != null) {
                        val totalCompleted = data.optInt("completed", 0)
                        
                        runOnUiThread {
                            binding.tvJobsCompletedValue.text = "$totalCompleted jobs"
                        }
                    } else {
                        runOnUiThread {
                            binding.tvJobsCompletedValue.text = "0 jobs"
                        }
                    }
                } else {
                    runOnUiThread {
                        binding.tvJobsCompletedValue.text = "Failed to load"
                    }
                }
                response.close()
            } catch (e: Exception) {
                Log.e("DeviceInfoActivity", "Error fetching job stats", e)
                runOnUiThread {
                    binding.tvJobsCompletedValue.text = "Error loading"
                }
            }
        }.start()
    }
    
    private fun formatUptime(uptimeMillis: Long): String {
        val seconds = uptimeMillis / 1000
        val minutes = seconds / 60
        val hours = minutes / 60
        val days = hours / 24
        
        return when {
            days > 0 -> String.format("%dd %dh %dm", days, hours % 24, minutes % 60)
            hours > 0 -> String.format("%dh %dm", hours, minutes % 60)
            minutes > 0 -> String.format("%dm %ds", minutes, seconds % 60)
            else -> String.format("%ds", seconds)
        }
    }
}
