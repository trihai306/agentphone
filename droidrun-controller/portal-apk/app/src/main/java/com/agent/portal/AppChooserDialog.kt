package com.agent.portal

import android.app.AlertDialog
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.drawable.Drawable
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Filter
import android.widget.Filterable
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.widget.SearchView
import java.util.concurrent.Executors

/**
 * Dialog for choosing an installed app to launch for recording
 * With Recently Used Apps and Loading Skeleton
 */
class AppChooserDialog(
    private val context: Context,
    private val onAppSelected: (AppInfo) -> Unit
) {

    data class AppInfo(
        val packageName: String,
        val appName: String,
        val icon: Drawable,
        val isRecent: Boolean = false,
        val lastUsedTime: Long = 0
    )

    private var dialog: AlertDialog? = null
    private var allApps: List<AppInfo> = emptyList()
    private var adapter: AppAdapter? = null
    private val executor = Executors.newSingleThreadExecutor()
    private val mainHandler = Handler(Looper.getMainLooper())

    // SharedPreferences for recently used apps (fallback if UsageStats not available)
    private val recentAppsPrefs by lazy {
        context.getSharedPreferences("recent_apps", Context.MODE_PRIVATE)
    }

    fun show() {
        // Create dialog view
        val dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_app_chooser, null)
        val searchView = dialogView.findViewById<SearchView>(R.id.searchApps)
        val listView = dialogView.findViewById<android.widget.ListView>(R.id.listApps)
        val tvAppCount = dialogView.findViewById<TextView>(R.id.tvAppCount)
        val layoutEmpty = dialogView.findViewById<View>(R.id.layoutEmpty)
        val progressBar = dialogView.findViewById<ProgressBar>(R.id.progressBar)
        val layoutLoading = dialogView.findViewById<View>(R.id.layoutLoading)

        // Show loading state
        layoutLoading?.visibility = View.VISIBLE
        listView.visibility = View.GONE
        progressBar?.visibility = View.VISIBLE
        tvAppCount.text = "Loading apps..."

        // Create and show dialog
        dialog = AlertDialog.Builder(context, android.R.style.Theme_Material_Light_NoActionBar_Fullscreen)
            .setView(dialogView)
            .create()

        dialog?.window?.setLayout(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        )

        dialog?.show()

        // Load apps asynchronously
        executor.execute {
            val apps = loadInstalledAppsWithRecent()

            mainHandler.post {
                allApps = apps

                // Hide loading, show list
                layoutLoading?.visibility = View.GONE
                listView.visibility = View.VISIBLE
                progressBar?.visibility = View.GONE

                // Update app count
                val recentCount = apps.count { it.isRecent }
                tvAppCount.text = if (recentCount > 0) {
                    "$recentCount recent • ${apps.size} total"
                } else {
                    "${apps.size} apps available"
                }

                // Setup adapter
                adapter = AppAdapter(context, apps.toMutableList(), onEmptyStateChanged = { isEmpty ->
                    if (isEmpty) {
                        listView.visibility = View.GONE
                        layoutEmpty.visibility = View.VISIBLE
                    } else {
                        listView.visibility = View.VISIBLE
                        layoutEmpty.visibility = View.GONE
                    }
                })
                listView.adapter = adapter

                // Setup search
                searchView.setOnQueryTextListener(object : SearchView.OnQueryTextListener {
                    override fun onQueryTextSubmit(query: String?): Boolean = false

                    override fun onQueryTextChange(newText: String?): Boolean {
                        adapter?.filter?.filter(newText)
                        return true
                    }
                })

                // Setup click listener
                listView.setOnItemClickListener { _, _, position, _ ->
                    Log.d("AppChooserDialog", "Item clicked at position: $position")
                    val selectedApp = adapter?.getItem(position)
                    Log.d("AppChooserDialog", "Selected app: ${selectedApp?.appName} (${selectedApp?.packageName})")
                    if (selectedApp != null) {
                        // Save to recent apps
                        saveRecentApp(selectedApp.packageName)
                        Log.d("AppChooserDialog", "Dismissing dialog and calling onAppSelected...")
                        dialog?.dismiss()
                        onAppSelected(selectedApp)
                        Log.d("AppChooserDialog", "onAppSelected callback completed")
                    } else {
                        Log.e("AppChooserDialog", "selectedApp is null!")
                    }
                }
            }
        }
    }

    /**
     * Load installed apps with recently used apps at the top
     */
    private fun loadInstalledAppsWithRecent(): List<AppInfo> {
        val pm = context.packageManager

        // Get recent apps usage stats
        val recentPackages = getRecentlyUsedPackages()

        // Get all launcher apps using MATCH_ALL flag for Android 11+
        val launcherIntent = Intent(Intent.ACTION_MAIN, null)
        launcherIntent.addCategory(Intent.CATEGORY_LAUNCHER)

        // Use MATCH_ALL to get all matching activities
        val launcherApps = pm.queryIntentActivities(launcherIntent, PackageManager.MATCH_ALL)

        Log.d("AppChooserDialog", "Found ${launcherApps.size} launcher apps with MATCH_ALL")

        val appsList = launcherApps
            .mapNotNull { resolveInfo ->
                try {
                    val packageName = resolveInfo.activityInfo.packageName

                    // Exclude our own app
                    if (packageName == context.packageName) {
                        return@mapNotNull null
                    }

                    val appInfo = pm.getApplicationInfo(packageName, 0)
                    val isRecent = recentPackages.containsKey(packageName)
                    val lastUsed = recentPackages[packageName] ?: 0L

                    AppInfo(
                        packageName = packageName,
                        appName = pm.getApplicationLabel(appInfo).toString(),
                        icon = pm.getApplicationIcon(appInfo),
                        isRecent = isRecent,
                        lastUsedTime = lastUsed
                    )
                } catch (e: Exception) {
                    Log.e("AppChooserDialog", "Error loading app: ${resolveInfo.activityInfo?.packageName}", e)
                    null
                }
            }
            .distinctBy { it.packageName }

        Log.d("AppChooserDialog", "Final app list: ${appsList.size} apps")

        // Sort: Recent apps first (by last used time), then alphabetically
        return appsList.sortedWith(
            compareByDescending<AppInfo> { it.isRecent }
                .thenByDescending { it.lastUsedTime }
                .thenBy { it.appName.lowercase() }
        )
    }

    /**
     * Get recently used packages from UsageStatsManager or SharedPreferences fallback
     */
    private fun getRecentlyUsedPackages(): Map<String, Long> {
        val recentPackages = mutableMapOf<String, Long>()

        // Try UsageStatsManager first (requires permission)
        try {
            val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
            if (usageStatsManager != null) {
                val endTime = System.currentTimeMillis()
                val startTime = endTime - (7 * 24 * 60 * 60 * 1000L) // Last 7 days

                val usageStats = usageStatsManager.queryUsageStats(
                    UsageStatsManager.INTERVAL_DAILY,
                    startTime,
                    endTime
                )

                if (usageStats != null && usageStats.isNotEmpty()) {
                    // Get top 10 most recently used apps
                    usageStats
                        .filter { it.totalTimeInForeground > 0 }
                        .sortedByDescending { it.lastTimeUsed }
                        .take(10)
                        .forEach { stat ->
                            recentPackages[stat.packageName] = stat.lastTimeUsed
                        }

                    if (recentPackages.isNotEmpty()) {
                        return recentPackages
                    }
                }
            }
        } catch (e: Exception) {
            // UsageStats permission not granted or error
        }

        // Fallback to SharedPreferences
        val savedRecent = recentAppsPrefs.getString("recent_list", "") ?: ""
        if (savedRecent.isNotEmpty()) {
            savedRecent.split(",").forEachIndexed { index, pkg ->
                if (pkg.isNotBlank()) {
                    recentPackages[pkg] = System.currentTimeMillis() - (index * 1000)
                }
            }
        }

        return recentPackages
    }

    /**
     * Save app to recent apps list
     */
    private fun saveRecentApp(packageName: String) {
        val current = recentAppsPrefs.getString("recent_list", "") ?: ""
        val apps = current.split(",").filter { it.isNotBlank() && it != packageName }.toMutableList()
        apps.add(0, packageName)

        // Keep only last 10
        val newList = apps.take(10).joinToString(",")
        recentAppsPrefs.edit().putString("recent_list", newList).apply()
    }

    /**
     * Adapter for displaying apps in list
     */
    private class AppAdapter(
        context: Context,
        private val apps: MutableList<AppInfo>,
        private val onEmptyStateChanged: (Boolean) -> Unit = {}
    ) : ArrayAdapter<AppInfo>(context, 0, apps), Filterable {

        private val allApps = apps.toList()
        private var filteredApps = apps.toList()

        override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
            val view = convertView ?: LayoutInflater.from(context)
                .inflate(R.layout.item_app, parent, false)

            val app = getItem(position) ?: return view

            val iconView = view.findViewById<ImageView>(R.id.appIcon)
            val nameView = view.findViewById<TextView>(R.id.appName)
            val packageView = view.findViewById<TextView>(R.id.appPackage)
            val recentBadge = view.findViewById<TextView>(R.id.recentBadge)

            iconView.setImageDrawable(app.icon)
            nameView.text = app.appName
            packageView.text = app.packageName

            // Show/hide recent badge
            if (recentBadge != null) {
                recentBadge.visibility = if (app.isRecent) View.VISIBLE else View.GONE
            }

            return view
        }

        override fun getCount(): Int = filteredApps.size

        override fun getItem(position: Int): AppInfo? = filteredApps.getOrNull(position)

        override fun getFilter(): Filter {
            return object : Filter() {
                override fun performFiltering(constraint: CharSequence?): FilterResults {
                    val query = constraint?.toString()?.lowercase() ?: ""

                    val filtered = if (query.isEmpty()) {
                        allApps
                    } else {
                        allApps.filter { app ->
                            app.appName.lowercase().contains(query) ||
                                    app.packageName.lowercase().contains(query)
                        }
                    }

                    return FilterResults().apply {
                        values = filtered
                        count = filtered.size
                    }
                }

                @Suppress("UNCHECKED_CAST")
                override fun publishResults(constraint: CharSequence?, results: FilterResults?) {
                    filteredApps = (results?.values as? List<AppInfo>) ?: emptyList()
                    clear()
                    addAll(filteredApps)
                    notifyDataSetChanged()

                    onEmptyStateChanged(filteredApps.isEmpty())
                }
            }
        }
    }
}
