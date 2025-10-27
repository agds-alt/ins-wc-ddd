// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './App.css'
import { authStorage } from './lib/authStorage.ts';
import { registerServiceWorker, initInstallPrompt } from './lib/pwa.ts';

// Validate storage before rendering app
authStorage.validateOnStartup();

// Register PWA service worker
if (import.meta.env.PROD) {
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