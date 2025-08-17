import { create } from 'zustand';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  doc, 
  serverTimestamp,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  Unsubscribe
} from 'firebase/firestore';
import { db, withErrorHandling } from '../lib/firebase';
import toast from 'react-hot-toast';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress_status?: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assigned_to: string;
  created_by: string;
  due_date?: any;
  task_id?: string;
  linked_ticket?: string;
  progress_description?: string;
  progress_link?: string;
  progress_updated_at?: any;
  created_at?: any;
  comments?: Array<{ text: string; author: string; created_at: any }>;
  reassign_count?: number;
  tags?: string;
  project_id?: string;
  progress?: number;
}

interface TaskStore {
  tasks: Task[];
  loading: boolean;
  userMap: Record<string, string>;
  
  // Actions
  initializeRealTimeListeners: (userId: string) => () => void;
  updateTaskStatus: (taskId: string, status: string, progressData?: any) => Promise<void>;
  updateTaskProgress: (taskId: string, progressData: any) => Promise<void>;
  addTask: (taskData: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  
  // Getters
  getTasksByStatus: (status: string) => Task[];
  getTaskById: (taskId: string) => Task | undefined;
  getUserTasks: (userId: string) => Task[];
  
  // Internal state management
  setTasks: (tasks: Task[]) => void;
  setLoading: (loading: boolean) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  removeTask: (taskId: string) => void;
  addTaskToStore: (task: Task) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: false,
  userMap: {},

  // Initialize real-time listeners
  initializeRealTimeListeners: (userId: string) => {
    const unsubscribers: Unsubscribe[] = [];
    
    try {
      set({ loading: true });
      
      // Listen to tasks assigned to the user
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('assigned_to', '==', userId)
      );
      
      const unsubscribeTasks = onSnapshot(
        tasksQuery,
        async (snapshot) => {
          try {
            const tasksData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Task[];

            // Fetch user names for created_by fields
            const createdByIds = [...new Set(tasksData.map(task => task.created_by))];
            const userMapping: Record<string, string> = {};
            
            if (createdByIds.length > 0) {
              const userPromises = createdByIds.map(async (id) => {
                try {
                  const userDoc = await getDoc(doc(db, 'employees', id));
                  if (userDoc.exists()) {
                    const userData = userDoc.data();
                    userMapping[id] = userData.name || id;
                  }
                } catch (error) {
                  console.warn('Failed to fetch user data for:', id);
                  userMapping[id] = id;
                }
              });
              
              await Promise.all(userPromises);
            }

            // Enrich tasks with user names
            const enrichedTasks = tasksData.map(task => ({
              ...task,
              created_by: userMapping[task.created_by] || task.created_by
            }));

            set({ 
              tasks: enrichedTasks, 
              userMap: userMapping,
              loading: false 
            });

            console.log('Tasks updated via real-time listener:', enrichedTasks.length);
          } catch (error) {
            console.error('Error processing task updates:', error);
            set({ loading: false });
          }
        },
        (error) => {
          console.error('Task listener error:', error);
          toast.error('Lost connection to task updates');
          set({ loading: false });
        }
      );

      unsubscribers.push(unsubscribeTasks);

      // Return cleanup function
      return () => {
        unsubscribers.forEach(unsubscribe => {
          try {
            unsubscribe();
          } catch (error) {
            console.warn('Error unsubscribing from task updates:', error);
          }
        });
      };
    } catch (error) {
      console.error('Failed to setup task listeners:', error);
      set({ loading: false });
      toast.error('Failed to setup real-time updates');
      return () => {};
    }
  },

  // Update task status (both status and progress_status)
  updateTaskStatus: async (taskId: string, newStatus: string, progressData?: any) => {
    try {
      await withErrorHandling(async () => {
        const taskRef = doc(db, 'tasks', taskId);
        const updateData: any = {
          status: newStatus,
          progress_status: newStatus,
          progress_updated_at: serverTimestamp(),
        };

        // Add progress data if provided
        if (progressData) {
          if (progressData.progress_description) {
            updateData.progress_description = progressData.progress_description;
          }
          if (progressData.progress_link) {
            updateData.progress_link = progressData.progress_link;
          }
        }

        await updateDoc(taskRef, updateData);
        
        // Update local state immediately for optimistic updates
        get().updateTask(taskId, updateData);
        
        toast.success(`Task moved to ${newStatus.replace('_', ' ')} 📈`);
      }, undefined, 'Updating task status');
    } catch (error: any) {
      console.error('Error updating task status:', error);
      toast.error(error.message || 'Failed to update task status');
      throw error;
    }
  },

  // Update task progress with detailed information
  updateTaskProgress: async (taskId: string, progressData: any) => {
    try {
      await withErrorHandling(async () => {
        const taskRef = doc(db, 'tasks', taskId);
        const updateData = {
          progress_status: progressData.progress_status,
          progress_description: progressData.progress_description || '',
          progress_link: progressData.progress_link || '',
          progress_updated_at: serverTimestamp(),
        };

        await updateDoc(taskRef, updateData);
        
        // Update local state immediately
        get().updateTask(taskId, updateData);
        
        toast.success('Progress updated successfully! 🎉');
      }, undefined, 'Updating task progress');
    } catch (error: any) {
      console.error('Error updating task progress:', error);
      toast.error(error.message || 'Failed to update progress');
      throw error;
    }
  },

  // Add new task
  addTask: async (taskData: Partial<Task>) => {
    try {
      await withErrorHandling(async () => {
        const newTask = {
          ...taskData,
          created_at: serverTimestamp(),
          task_id: `TASK-${Date.now()}`,
          status: taskData.status || 'pending',
          progress_status: taskData.progress_status || 'pending',
          progress: 0,
          comments: [],
          reassign_count: 0,
        };

        const docRef = await addDoc(collection(db, 'tasks'), newTask);
        
        // Add to local state immediately
        get().addTaskToStore({
          id: docRef.id,
          ...newTask
        } as Task);
        
        toast.success('Task created successfully! 🎉');
      }, undefined, 'Creating task');
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast.error(error.message || 'Failed to create task');
      throw error;
    }
  },

  // Delete task
  deleteTask: async (taskId: string) => {
    try {
      await withErrorHandling(async () => {
        await deleteDoc(doc(db, 'tasks', taskId));
        
        // Remove from local state immediately
        get().removeTask(taskId);
        
        toast.success('Task deleted successfully');
      }, undefined, 'Deleting task');
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast.error(error.message || 'Failed to delete task');
      throw error;
    }
  },

  // Getters
  getTasksByStatus: (status: string) => {
    return get().tasks.filter(task => task.status === status || task.progress_status === status);
  },

  getTaskById: (taskId: string) => {
    return get().tasks.find(task => task.id === taskId);
  },

  getUserTasks: (userId: string) => {
    return get().tasks.filter(task => task.assigned_to === userId);
  },

  // Internal state management
  setTasks: (tasks: Task[]) => set({ tasks }),
  
  setLoading: (loading: boolean) => set({ loading }),
  
  updateTask: (taskId: string, updates: Partial<Task>) => 
    set((state) => ({
      tasks: state.tasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    })),
    
  removeTask: (taskId: string) =>
    set((state) => ({
      tasks: state.tasks.filter(task => task.id !== taskId)
    })),
    
  addTaskToStore: (task: Task) =>
    set((state) => ({
      tasks: [...state.tasks, task]
    })),
}));

// Hook for easy access to task store actions
export const useTaskActions = () => {
  const {
    updateTaskStatus,
    updateTaskProgress,
    addTask,
    deleteTask,
    initializeRealTimeListeners,
  } = useTaskStore();
  
  return {
    updateTaskStatus,
    updateTaskProgress,
    addTask,
    deleteTask,
    initializeRealTimeListeners,
  };
};

// Hook for task data with selectors
export const useTaskData = () => {
  const {
    tasks,
    loading,
    userMap,
    getTasksByStatus,
    getTaskById,
    getUserTasks,
  } = useTaskStore();
  
  return {
    tasks,
    loading,
    userMap,
    getTasksByStatus,
    getTaskById,
    getUserTasks,
  };
};
