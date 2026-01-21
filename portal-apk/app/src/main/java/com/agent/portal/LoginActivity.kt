package com.agent.portal

import android.content.Intent
import android.os.Bundle
import android.text.InputType
import android.util.Log
import android.util.Patterns
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.agent.portal.auth.AuthService
import com.agent.portal.auth.AuthSession
import com.agent.portal.auth.DeviceRegistrationService
import com.agent.portal.auth.SessionManager
import com.agent.portal.databinding.ActivityLoginBinding
import kotlinx.coroutines.launch


/**
 * Login activity for user authentication
 * 
 * Provides email/password login interface and manages authentication flow.
 */
class LoginActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityLoginBinding
    private lateinit var authService: AuthService
    private lateinit var sessionManager: SessionManager
    
    private var isPasswordVisible = false
    
    companion object {
        private const val TAG = "LoginActivity"
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize services
        authService = AuthService(this)
        sessionManager = SessionManager(this)
        
        // Check if already logged in
        if (sessionManager.isLoggedIn()) {
            Log.i(TAG, "User already logged in, navigating to MainActivity")
            navigateToMain()
            return
        }
        
        // Setup UI
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupUI()
        
        Log.d(TAG, "LoginActivity created")
    }
    
    private fun setupUI() {
        // Password visibility is handled by TextInputLayout endIconMode="password_toggle"
        // No manual toggle needed
        
        // Login button
        binding.btnLogin.setOnClickListener {
            val email = binding.etEmail.text.toString().trim()
            val password = binding.etPassword.text.toString()
            
            if (validateInput(email, password)) {
                performLogin(email, password)
            }
        }
        
        // Enter key on password field submits login
        binding.etPassword.setOnEditorActionListener { _, _, _ ->
            binding.btnLogin.performClick()
            true
        }
    }
    
    /**
     * Validate email and password inputs
     * 
     * @return true if inputs are valid, false otherwise
     */
    private fun validateInput(email: String, password: String): Boolean {
        // Reset errors
        binding.tilEmail.error = null
        binding.tilPassword.error = null
        
        var isValid = true
        
        // Validate email
        if (email.isEmpty()) {
            binding.tilEmail.error = "Email is required"
            isValid = false
        } else if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.tilEmail.error = "Invalid email format"
            isValid = false
        }
        
        // Validate password
        if (password.isEmpty()) {
            binding.tilPassword.error = "Password is required"
            isValid = false
        } else if (password.length < 6) {
            binding.tilPassword.error = "Password must be at least 6 characters"
            isValid = false
        }
        
        return isValid
    }
    
    /**
     * Perform login with backend API
     */
    private fun performLogin(email: String, password: String) {
        Log.i(TAG, "=== Login attempt for: $email ===")
        
        // Show loading state
        setLoading(true)
        
        lifecycleScope.launch {
            try {
                // Step 1: Login
                val response = authService.login(email, password)
                
                // Check if token is present (success indicator)
                if (!response.token.isNullOrEmpty() && response.user != null) {
                    // Save session
                    val session = AuthSession(
                        token = response.token,
                        userId = response.user.id,
                        userEmail = response.user.email,
                        userName = response.user.name
                    )
                    sessionManager.saveSession(session)
                    Log.i(TAG, "✅ Login successful for user: ${response.user.email}")
                    
                    // Step 2: Register device
                    try {
                        val deviceRegistrationService = DeviceRegistrationService(this@LoginActivity)
                        val deviceResponse = deviceRegistrationService.registerDevice(response.token)
                        
                        if (deviceResponse.success) {
                            Log.i(TAG, "✅ Device registered: ${deviceResponse.device?.name}")
                            
                            // Step 3: Connect to Socket.IO (if socket URL provided)
                            deviceResponse.device?.socketUrl?.let { socketUrl ->
                                connectToSocket(socketUrl, response.token)
                            } ?: run {
                                // Use NetworkUtils to get appropriate socket URL based on environment
                                val socketUrl = com.agent.portal.utils.NetworkUtils.getSocketUrl()
                                connectToSocket(socketUrl, response.token)
                            }
                        } else {
                            Log.w(TAG, "⚠️ Device registration failed: ${deviceResponse.message}")
                            // Continue anyway - device registration is optional
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "❌ Device registration error: ${e.message}", e)
                        // Continue anyway - device registration is optional
                    }
                    
                    Toast.makeText(
                        this@LoginActivity,
                        "Welcome, ${response.user.name ?: response.user.email}!",
                        Toast.LENGTH_SHORT
                    ).show()
                    
                    navigateToMain()
                } else {
                    Log.w(TAG, "⚠️ Login failed: ${response.message}")
                    
                    Toast.makeText(
                        this@LoginActivity,
                        response.message ?: "Login failed",
                        Toast.LENGTH_LONG
                    ).show()
                }
            } catch (e: Exception) {
                Log.e(TAG, "❌ Login error: ${e.message}", e)
                
                Toast.makeText(
                    this@LoginActivity,
                    "Error: ${e.message}",
                    Toast.LENGTH_LONG
                ).show()
            } finally {
                setLoading(false)
            }
        }
    }
    
    /**
     * Connect to Pusher server
     */
    private fun connectToSocket(socketUrl: String, authToken: String) {
        try {
            // Pusher/Soketi credentials
            val appKey = "clickai-key"
            
            // Parse socket URL from NetworkUtils
            val host = com.agent.portal.utils.NetworkUtils.getSocketHost()
            val port = com.agent.portal.utils.NetworkUtils.getSocketPort()
            val encrypted = com.agent.portal.utils.NetworkUtils.isSocketEncrypted()
            
            Log.i(TAG, "Connecting to Pusher: $host:$port (encrypted: $encrypted)")
            
            // Initialize SocketJobManager with Pusher credentials
            com.agent.portal.socket.SocketJobManager.init(
                context = this,
                appKey = appKey,
                host = host,
                port = port,
                encrypted = encrypted
            )
            com.agent.portal.socket.SocketJobManager.connect()
            
            Log.i(TAG, "✅ Pusher connection initiated")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Socket connection error: ${e.message}", e)
            // Don't fail the login if socket connection fails
        }
    }
    
    /**
     * Set loading state of UI
     */
    private fun setLoading(loading: Boolean) {
        binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        binding.btnLogin.isEnabled = !loading
        binding.etEmail.isEnabled = !loading
        binding.etPassword.isEnabled = !loading
        
        if (loading) {
            binding.btnLogin.text = "Signing in..."
        } else {
            binding.btnLogin.text = "Sign In"
        }
    }
    
    /**
     * Navigate to MainActivity and clear login activity from back stack
     */
    private fun navigateToMain() {
        val intent = Intent(this, MainActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
}
