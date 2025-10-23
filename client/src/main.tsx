import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./index.css";
// TEMPORARILY DISABLED - Global CSS was too aggressive and breaking layouts
// import "./premium-global.css";

// NUCLEAR OPTION: Aggressively unregister ALL service workers and clear ALL caches
// This ensures no stale cached code prevents users from seeing updates
if ('serviceWorker' in navigator) {
  // Step 1: Unregister all service workers
  navigator.serviceWorker.getRegistrations().then(async registrations => {
    console.log(`🔥 NUCLEAR CACHE CLEAR: Found ${registrations.length} service worker(s) - unregistering ALL`);

    // Unregister all service workers in parallel
    await Promise.all(registrations.map(registration =>
      registration.unregister().then(success => {
        if (success) {
          console.log('✅ Successfully unregistered service worker:', registration.scope);
        }
        return success;
      })
    ));

    // Step 2: Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`🔥 NUCLEAR CACHE CLEAR: Found ${cacheNames.length} cache(s) - clearing ALL`);

      await Promise.all(cacheNames.map(cacheName =>
        caches.delete(cacheName).then(() => {
          console.log(`✅ Cleared cache: ${cacheName}`);
        })
      ));
    }

    // Step 3: Force reload if we cleared anything (but only once per session)
    if (registrations.length > 0 && !sessionStorage.getItem('sw-nuclear-cleared')) {
      console.log('🚀 Forcing page reload to ensure fresh start...');
      sessionStorage.setItem('sw-nuclear-cleared', 'true');
      window.location.reload();
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
