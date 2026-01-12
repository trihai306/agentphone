package com.agent.portal

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.util.DisplayMetrics
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.agent.portal.auth.DeviceRegistrationService
import com.agent.portal.databinding.ActivityDeviceInfoBinding
import com.google.android.material.snackbar.Snackbar

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
}
