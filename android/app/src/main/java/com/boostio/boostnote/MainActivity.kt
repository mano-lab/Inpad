//package com.boostio.boostnote
//
//import androidx.appcompat.app.AppCompatActivity
//import android.os.Bundle
//
//class MainActivity : AppCompatActivity() {
//    override fun onCreate(savedInstanceState: Bundle?) {
//        super.onCreate(savedInstanceState)
//        setContentView(R.layout.activity_main)
//    }
//}

package com.boostio.boostnote

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.webkit.*
import android.webkit.WebView
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat.startActivity



class MainActivity : AppCompatActivity() {
    val ctx: AppCompatActivity = this

    val authStatePreferencesKey = "com.boostio.boostnote.authState"
//    val mobileBaseUrl = "http://localhost:3005"
    val mobileBaseUrl = "https://mobile-hubfriend123-staging.boostnote.io"

    class WebAppInterface(private val mContext: MainActivity) {

        @JavascriptInterface
        fun openUrl(url: String) {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            startActivity(mContext, intent, null);
        }
        @JavascriptInterface
        fun openAuthUrl(url: String, state: String) {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))

            val sharedPref = mContext.getPreferences(Context.MODE_PRIVATE)
            with (sharedPref.edit()) {
                putString(mContext.authStatePreferencesKey, state)
                apply()
            }
            startActivity(mContext, intent, null);
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main);

        val view = findViewById<WebView>(R.id.webview);
        val settings = view.settings;
        settings.javaScriptEnabled = true;
        settings.allowContentAccess = true;
        settings.domStorageEnabled = true;
        settings.userAgentString = settings.userAgentString + " BoostNote-Mobile-Android"
        view.webViewClient = WebViewClient()
        view.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(message: String, lineNumber: Int, sourceID: String) {
                Log.d("WebView", "$message -- From line $lineNumber of $sourceID")
            }
        }
        view.addJavascriptInterface(WebAppInterface(this), "Android")

        this.handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)

        Log.d("Yolo","from new intent");
        this.handleIntent(intent)
    }

    fun handleIntent(intent: Intent) {

        if (
            !this.resolveAuthIntent(intent)) {

            val view = findViewById<WebView>(R.id.webview);
            view.loadUrl(this.mobileBaseUrl);
        }
    }

    fun resolveAuthIntent(intent: Intent):Boolean {
        val sharedPref = this.getPreferences(Context.MODE_PRIVATE) ?: return false
        val state = sharedPref.getString(authStatePreferencesKey, "")

        val data: Uri? = intent.data

        if (state === "") {return false }
        if (data == null) {return false}
        if (data.host != "boosthub") {return false}
        if (data.path != "/login") {return false}

        val code = data.getQueryParameter("code") ?: return false

        val view = findViewById<WebView>(R.id.webview);
        view.loadUrl(this.mobileBaseUrl + "?state=" + state + "&code="+code);
        return true
    }



}
