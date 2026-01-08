package com.agent.portal.recording

import android.content.Context
import android.util.Log
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.reflect.TypeToken
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

/**
 * WorkflowManager manages saving and loading recorded workflows/scenarios.
 *
 * Each workflow contains:
 * - Unique ID
 * - User-defined name
 * - App package and name
 * - List of recorded events
 * - Timestamps and metadata
 */
object WorkflowManager {

    private const val TAG = "WorkflowManager"
    private const val WORKFLOWS_DIR = "workflows"
    private const val INDEX_FILE = "workflow_index.json"

    private val gson: Gson = GsonBuilder()
        .setPrettyPrinting()
        .create()

    private var contextRef: Context? = null
    private var workflowIndex: MutableList<WorkflowMetadata> = mutableListOf()

    /**
     * Initialize with context
     */
    fun init(context: Context) {
        contextRef = context.applicationContext
        loadIndex()
    }

    /**
     * Save a new workflow
     *
     * @param name User-defined name for the workflow
     * @param appPackage Package name of the recorded app
     * @param appName Display name of the recorded app
     * @param events List of recorded events
     * @param category Workflow category (LOGIN, SEARCH, etc.)
     * @return Workflow ID if successful, null if failed
     */
    fun saveWorkflow(
        name: String,
        appPackage: String,
        appName: String?,
        events: List<RecordedEvent>,
        category: String = "GENERAL"
    ): String? {
        val context = contextRef ?: return null

        if (events.isEmpty()) {
            Log.w(TAG, "Cannot save empty workflow")
            return null
        }

        try {
            val workflowId = "wf_${System.currentTimeMillis()}_${UUID.randomUUID().toString().take(8)}"
            val timestamp = System.currentTimeMillis()

            // Calculate duration from events
            val duration = if (events.size >= 2) {
                events.last().relativeTimestamp - events.first().relativeTimestamp
            } else {
                0L
            }

            // Create workflow data
            val workflow = Workflow(
                id = workflowId,
                name = name,
                appPackage = appPackage,
                appName = appName ?: appPackage,
                events = events,
                createdAt = timestamp,
                durationMs = duration,
                eventCount = events.size,
                category = category
            )

            // Save workflow file
            val workflowDir = File(context.filesDir, WORKFLOWS_DIR)
            if (!workflowDir.exists()) {
                workflowDir.mkdirs()
            }

            val workflowFile = File(workflowDir, "$workflowId.json")
            workflowFile.writeText(gson.toJson(workflow))

            // Update index
            val metadata = WorkflowMetadata(
                id = workflowId,
                name = name,
                appPackage = appPackage,
                appName = appName ?: appPackage,
                createdAt = timestamp,
                durationMs = duration,
                eventCount = events.size,
                category = category
            )
            workflowIndex.add(0, metadata) // Add to beginning (most recent first)
            saveIndex()

            Log.i(TAG, "Workflow saved: $name ($workflowId) with ${events.size} events")
            return workflowId

        } catch (e: Exception) {
            Log.e(TAG, "Failed to save workflow", e)
            return null
        }
    }

    /**
     * Get all workflow metadata (for listing)
     */
    fun getWorkflowList(): List<WorkflowMetadata> {
        return workflowIndex.toList()
    }

    /**
     * Get workflows grouped by app
     */
    fun getWorkflowsByApp(): Map<String, List<WorkflowMetadata>> {
        return workflowIndex.groupBy { it.appPackage }
    }

    /**
     * Get workflow count for a specific app
     */
    fun getWorkflowCountForApp(appPackage: String): Int {
        return workflowIndex.count { it.appPackage == appPackage }
    }

    /**
     * Load full workflow with events
     */
    fun loadWorkflow(workflowId: String): Workflow? {
        val context = contextRef ?: return null

        try {
            val workflowFile = File(context.filesDir, "$WORKFLOWS_DIR/$workflowId.json")
            if (!workflowFile.exists()) {
                Log.w(TAG, "Workflow file not found: $workflowId")
                return null
            }

            val json = workflowFile.readText()
            return gson.fromJson(json, Workflow::class.java)

        } catch (e: Exception) {
            Log.e(TAG, "Failed to load workflow: $workflowId", e)
            return null
        }
    }

    /**
     * Delete a workflow
     */
    fun deleteWorkflow(workflowId: String): Boolean {
        val context = contextRef ?: return false

        try {
            // Delete workflow file
            val workflowFile = File(context.filesDir, "$WORKFLOWS_DIR/$workflowId.json")
            if (workflowFile.exists()) {
                workflowFile.delete()
            }

            // Delete associated screenshots
            val screenshotsDir = File(context.filesDir, "screenshots")
            if (screenshotsDir.exists()) {
                screenshotsDir.listFiles()?.filter { it.name.startsWith(workflowId) }?.forEach {
                    it.delete()
                }
            }

            // Update index
            workflowIndex.removeAll { it.id == workflowId }
            saveIndex()

            Log.i(TAG, "Workflow deleted: $workflowId")
            return true

        } catch (e: Exception) {
            Log.e(TAG, "Failed to delete workflow: $workflowId", e)
            return false
        }
    }

    /**
     * Rename a workflow
     */
    fun renameWorkflow(workflowId: String, newName: String): Boolean {
        try {
            // Update index
            val metadata = workflowIndex.find { it.id == workflowId } ?: return false
            val index = workflowIndex.indexOf(metadata)
            workflowIndex[index] = metadata.copy(name = newName)
            saveIndex()

            // Update workflow file
            val workflow = loadWorkflow(workflowId) ?: return false
            val updatedWorkflow = workflow.copy(name = newName)
            val context = contextRef ?: return false
            val workflowFile = File(context.filesDir, "$WORKFLOWS_DIR/$workflowId.json")
            workflowFile.writeText(gson.toJson(updatedWorkflow))

            Log.i(TAG, "Workflow renamed: $workflowId -> $newName")
            return true

        } catch (e: Exception) {
            Log.e(TAG, "Failed to rename workflow", e)
            return false
        }
    }

    /**
     * Export workflow as JSON string
     */
    fun exportWorkflowAsJson(workflowId: String): String? {
        val workflow = loadWorkflow(workflowId) ?: return null
        return gson.toJson(workflow)
    }

    /**
     * Get total workflow count
     */
    fun getWorkflowCount(): Int = workflowIndex.size

    /**
     * Clear all workflows
     */
    fun clearAllWorkflows() {
        val context = contextRef ?: return

        try {
            val workflowDir = File(context.filesDir, WORKFLOWS_DIR)
            if (workflowDir.exists()) {
                workflowDir.deleteRecursively()
            }

            workflowIndex.clear()
            saveIndex()

            Log.i(TAG, "All workflows cleared")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to clear workflows", e)
        }
    }

    // =====================================================================
    // PRIVATE METHODS
    // =====================================================================

    private fun loadIndex() {
        val context = contextRef ?: return

        try {
            val indexFile = File(context.filesDir, INDEX_FILE)
            if (indexFile.exists()) {
                val json = indexFile.readText()
                val type = object : TypeToken<List<WorkflowMetadata>>() {}.type
                workflowIndex = gson.fromJson<List<WorkflowMetadata>>(json, type)?.toMutableList()
                    ?: mutableListOf()
                Log.i(TAG, "Loaded ${workflowIndex.size} workflows from index")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load workflow index", e)
            workflowIndex = mutableListOf()
        }
    }

    private fun saveIndex() {
        val context = contextRef ?: return

        try {
            val indexFile = File(context.filesDir, INDEX_FILE)
            indexFile.writeText(gson.toJson(workflowIndex))
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save workflow index", e)
        }
    }
}

/**
 * Full workflow data including events
 */
data class Workflow(
    val id: String,
    val name: String,
    val appPackage: String,
    val appName: String,
    val events: List<RecordedEvent>,
    val createdAt: Long,
    val durationMs: Long,
    val eventCount: Int,
    val category: String = "GENERAL"
) {
    /**
     * Format creation date for display
     */
    fun getFormattedDate(): String {
        val formatter = SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault())
        return formatter.format(Date(createdAt))
    }

    /**
     * Format duration for display
     */
    fun getFormattedDuration(): String {
        val seconds = (durationMs / 1000) % 60
        val minutes = (durationMs / 1000 / 60) % 60
        return if (minutes > 0) {
            "${minutes}m ${seconds}s"
        } else {
            "${seconds}s"
        }
    }
}

/**
 * Workflow metadata for listing (without events to save memory)
 */
data class WorkflowMetadata(
    val id: String,
    val name: String,
    val appPackage: String,
    val appName: String,
    val createdAt: Long,
    val durationMs: Long,
    val eventCount: Int,
    val category: String = "GENERAL"
) {
    /**
     * Format creation date for display
     */
    fun getFormattedDate(): String {
        val formatter = SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault())
        return formatter.format(Date(createdAt))
    }

    /**
     * Format short date for list items
     */
    fun getShortDate(): String {
        val formatter = SimpleDateFormat("MMM dd", Locale.getDefault())
        return formatter.format(Date(createdAt))
    }

    /**
     * Format duration for display
     */
    fun getFormattedDuration(): String {
        val seconds = (durationMs / 1000) % 60
        val minutes = (durationMs / 1000 / 60) % 60
        return if (minutes > 0) {
            "${minutes}m ${seconds}s"
        } else {
            "${seconds}s"
        }
    }
}
