import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

const FirebaseConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Simple connection check - you can enhance this with actual Firebase connection monitoring
    const checkConnection = () => {
      const connected = navigator.onLine;
      setIsConnected(connected);
      if (!connected) {
        setShowStatus(true);
      } else {
        // Hide status after a brief moment when reconnected
        setTimeout(() => setShowStatus(false), 2000);
      }
    };

    // Check initially
    checkConnection();

    // Listen for online/offline events
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  return (
    <AnimatePresence>
      {showStatus && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 z-[100] px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm border ${
            isConnected
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-600'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-300 dark:border-red-600'
          }`}
        >
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {isConnected ? 'Connected' : 'No Connection'}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FirebaseConnectionStatus;
