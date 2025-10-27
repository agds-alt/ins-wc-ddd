// PWA utilities for service worker and install prompt

let deferredPrompt: any = null;

/**
 * Register service worker for PWA functionality
 */
export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      console.log('🔄 Registering service worker...');

      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });

      console.log('✅ Service worker registered:', registration.scope);

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New service worker available');
              // Notify user about update (optional)
              if (confirm('New version available! Reload to update?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        }
      });

      // Reload page when new service worker takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

    } catch (error) {
      console.error('❌ Service worker registration failed:', error);
    }
  } else {
    console.log('⚠️ Service workers not supported');
  }
};

/**
 * Initialize install prompt listener
 */
export const initInstallPrompt = (): void => {
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('📱 Install prompt available');
    e.preventDefault();
    deferredPrompt = e;

    // Dispatch custom event that components can listen to
    window.dispatchEvent(new Event('pwa-installable'));
  });

  // Track if app was installed
  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA installed successfully');
    deferredPrompt = null;

    // Dispatch custom event
    window.dispatchEvent(new Event('pwa-installed'));
  });
};

/**
 * Show install prompt to user
 * Returns true if user accepted, false if declined or not available
 */
export const showInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    console.log('⚠️ Install prompt not available');
    return false;
  }

  try {
    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for user choice
    const choiceResult = await deferredPrompt.userChoice;
    console.log('User choice:', choiceResult.outcome);

    if (choiceResult.outcome === 'accepted') {
      console.log('✅ User accepted install');
      return true;
    } else {
      console.log('❌ User dismissed install');
      return false;
    }
  } catch (error) {
    console.error('❌ Error showing install prompt:', error);
    return false;
  } finally {
    deferredPrompt = null;
  }
};

/**
 * Check if app is already installed
 */
export const isAppInstalled = (): boolean => {
  // Check if running in standalone mode (installed PWA)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // Check iOS standalone
  const isIOSStandalone = (window.navigator as any).standalone === true;

  return isStandalone || isIOSStandalone;
};

/**
 * Check if install prompt is available
 */
export const canShowInstallPrompt = (): boolean => {
  return deferredPrompt !== null;
};

/**
 * Check if device is iOS
 */
export const isIOS = (): boolean => {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
};

/**
 * Check if device is Android
 */
export const isAndroid = (): boolean => {
  return /Android/.test(navigator.userAgent);
};

/**
 * Get install instructions based on platform
 */
export const getInstallInstructions = (): string => {
  if (isIOS()) {
    return 'Tap the Share button and select "Add to Home Screen"';
  } else if (isAndroid()) {
    return 'Tap the menu and select "Install App" or "Add to Home Screen"';
  } else {
    return 'Look for the install button in your browser\'s address bar';
  }
};

/**
 * Clear service worker cache
 */
export const clearServiceWorkerCache = async (): Promise<void> => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    console.log('🗑️ Service worker cache cleared');
  }
};

/**
 * Unregister service worker (for debugging)
 */
export const unregisterServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('🗑️ Service worker unregistered');
    }
  }
};
