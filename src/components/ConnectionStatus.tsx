import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface ConnectionStatusProps {
  className?: string;
}

export function ConnectionStatus({ className = '' }: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRetrying, setIsRetrying] = useState(false);
  const { connectionError, retryConnection } = useAuthStore();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Internet connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Internet connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await retryConnection();
    } finally {
      setIsRetrying(false);
    }
  };

  // Don't show if everything is working fine
  if (isOnline && !connectionError) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border
        ${!isOnline 
          ? 'bg-red-50/90 border-red-200 dark:bg-red-900/20 dark:border-red-800' 
          : connectionError 
          ? 'bg-yellow-50/90 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
          : 'bg-green-50/90 border-green-200 dark:bg-green-900/20 dark:border-green-800'
        }
      `}>
        {/* Status Icon */}
        <div className="flex-shrink-0">
          {!isOnline ? (
            <WifiOff className="w-5 h-5 text-red-600 dark:text-red-400" />
          ) : connectionError ? (
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          )}
        </div>

        {/* Status Message */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${
            !isOnline 
              ? 'text-red-800 dark:text-red-200' 
              : connectionError 
              ? 'text-yellow-800 dark:text-yellow-200'
              : 'text-green-800 dark:text-green-200'
          }`}>
            {!isOnline 
              ? 'No Internet Connection' 
              : connectionError 
              ? 'Firebase Connection Issue'
              : 'Connection Restored'
            }
          </p>
          <p className={`text-xs ${
            !isOnline 
              ? 'text-red-600 dark:text-red-300' 
              : connectionError 
              ? 'text-yellow-600 dark:text-yellow-300'
              : 'text-green-600 dark:text-green-300'
          }`}>
            {!isOnline 
              ? 'Check your network connection' 
              : connectionError 
              ? 'Some features may not work properly'
              : 'All systems operational'
            }
          </p>
        </div>

        {/* Retry Button */}
        {(connectionError || !isOnline) && (
          <button
            onClick={handleRetry}
            disabled={isRetrying || !isOnline}
            className={`
              flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all
              ${!isOnline
                ? 'bg-red-100 text-red-700 cursor-not-allowed opacity-50 dark:bg-red-800/50 dark:text-red-300'
                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-800/50 dark:text-yellow-300 dark:hover:bg-yellow-700/50'
              }
              ${isRetrying ? 'cursor-not-allowed' : 'hover:scale-105'}
            `}
          >
            <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : 'Retry'}
          </button>
        )}
      </div>
    </div>
  );
}

// Simplified offline indicator for minimal UI
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full shadow-lg">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">Offline</span>
      </div>
    </div>
  );
}

export default ConnectionStatus;
