package com.exploris.app;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

import java.util.Locale;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Edge-to-edge: la ventana dibuja debajo de status/navigation bar.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }

    @Override
    public void onStart() {
        super.onStart();
        // El listener se registra en el root contentView (nunca null y recibe todos
        // los insets antes de que cualquier hijo los consuma). Desde ahí propagamos
        // los valores a CSS variables del WebView vía evaluateJavascript.
        View rootView = findViewById(android.R.id.content);
        if (rootView == null) {
            return;
        }
        ViewCompat.setOnApplyWindowInsetsListener(rootView, (view, insetsCompat) -> {
            Insets sys = insetsCompat.getInsets(
                    WindowInsetsCompat.Type.systemBars()
                            | WindowInsetsCompat.Type.displayCutout()
            );
            applyInsetsToWebView(sys);
            return insetsCompat;
        });
        ViewCompat.requestApplyInsets(rootView);
    }

    private void applyInsetsToWebView(Insets sys) {
        final WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView == null) {
            return;
        }
        float density = getResources().getDisplayMetrics().density;
        final String js = String.format(
                Locale.US,
                "document.documentElement.style.setProperty('--sat','%.2fpx');" +
                        "document.documentElement.style.setProperty('--sar','%.2fpx');" +
                        "document.documentElement.style.setProperty('--sab','%.2fpx');" +
                        "document.documentElement.style.setProperty('--sal','%.2fpx');",
                sys.top / density,
                sys.right / density,
                sys.bottom / density,
                sys.left / density
        );
        webView.post(() -> webView.evaluateJavascript(js, null));
    }
}
