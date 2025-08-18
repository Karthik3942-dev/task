import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { useTaskRefresh } from "../hooks/useTaskRefresh";

interface NetworkStatusProps {
  onRetry?: () => void;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ onRetry }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const { refreshTasks } = useTaskRefresh();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
      toast.success("Connection restored!", {
        icon: "🟢",
        duration: 3000,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
      toast.error("Connection lost. Working offline.", {
        icon: "🔴",
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show offline message if already offline
    if (!navigator.onLine) {
      setShowOfflineMessage(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineMessage && isOnline) {
    return null;
  }

  return (
    <AnimatePresence>
      {(showOfflineMessage || !isOnline) && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 bg-red-500 dark:bg-red-600 text-white px-4 py-3 flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5" />
            <span className="text-sm font-medium">
              {isOnline ? "Connection restored" : "No internet connection - Working offline"}
            </span>
          </div>
          
          {!isOnline && (
            <button
              onClick={() => {
                if (navigator.onLine) {
                  // Refresh tasks data
                  refreshTasks();
                  if (onRetry) onRetry();
                  setShowOfflineMessage(false);
                  toast.success("Refreshing data...");
                } else {
                  toast.error("Still offline. Please check your connection.");
                }
              }}
              className="flex items-center gap-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          )}
          
          {isOnline && (
            <button
              onClick={() => setShowOfflineMessage(false)}
              className="flex items-center gap-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md text-sm transition-colors"
            >
              Dismiss
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback?: React.ComponentType<{ error: Error; retry: () => void }> }>,
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Report to error monitoring service
    if (error.message.includes('Firebase') || error.message.includes('fetch')) {
      toast.error("Connection issue detected. Please check your internet connection.");
    } else {
      toast.error("Something went wrong. Please refresh the page.");
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} retry={this.retry} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => {
  const isNetworkError = error.message.toLowerCase().includes('fetch') || 
                        error.message.toLowerCase().includes('network') ||
                        error.message.toLowerCase().includes('firebase');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4"
    >
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          {isNetworkError ? (
            <WifiOff className="w-8 h-8 text-red-600 dark:text-red-400" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          )}
        </motion.div>
        
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {isNetworkError ? "Connection Problem" : "Something went wrong"}
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {isNetworkError 
            ? "We're having trouble connecting to our servers. Please check your internet connection and try again."
            : "An unexpected error occurred. Don't worry, your data is safe."
          }
        </p>
        
        <div className="space-y-3">
          <button
            onClick={retry}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors"
          >
            Refresh Page
          </button>
        </div>
        
        {error.message && (
          <details className="mt-6 text-left">
            <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
              Error Details
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs text-gray-800 dark:text-gray-200 overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </motion.div>
  );
};

export default NetworkStatus;
