// src/components/PWAInstallPrompt.tsx - Install PWA Prompt
import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import {
  showInstallPrompt,
  isAppInstalled,
  isIOS,
  getInstallInstructions,
} from '../lib/pwa';

export const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed or dismissed
    if (isAppInstalled()) {
      return;
    }

    // Check if user dismissed prompt in this session
    const dismissed = sessionStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      return;
    }

    // Listen for install availability
    const handleInstallable = () => {
      setShowPrompt(true);
    };

    window.addEventListener('pwa-installable', handleInstallable);

    // Show for iOS users (can't auto-detect install prompt)
    if (isIOS() && !isAppInstalled()) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000); // Show after 3 seconds
    }

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
    };
  }, []);

  const handleInstall = async () => {
    const accepted = await showInstallPrompt();

    if (accepted) {
      setShowPrompt(false);
    } else {
      // User declined, hide for this session
      setIsDismissed(true);
      sessionStorage.setItem('pwa-prompt-dismissed', 'true');
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt || isDismissed || isAppInstalled()) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-300 md:left-auto md:right-4 md:w-96">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        {/* Icon and Title */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3
              className="font-bold text-gray-900 text-lg"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}
            >
              Install WC Check
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Install our app for faster access and offline support
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
            <span>Works offline</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
            <span>Quick access from home screen</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
            <span>Faster performance</span>
          </div>
        </div>

        {/* Install Instructions for iOS */}
        {isIOS() && (
          <div className="mb-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-900 font-medium mb-1">
              📱 How to install:
            </p>
            <p className="text-xs text-blue-700">
              {getInstallInstructions()}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          {!isIOS() && (
            <button
              onClick={handleInstall}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
            >
              <Download className="w-4 h-4" />
              Install Now
            </button>
          )}
          <button
            onClick={handleDismiss}
            className={`${isIOS() ? 'flex-1' : ''} bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors`}
          >
            {isIOS() ? 'Got it' : 'Later'}
          </button>
        </div>
      </div>
    </div>
  );
};
