package com.agent.portal

import android.content.pm.PackageManager
import android.graphics.drawable.Drawable
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.PopupMenu
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.agent.portal.databinding.ActivityWorkflowsBinding
import com.agent.portal.recording.WorkflowManager
import com.agent.portal.recording.WorkflowMetadata
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.textfield.TextInputEditText

/**
 * Activity to display saved workflows grouped by app.
 */
class WorkflowsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityWorkflowsBinding
    private lateinit var adapter: WorkflowGroupAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityWorkflowsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Initialize WorkflowManager
        WorkflowManager.init(this)

        setupToolbar()
        setupRecyclerView()
        loadWorkflows()
    }

    override fun onResume() {
        super.onResume()
        loadWorkflows()
    }

    private fun setupToolbar() {
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }
    }

    private fun setupRecyclerView() {
        adapter = WorkflowGroupAdapter(
            onWorkflowClick = { workflow ->
                showWorkflowDetails(workflow)
            },
            onPlayClick = { workflow ->
                playWorkflow(workflow)
            },
            onDeleteClick = { workflow ->
                confirmDeleteWorkflow(workflow)
            },
            onRenameClick = { workflow ->
                showRenameDialog(workflow)
            },
            onExportClick = { workflow ->
                exportWorkflow(workflow)
            }
        )
        binding.rvWorkflows.layoutManager = LinearLayoutManager(this)
        binding.rvWorkflows.adapter = adapter
    }

    private fun loadWorkflows() {
        val workflowsByApp = WorkflowManager.getWorkflowsByApp()

        if (workflowsByApp.isEmpty()) {
            binding.rvWorkflows.visibility = View.GONE
            binding.layoutEmpty.visibility = View.VISIBLE
        } else {
            binding.rvWorkflows.visibility = View.VISIBLE
            binding.layoutEmpty.visibility = View.GONE

            // Convert to list of app groups
            val groups = workflowsByApp.map { (appPackage, workflows) ->
                val appInfo = getAppInfo(appPackage)
                AppWorkflowGroup(
                    appPackage = appPackage,
                    appName = appInfo.first,
                    appIcon = appInfo.second,
                    workflows = workflows.sortedByDescending { it.createdAt }
                )
            }.sortedByDescending { it.workflows.firstOrNull()?.createdAt ?: 0L }

            adapter.submitList(groups)
        }
    }

    private fun getAppInfo(packageName: String): Pair<String, Drawable?> {
        return try {
            val pm = packageManager
            val appInfo = pm.getApplicationInfo(packageName, 0)
            val appName = pm.getApplicationLabel(appInfo).toString()
            val appIcon = pm.getApplicationIcon(appInfo)
            Pair(appName, appIcon)
        } catch (e: PackageManager.NameNotFoundException) {
            Pair(packageName, null)
        }
    }

    private fun showWorkflowDetails(workflow: WorkflowMetadata) {
        val fullWorkflow = WorkflowManager.loadWorkflow(workflow.id)
        if (fullWorkflow == null) {
            Toast.makeText(this, "Failed to load workflow", Toast.LENGTH_SHORT).show()
            return
        }

        val details = buildString {
            appendLine("Name: ${fullWorkflow.name}")
            appendLine("App: ${fullWorkflow.appName}")
            appendLine("Events: ${fullWorkflow.eventCount}")
            appendLine("Duration: ${fullWorkflow.getFormattedDuration()}")
            appendLine("Created: ${fullWorkflow.getFormattedDate()}")
            appendLine()
            appendLine("Event types:")
            fullWorkflow.events.groupBy { it.eventType }.forEach { (type, events) ->
                appendLine("  • $type: ${events.size}")
            }
        }

        MaterialAlertDialogBuilder(this)
            .setTitle(workflow.name)
            .setMessage(details)
            .setPositiveButton("OK", null)
            .setNeutralButton("Export JSON") { _, _ ->
                exportWorkflow(workflow)
            }
            .show()
    }

    private fun playWorkflow(workflow: WorkflowMetadata) {
        Toast.makeText(this, "Playback coming soon: ${workflow.name}", Toast.LENGTH_SHORT).show()
        // TODO: Implement workflow playback using RecordingPlayer
    }

    private fun confirmDeleteWorkflow(workflow: WorkflowMetadata) {
        MaterialAlertDialogBuilder(this)
            .setTitle("Delete Workflow")
            .setMessage("Are you sure you want to delete \"${workflow.name}\"? This action cannot be undone.")
            .setNegativeButton("Cancel", null)
            .setPositiveButton("Delete") { _, _ ->
                if (WorkflowManager.deleteWorkflow(workflow.id)) {
                    Toast.makeText(this, "Workflow deleted", Toast.LENGTH_SHORT).show()
                    loadWorkflows()
                } else {
                    Toast.makeText(this, "Failed to delete workflow", Toast.LENGTH_SHORT).show()
                }
            }
            .show()
    }

    private fun showRenameDialog(workflow: WorkflowMetadata) {
        val editText = TextInputEditText(this).apply {
            setText(workflow.name)
            selectAll()
            setPadding(48, 32, 48, 16)
        }

        MaterialAlertDialogBuilder(this)
            .setTitle("Rename Workflow")
            .setView(editText)
            .setNegativeButton("Cancel", null)
            .setPositiveButton("Rename") { _, _ ->
                val newName = editText.text?.toString()?.trim()
                if (!newName.isNullOrEmpty()) {
                    if (WorkflowManager.renameWorkflow(workflow.id, newName)) {
                        Toast.makeText(this, "Workflow renamed", Toast.LENGTH_SHORT).show()
                        loadWorkflows()
                    } else {
                        Toast.makeText(this, "Failed to rename workflow", Toast.LENGTH_SHORT).show()
                    }
                }
            }
            .show()
    }

    private fun exportWorkflow(workflow: WorkflowMetadata) {
        val json = WorkflowManager.exportWorkflowAsJson(workflow.id)
        if (json != null) {
            val clipboard = getSystemService(CLIPBOARD_SERVICE) as android.content.ClipboardManager
            val clip = android.content.ClipData.newPlainText("Workflow JSON", json)
            clipboard.setPrimaryClip(clip)
            Toast.makeText(this, "JSON copied to clipboard", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, "Failed to export workflow", Toast.LENGTH_SHORT).show()
        }
    }

    // =========================================================================
    // DATA CLASSES
    // =========================================================================

    data class AppWorkflowGroup(
        val appPackage: String,
        val appName: String,
        val appIcon: Drawable?,
        val workflows: List<WorkflowMetadata>
    )

    // =========================================================================
    // ADAPTERS
    // =========================================================================

    inner class WorkflowGroupAdapter(
        private val onWorkflowClick: (WorkflowMetadata) -> Unit,
        private val onPlayClick: (WorkflowMetadata) -> Unit,
        private val onDeleteClick: (WorkflowMetadata) -> Unit,
        private val onRenameClick: (WorkflowMetadata) -> Unit,
        private val onExportClick: (WorkflowMetadata) -> Unit
    ) : RecyclerView.Adapter<WorkflowGroupAdapter.GroupViewHolder>() {

        private var groups: List<AppWorkflowGroup> = emptyList()

        fun submitList(newGroups: List<AppWorkflowGroup>) {
            groups = newGroups
            notifyDataSetChanged()
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): GroupViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_workflow_group, parent, false)
            return GroupViewHolder(view)
        }

        override fun onBindViewHolder(holder: GroupViewHolder, position: Int) {
            holder.bind(groups[position])
        }

        override fun getItemCount(): Int = groups.size

        inner class GroupViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
            private val ivAppIcon: ImageView = itemView.findViewById(R.id.ivAppIcon)
            private val tvAppName: TextView = itemView.findViewById(R.id.tvAppName)
            private val tvWorkflowCount: TextView = itemView.findViewById(R.id.tvWorkflowCount)
            private val rvAppWorkflows: RecyclerView = itemView.findViewById(R.id.rvAppWorkflows)

            fun bind(group: AppWorkflowGroup) {
                // Set app info
                tvAppName.text = group.appName
                tvWorkflowCount.text = "${group.workflows.size} workflow${if (group.workflows.size != 1) "s" else ""}"

                if (group.appIcon != null) {
                    ivAppIcon.setImageDrawable(group.appIcon)
                } else {
                    ivAppIcon.setImageResource(android.R.drawable.sym_def_app_icon)
                }

                // Setup nested RecyclerView for workflows
                val workflowAdapter = WorkflowAdapter(
                    group.workflows,
                    onWorkflowClick,
                    onPlayClick,
                    onDeleteClick,
                    onRenameClick,
                    onExportClick
                )
                rvAppWorkflows.layoutManager = LinearLayoutManager(itemView.context)
                rvAppWorkflows.adapter = workflowAdapter
                rvAppWorkflows.isNestedScrollingEnabled = false
            }
        }
    }

    inner class WorkflowAdapter(
        private val workflows: List<WorkflowMetadata>,
        private val onWorkflowClick: (WorkflowMetadata) -> Unit,
        private val onPlayClick: (WorkflowMetadata) -> Unit,
        private val onDeleteClick: (WorkflowMetadata) -> Unit,
        private val onRenameClick: (WorkflowMetadata) -> Unit,
        private val onExportClick: (WorkflowMetadata) -> Unit
    ) : RecyclerView.Adapter<WorkflowAdapter.WorkflowViewHolder>() {

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): WorkflowViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_workflow, parent, false)
            return WorkflowViewHolder(view)
        }

        override fun onBindViewHolder(holder: WorkflowViewHolder, position: Int) {
            holder.bind(workflows[position])
        }

        override fun getItemCount(): Int = workflows.size

        inner class WorkflowViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
            private val tvWorkflowName: TextView = itemView.findViewById(R.id.tvWorkflowName)
            private val tvEventCount: TextView = itemView.findViewById(R.id.tvEventCount)
            private val tvDuration: TextView = itemView.findViewById(R.id.tvDuration)
            private val tvDate: TextView = itemView.findViewById(R.id.tvDate)
            private val btnPlay: ImageButton = itemView.findViewById(R.id.btnPlay)
            private val btnMore: ImageButton = itemView.findViewById(R.id.btnMore)

            fun bind(workflow: WorkflowMetadata) {
                tvWorkflowName.text = workflow.name
                tvEventCount.text = "${workflow.eventCount} events"
                tvDuration.text = workflow.getFormattedDuration()
                tvDate.text = workflow.getShortDate()

                itemView.setOnClickListener {
                    onWorkflowClick(workflow)
                }

                btnPlay.setOnClickListener {
                    onPlayClick(workflow)
                }

                btnMore.setOnClickListener { view ->
                    showPopupMenu(view, workflow)
                }
            }

            private fun showPopupMenu(anchor: View, workflow: WorkflowMetadata) {
                val popup = PopupMenu(anchor.context, anchor)
                popup.menu.add(0, 1, 0, "Rename")
                popup.menu.add(0, 2, 1, "Export JSON")
                popup.menu.add(0, 3, 2, "Delete")

                popup.setOnMenuItemClickListener { item ->
                    when (item.itemId) {
                        1 -> {
                            onRenameClick(workflow)
                            true
                        }
                        2 -> {
                            onExportClick(workflow)
                            true
                        }
                        3 -> {
                            onDeleteClick(workflow)
                            true
                        }
                        else -> false
                    }
                }
                popup.show()
            }
        }
    }
}
