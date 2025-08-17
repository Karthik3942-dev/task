import { useEffect, useCallback } from 'react';
import { useTaskStore, useTaskActions, useTaskData } from '../store/taskStore';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export const useTaskManagement = () => {
  const { user } = useAuthStore();
  const { tasks, loading, userMap } = useTaskData();
  const { 
    updateTaskStatus, 
    updateTaskProgress, 
    addTask, 
    deleteTask, 
    initializeRealTimeListeners 
  } = useTaskActions();

  // Initialize real-time listeners when user is available
  useEffect(() => {
    if (!user?.uid) return;
    
    console.log('Initializing task listeners for user:', user.uid);
    const cleanup = initializeRealTimeListeners(user.uid);
    
    return cleanup;
  }, [user?.uid, initializeRealTimeListeners]);

  // Enhanced task operations with user feedback
  const moveTask = useCallback(async (taskId: string, newStatus: string, additionalData?: any) => {
    try {
      await updateTaskStatus(taskId, newStatus, additionalData);
      return true;
    } catch (error) {
      console.error('Failed to move task:', error);
      return false;
    }
  }, [updateTaskStatus]);

  const updateProgress = useCallback(async (taskId: string, progressData: any) => {
    try {
      await updateTaskProgress(taskId, progressData);
      return true;
    } catch (error) {
      console.error('Failed to update progress:', error);
      return false;
    }
  }, [updateTaskProgress]);

  const createTask = useCallback(async (taskData: any) => {
    try {
      await addTask({
        ...taskData,
        created_by: user?.uid,
        assigned_to: taskData.assigned_to || user?.uid,
      });
      return true;
    } catch (error) {
      console.error('Failed to create task:', error);
      return false;
    }
  }, [addTask, user?.uid]);

  const removeTask = useCallback(async (taskId: string) => {
    try {
      await deleteTask(taskId);
      return true;
    } catch (error) {
      console.error('Failed to delete task:', error);
      return false;
    }
  }, [deleteTask]);

  // Filter tasks by status
  const getTasksByStatus = useCallback((status: string) => {
    return tasks.filter(task => 
      task.status === status || task.progress_status === status
    );
  }, [tasks]);

  // Get task statistics
  const getTaskStats = useCallback(() => {
    const stats = {
      total: tasks.length,
      pending: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0,
    };

    const now = new Date();
    
    tasks.forEach(task => {
      const status = task.progress_status || task.status;
      if (status === 'pending') stats.pending++;
      else if (status === 'in_progress') stats.in_progress++;
      else if (status === 'completed') stats.completed++;

      // Check for overdue tasks
      if (task.due_date && status !== 'completed') {
        const dueDate = new Date(task.due_date.toDate?.() || task.due_date);
        if (dueDate < now) {
          stats.overdue++;
        }
      }
    });

    return stats;
  }, [tasks]);

  return {
    // Data
    tasks,
    loading,
    userMap,
    
    // Actions
    moveTask,
    updateProgress,
    createTask,
    removeTask,
    
    // Getters
    getTasksByStatus,
    getTaskStats,
    
    // Raw actions (for advanced use)
    updateTaskStatus,
    updateTaskProgress,
    addTask,
    deleteTask,
  };
};
