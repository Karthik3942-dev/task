import { useCallback } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useAuthStore } from '../store/authStore';

export const useTaskRefresh = () => {
  const { user } = useAuthStore();
  const initializeRealTimeListeners = useTaskStore(state => state.initializeRealTimeListeners);

  const refreshTasks = useCallback(() => {
    if (user?.uid) {
      // Re-initialize the listeners to fetch fresh data
      const cleanup = initializeRealTimeListeners(user.uid);
      return cleanup;
    }
    return () => {};
  }, [user?.uid, initializeRealTimeListeners]);

  return { refreshTasks };
};
