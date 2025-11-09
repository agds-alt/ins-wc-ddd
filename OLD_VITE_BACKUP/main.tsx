// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './App.css'
import { authStorage } from './lib/authStorage.ts';
import { registerServiceWorker, initInstallPrompt } from './lib/pwa.ts';

// Validate storage before rendering app
authStorage.validateOnStartup();

// Register PWA service worker - WITH EMERGENCY DISABLE
// Add ?disable-sw to URL to disable service worker
const urlParams = new URLSearchParams(window.location.search);
const disableSW = urlParams.get('disable-sw') === 'true';

if (disableSW) {
  console.log('🛑 Service worker disabled via URL parameter');
  // Unregister all service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
  }
  sessionStorage.clear(); // Clear any stuck states
} else if (import.meta.env.PROD) {
  registerServiceWorker();
  initInstallPrompt();
  console.log('🚀 PWA features enabled');
} else {
  console.log('⚠️ PWA features disabled in development mode');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);