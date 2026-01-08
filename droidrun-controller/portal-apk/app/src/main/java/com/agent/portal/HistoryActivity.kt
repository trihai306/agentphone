package com.agent.portal

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.graphics.BitmapFactory
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.agent.portal.databinding.ActivityHistoryBinding
import com.agent.portal.recording.RecordedEvent
import com.agent.portal.recording.RecordingManager
import com.google.android.material.dialog.MaterialAlertDialogBuilder

/**
 * Activity to display the recorded interaction history in a beautiful timeline view.
 */
class HistoryActivity : AppCompatActivity() {

    private lateinit var binding: ActivityHistoryBinding
    private lateinit var adapter: EventHistoryAdapter
    private var allEvents: List<RecordedEvent> = emptyList()
    private var filteredEvents: List<RecordedEvent> = emptyList()
    private var currentFilter: String = "all"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityHistoryBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupToolbar()
        setupRecyclerView()
        setupFilterChips()
        setupActionButtons()
        loadEvents()
    }

    override fun onResume() {
        super.onResume()
        loadEvents()
    }

    private fun setupToolbar() {
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }
    }

    private fun setupRecyclerView() {
        adapter = EventHistoryAdapter { event ->
            showEventDetails(event)
        }
        binding.rvEvents.layoutManager = LinearLayoutManager(this)
        binding.rvEvents.adapter = adapter
    }

    private fun setupFilterChips() {
        binding.chipGroupFilter.setOnCheckedStateChangeListener { _, checkedIds ->
            if (checkedIds.isNotEmpty()) {
                currentFilter = when (checkedIds.first()) {
                    R.id.chipTap -> "tap"
                    R.id.chipScroll -> "scroll"
                    R.id.chipInput -> "text_input"
                    else -> "all"
                }
                applyFilter()
            }
        }
    }

    private fun setupActionButtons() {
        binding.btnExportJson.setOnClickListener {
            exportToJson()
        }

        binding.btnClearAll.setOnClickListener {
            confirmClearAll()
        }
    }

    private fun loadEvents() {
        allEvents = RecordingManager.getEvents()
        applyFilter()
        updateStats()
        updateEmptyState()
    }

    private fun applyFilter() {
        filteredEvents = if (currentFilter == "all") {
            allEvents
        } else {
            allEvents.filter { it.eventType == currentFilter ||
                (currentFilter == "tap" && it.eventType == "long_tap") }
        }
        adapter.submitList(filteredEvents)
    }

    private fun updateStats() {
        binding.tvTotalEvents.text = allEvents.size.toString()

        val status = RecordingManager.getStatus()
        val durationMs = status.durationMs ?: 0
        val minutes = (durationMs / 1000) / 60
        val seconds = (durationMs / 1000) % 60
        binding.tvDuration.text = String.format("%d:%02d", minutes, seconds)
    }

    private fun updateEmptyState() {
        if (allEvents.isEmpty()) {
            binding.rvEvents.visibility = View.GONE
            binding.layoutEmpty.visibility = View.VISIBLE
            binding.bottomActionBar.visibility = View.GONE
        } else {
            binding.rvEvents.visibility = View.VISIBLE
            binding.layoutEmpty.visibility = View.GONE
            binding.bottomActionBar.visibility = View.VISIBLE
        }
    }

    private fun showEventDetails(event: RecordedEvent) {
        val details = buildString {
            appendLine("Event Type: ${formatEventType(event.eventType)}")
            appendLine("Timestamp: ${formatTimestamp(event.relativeTimestamp)}")
            appendLine("Package: ${event.packageName}")
            appendLine("Class: ${event.className}")
            if (event.resourceId.isNotEmpty()) {
                appendLine("Resource ID: ${event.resourceId}")
            }
            if (event.text.isNotEmpty()) {
                appendLine("Text: ${event.text}")
            }
            if (event.contentDescription.isNotEmpty()) {
                appendLine("Content Description: ${event.contentDescription}")
            }
            appendLine("Bounds: ${event.bounds}")
            if (event.x != null && event.y != null) {
                appendLine("Coordinates: (${event.x}, ${event.y})")
            }
            event.actionData?.let { data ->
                appendLine("\nAction Data:")
                data.forEach { (key, value) ->
                    appendLine("  $key: $value")
                }
            }
        }

        MaterialAlertDialogBuilder(this)
            .setTitle("Event #${event.sequenceNumber}")
            .setMessage(details)
            .setPositiveButton("OK", null)
            .setNeutralButton("Copy") { _, _ ->
                copyToClipboard(details)
            }
            .show()
    }

    private fun exportToJson() {
        val json = RecordingManager.getEventsAsJson()
        copyToClipboard(json)
        Toast.makeText(this, "JSON copied to clipboard (${allEvents.size} events)", Toast.LENGTH_SHORT).show()
    }

    private fun confirmClearAll() {
        MaterialAlertDialogBuilder(this)
            .setTitle("Clear All Events")
            .setMessage("Are you sure you want to delete all ${allEvents.size} recorded events? This action cannot be undone.")
            .setNegativeButton("Cancel", null)
            .setPositiveButton("Clear") { _, _ ->
                RecordingManager.clearEvents()
                loadEvents()
                Toast.makeText(this, "All events cleared", Toast.LENGTH_SHORT).show()
            }
            .show()
    }

    private fun copyToClipboard(text: String) {
        val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val clip = ClipData.newPlainText("Event Data", text)
        clipboard.setPrimaryClip(clip)
    }

    private fun showScreenshotFullscreen(event: RecordedEvent, screenshotPath: String) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_screenshot_viewer, null)
        val ivFullScreenshot = dialogView.findViewById<com.agent.portal.views.ZoomableImageView>(R.id.ivFullScreenshot)
        val btnClose = dialogView.findViewById<com.google.android.material.floatingactionbutton.FloatingActionButton>(R.id.btnClose)
        val tvEventTypeLabel = dialogView.findViewById<TextView>(R.id.tvEventTypeLabel)
        val tvEventDetails = dialogView.findViewById<TextView>(R.id.tvEventDetails)

        // Load full-resolution screenshot
        val file = com.agent.portal.recording.ScreenshotManager.getScreenshotFile(screenshotPath)
        if (file != null) {
            val bitmap = BitmapFactory.decodeFile(file.absolutePath)
            if (bitmap != null) {
                ivFullScreenshot.setImageBitmap(bitmap)
            }
        }

        // Set event info
        tvEventTypeLabel.text = formatEventType(event.eventType).uppercase()
        tvEventDetails.text = "Event #${event.sequenceNumber} • ${formatTimestamp(event.relativeTimestamp)}"

        // Create fullscreen dialog
        val dialog = MaterialAlertDialogBuilder(this, R.style.Theme_AgentPortal)
            .setView(dialogView)
            .create()

        // Make dialog fullscreen
        dialog.window?.setLayout(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        )
        dialog.window?.setBackgroundDrawableResource(android.R.color.black)

        btnClose.setOnClickListener {
            dialog.dismiss()
        }

        dialog.show()
    }

    private fun formatEventType(type: String): String {
        return when (type) {
            "tap" -> "Tap"
            "long_tap" -> "Long Tap"
            "text_input" -> "Text Input"
            "scroll" -> "Scroll"
            "focus" -> "Focus"
            "gesture_start" -> "Gesture Start"
            "gesture_end" -> "Gesture End"
            else -> type.replaceFirstChar { it.uppercase() }
        }
    }

    private fun formatTimestamp(ms: Long): String {
        val seconds = ms / 1000.0
        return String.format("+%.2fs", seconds)
    }

    /**
     * Adapter for displaying recorded events in a RecyclerView
     */
    inner class EventHistoryAdapter(
        private val onEventClick: (RecordedEvent) -> Unit
    ) : RecyclerView.Adapter<EventHistoryAdapter.EventViewHolder>() {

        private var events: List<RecordedEvent> = emptyList()

        fun submitList(newEvents: List<RecordedEvent>) {
            events = newEvents
            notifyDataSetChanged()
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): EventViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_event_history, parent, false)
            return EventViewHolder(view)
        }

        override fun onBindViewHolder(holder: EventViewHolder, position: Int) {
            holder.bind(events[position])
        }

        override fun getItemCount(): Int = events.size

        inner class EventViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
            private val iconContainer: View = itemView.findViewById(R.id.iconContainer)
            private val ivEventIcon: ImageView = itemView.findViewById(R.id.ivEventIcon)
            private val tvEventType: TextView = itemView.findViewById(R.id.tvEventType)
            private val tvTarget: TextView = itemView.findViewById(R.id.tvTarget)
            private val tvPackage: TextView = itemView.findViewById(R.id.tvPackage)
            private val tvSequence: TextView = itemView.findViewById(R.id.tvSequence)
            private val tvTimestamp: TextView = itemView.findViewById(R.id.tvTimestamp)
            private val ivScreenshot: ImageView = itemView.findViewById(R.id.ivScreenshot)

            fun bind(event: RecordedEvent) {
                // Set event type and icon
                tvEventType.text = formatEventType(event.eventType)

                val (iconRes, colorRes) = getIconAndColor(event.eventType)
                ivEventIcon.setImageResource(iconRes)
                iconContainer.backgroundTintList = ContextCompat.getColorStateList(itemView.context, colorRes)

                // Set target description
                val target = when {
                    event.text.isNotEmpty() -> event.text.take(40)
                    event.contentDescription.isNotEmpty() -> event.contentDescription.take(40)
                    event.resourceId.isNotEmpty() -> event.resourceId.substringAfterLast("/")
                    else -> event.className.substringAfterLast(".")
                }
                tvTarget.text = target

                // Set app name or package name
                tvPackage.text = event.appName ?: event.packageName

                // Set sequence and timestamp
                tvSequence.text = "#${event.sequenceNumber}"
                tvTimestamp.text = formatTimestamp(event.relativeTimestamp)

                // Load screenshot thumbnail if available
                if (!event.screenshotPath.isNullOrEmpty()) {
                    val file = com.agent.portal.recording.ScreenshotManager.getScreenshotFile(event.screenshotPath)
                    if (file != null) {
                        // Load image with scaling
                        val bitmap = android.graphics.BitmapFactory.decodeFile(file.absolutePath)
                        if (bitmap != null) {
                            ivScreenshot.setImageBitmap(bitmap)
                            ivScreenshot.visibility = View.VISIBLE

                            // Add click listener to show fullscreen
                            ivScreenshot.setOnClickListener {
                                showScreenshotFullscreen(event, event.screenshotPath)
                            }
                        } else {
                            ivScreenshot.visibility = View.GONE
                        }
                    } else {
                        ivScreenshot.visibility = View.GONE
                    }
                } else {
                    ivScreenshot.visibility = View.GONE
                }

                // Click listener
                itemView.setOnClickListener {
                    onEventClick(event)
                }
            }

            private fun getIconAndColor(eventType: String): Pair<Int, Int> {
                return when (eventType) {
                    "tap" -> R.drawable.ic_tap_action to R.color.timeline_tap
                    "long_tap" -> R.drawable.ic_tap_action to R.color.timeline_long_tap
                    "scroll" -> R.drawable.ic_scroll_action to R.color.timeline_scroll
                    "text_input" -> R.drawable.ic_input_action to R.color.timeline_input
                    "focus" -> R.drawable.ic_tap_action to R.color.timeline_focus
                    else -> R.drawable.ic_tap_action to R.color.timeline_gesture
                }
            }
        }
    }
}
