package com.agent.portal

import androidx.appcompat.app.AlertDialog
import android.content.Context
import android.content.pm.PackageManager
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.agent.portal.recording.RecordedEvent
import com.agent.portal.recording.RecordingManager
import com.agent.portal.recording.Workflow
import com.agent.portal.recording.WorkflowAnalyzer
import com.agent.portal.recording.WorkflowManager
import com.google.android.material.chip.Chip
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout

/**
 * Dialog for saving recorded workflow with a user-defined name.
 * 
 * Enhanced with:
 * - Smart workflow analysis and optimization
 * - Auto-generated intelligent names
 * - Category detection and display
 * - Optimization stats
 */
class SaveWorkflowDialog(
    private val context: Context,
    private val appPackage: String,
    private val events: List<RecordedEvent>,
    private val onSaved: (workflowId: String, workflowName: String) -> Unit,
    private val onDiscarded: () -> Unit
) {

    private var dialog: AlertDialog? = null
    private var analysis: WorkflowAnalyzer.WorkflowAnalysis? = null

    fun show() {
        // Get app name first
        val appName = try {
            context.packageManager.getApplicationLabel(
                context.packageManager.getApplicationInfo(appPackage, 0)
            ).toString()
        } catch (e: Exception) {
            appPackage.substringAfterLast(".")
        }

        // Analyze workflow (this also optimizes events)
        analysis = WorkflowAnalyzer.analyzeWorkflow(events, appName)

        // Inflate dialog view
        val dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_save_workflow, null)

        // Find views
        val ivAppIcon = dialogView.findViewById<ImageView>(R.id.ivAppIcon)
        val tvAppName = dialogView.findViewById<TextView>(R.id.tvAppName)
        val tvEventStats = dialogView.findViewById<TextView>(R.id.tvEventStats)
        val tilWorkflowName = dialogView.findViewById<TextInputLayout>(R.id.tilWorkflowName)
        val etWorkflowName = dialogView.findViewById<TextInputEditText>(R.id.etWorkflowName)
        val chipLogin = dialogView.findViewById<Chip>(R.id.chipLogin)
        val chipCheckout = dialogView.findViewById<Chip>(R.id.chipCheckout)
        val chipNavigation = dialogView.findViewById<Chip>(R.id.chipNavigation)
        val chipTest = dialogView.findViewById<Chip>(R.id.chipTest)
        val rvEventPreview = dialogView.findViewById<RecyclerView>(R.id.rvEventPreview)

        // Optional: Category badge (if view exists)
        val tvCategory = dialogView.findViewById<TextView>(R.id.tvCategory)
        val tvOptimizationStats = dialogView.findViewById<TextView>(R.id.tvOptimizationStats)

        // Load app info
        try {
            val pm = context.packageManager
            val appInfo = pm.getApplicationInfo(appPackage, 0)
            ivAppIcon.setImageDrawable(pm.getApplicationIcon(appInfo))
            tvAppName.text = pm.getApplicationLabel(appInfo)
        } catch (e: PackageManager.NameNotFoundException) {
            tvAppName.text = appPackage
        }

        // Use optimized events for stats
        val optimizedEvents = analysis?.optimizedEvents ?: events
        
        // Calculate duration
        val durationMs = if (optimizedEvents.size >= 2) {
            optimizedEvents.last().relativeTimestamp - optimizedEvents.first().relativeTimestamp
        } else {
            0L
        }
        val seconds = (durationMs / 1000) % 60
        val minutes = (durationMs / 1000 / 60) % 60
        val durationStr = if (minutes > 0) "${minutes}m ${seconds}s" else "${seconds}s"
        
        // Show event stats with optimization info
        val originalCount = analysis?.originalEventCount ?: events.size
        val optimizedCount = analysis?.optimizedEventCount ?: events.size
        
        if (originalCount != optimizedCount) {
            tvEventStats.text = "${optimizedCount} events • $durationStr (optimized from $originalCount)"
        } else {
            tvEventStats.text = "${optimizedCount} events • $durationStr"
        }

        // Show category if view exists
        tvCategory?.let { categoryView ->
            analysis?.let { a ->
                categoryView.visibility = View.VISIBLE
                categoryView.text = "${a.category.icon} ${a.category.displayName}"
            }
        }

        // Show optimization stats if view exists
        tvOptimizationStats?.let { statsView ->
            analysis?.let { a ->
                if (a.originalEventCount != a.optimizedEventCount) {
                    statsView.visibility = View.VISIBLE
                    val saved = a.originalEventCount - a.optimizedEventCount
                    statsView.text = "✨ Optimized: removed $saved redundant events"
                } else {
                    statsView.visibility = View.GONE
                }
            }
        }

        // Use smart generated name
        val smartName = analysis?.suggestedName ?: "$appName Workflow"
        etWorkflowName.setText(smartName)
        etWorkflowName.selectAll()

        // Update chips based on detected category
        updateChipsForCategory(analysis?.category, chipLogin, chipCheckout, chipNavigation, chipTest)

        // Setup suggestion chips
        val suggestions = listOf(
            chipLogin to "Login Flow",
            chipCheckout to "Checkout Flow",
            chipNavigation to "Navigation Test",
            chipTest to "Test Scenario"
        )

        suggestions.forEach { (chip, name) ->
            chip.setOnClickListener {
                etWorkflowName.setText("$appName $name")
                etWorkflowName.setSelection(etWorkflowName.text?.length ?: 0)
            }
        }

        // Setup event preview (show optimized events)
        val previewEvents = optimizedEvents.take(5)
        rvEventPreview.layoutManager = LinearLayoutManager(context)
        rvEventPreview.adapter = EventPreviewAdapter(previewEvents, optimizedEvents.size)

        // Build and show dialog
        dialog = MaterialAlertDialogBuilder(context)
            .setTitle("Save Workflow")
            .setView(dialogView)
            .setPositiveButton("Save") { _, _ ->
                val name = etWorkflowName.text?.toString()?.trim()
                if (name.isNullOrEmpty()) {
                    Toast.makeText(context, "Please enter a workflow name", Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }

                // Initialize WorkflowManager if needed
                WorkflowManager.init(context)

                // Save workflow with OPTIMIZED events
                val eventsToSave = analysis?.optimizedEvents ?: events
                val category = analysis?.category?.name ?: "GENERAL"

                val workflowId = WorkflowManager.saveWorkflow(
                    name = name,
                    appPackage = appPackage,
                    appName = appName,
                    events = eventsToSave,
                    category = category
                )

                if (workflowId != null) {
                    val savedCount = eventsToSave.size
                    val optimizedMsg = if (events.size != savedCount) {
                        " (optimized from ${events.size})"
                    } else ""
                    Toast.makeText(context, "Saved: $name ($savedCount events$optimizedMsg)", Toast.LENGTH_SHORT).show()
                    onSaved(workflowId, name)
                } else {
                    Toast.makeText(context, "Failed to save workflow", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Discard") { _, _ ->
                onDiscarded()
            }
            .setCancelable(false)
            .create()

        dialog?.show()
    }

    /**
     * Highlight the chip that matches detected category
     */
    private fun updateChipsForCategory(
        category: WorkflowAnalyzer.WorkflowCategory?,
        chipLogin: Chip,
        chipCheckout: Chip,
        chipNavigation: Chip,
        chipTest: Chip
    ) {
        // Reset all chips
        listOf(chipLogin, chipCheckout, chipNavigation, chipTest).forEach {
            it.isChecked = false
        }

        // Highlight matching category
        when (category) {
            WorkflowAnalyzer.WorkflowCategory.LOGIN -> chipLogin.isChecked = true
            WorkflowAnalyzer.WorkflowCategory.CHECKOUT -> chipCheckout.isChecked = true
            WorkflowAnalyzer.WorkflowCategory.NAVIGATION -> chipNavigation.isChecked = true
            else -> { /* No chip to highlight */ }
        }
    }

    /**
     * Simple adapter to show a preview of the first few events
     */
    private inner class EventPreviewAdapter(
        private val events: List<RecordedEvent>,
        private val totalCount: Int
    ) : RecyclerView.Adapter<EventPreviewAdapter.ViewHolder>() {

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_event_preview, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            if (position < events.size) {
                holder.bind(events[position], position)
            } else {
                // Show "more" indicator
                holder.bindMore(totalCount - events.size)
            }
        }

        override fun getItemCount(): Int {
            return if (totalCount > events.size) events.size + 1 else events.size
        }

        inner class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
            private val tvEventType: TextView = itemView.findViewById(R.id.tvEventType)
            private val tvEventTarget: TextView = itemView.findViewById(R.id.tvEventTarget)

            fun bind(event: RecordedEvent, index: Int) {
                tvEventType.text = "${index + 1}. ${formatEventType(event.eventType)}"

                val target = when {
                    event.text.isNotEmpty() -> event.text.take(30)
                    event.contentDescription.isNotEmpty() -> event.contentDescription.take(30)
                    event.resourceId.isNotEmpty() -> event.resourceId.substringAfterLast("/")
                    else -> event.className.substringAfterLast(".")
                }
                tvEventTarget.text = target
                tvEventTarget.visibility = View.VISIBLE
            }

            fun bindMore(remaining: Int) {
                tvEventType.text = "..."
                tvEventTarget.text = "+$remaining more events"
            }

            private fun formatEventType(type: String): String {
                return when (type) {
                    "tap" -> "Tap"
                    "long_tap" -> "Long Tap"
                    "text_input" -> "Text Input"
                    "scroll" -> "Scroll"
                    "focus" -> "Focus"
                    else -> type.replaceFirstChar { it.uppercase() }
                }
            }
        }
    }
}
