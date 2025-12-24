package com.agent.portal.keyboard

import android.inputmethodservice.InputMethodService
import android.util.Log
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.LinearLayout

/**
 * Custom Keyboard IME for agent text input
 *
 * This keyboard is invisible and only used for programmatic text input.
 * It allows inputting any Unicode text including special characters.
 */
class PortalKeyboardIME : InputMethodService() {

    companion object {
        private const val TAG = "PortalKeyboardIME"

        @Volatile
        var instance: PortalKeyboardIME? = null
            private set
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        Log.i(TAG, "Keyboard IME created")
    }

    override fun onCreateInputView(): View {
        // Return empty/invisible view
        // We don't need a visual keyboard
        return LinearLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(0, 0)
        }
    }

    override fun onStartInputView(info: EditorInfo?, restarting: Boolean) {
        super.onStartInputView(info, restarting)
        Log.d(TAG, "Input view started")
    }

    override fun onFinishInput() {
        super.onFinishInput()
        Log.d(TAG, "Input finished")
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
        Log.i(TAG, "Keyboard IME destroyed")
    }

    /**
     * Input text to the current focused field
     */
    fun inputText(text: String) {
        val ic = currentInputConnection
        if (ic != null) {
            // Commit the text
            ic.commitText(text, 1)
            Log.d(TAG, "Text input: ${text.take(30)}...")
        } else {
            Log.w(TAG, "No input connection available")
        }
    }

    /**
     * Clear current input
     */
    fun clearInput() {
        val ic = currentInputConnection
        if (ic != null) {
            // Select all and delete
            val extracted = ic.getExtractedText(android.view.inputmethod.ExtractedTextRequest(), 0)
            if (extracted != null && extracted.text != null) {
                ic.deleteSurroundingText(extracted.text.length, 0)
            }
        }
    }

    /**
     * Send key event
     */
    fun sendKeyEvent(keyCode: Int) {
        val ic = currentInputConnection
        if (ic != null) {
            ic.sendKeyEvent(android.view.KeyEvent(android.view.KeyEvent.ACTION_DOWN, keyCode))
            ic.sendKeyEvent(android.view.KeyEvent(android.view.KeyEvent.ACTION_UP, keyCode))
        }
    }

    /**
     * Send Enter key
     */
    fun sendEnter() {
        sendKeyEvent(android.view.KeyEvent.KEYCODE_ENTER)
    }

    /**
     * Send Backspace key
     */
    fun sendBackspace() {
        val ic = currentInputConnection
        ic?.deleteSurroundingText(1, 0)
    }
}
