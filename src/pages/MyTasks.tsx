import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, Timestamp, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuthStore } from "../store/authStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  ChevronDown,
  Calendar,
  MessageCircle,
  CheckCircle,
  Clock,
  Circle,
  X,
  Save,
  User,
  Flag,
  ArrowRight,
  AlertCircle,
  Star,
  Edit,
  Trash2,
  Eye,
  Users,
  Layers,
  Target,
  Zap,
  TrendingUp,
  Activity,
  Timer,
} from "lucide-react";
import toast from "react-hot-toast";

const KanbanPage = () => {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("board"); // board, list, timeline, table
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTaskColumn, setNewTaskColumn] = useState("");
  const [draggedTask, setDraggedTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newTaskForm, setNewTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    assigned_to: "",
    project_id: "",
    tags: "",
  });

  useEffect(() => {
    const unsubscribers: any[] = [];
    let mounted = true;
    let connectionTimeout: NodeJS.Timeout;
    let hasConnected = false;

    // Enhanced mock data for better testing
    const getMockTasks = () => [
      {
        id: "mock-task-1",
        title: "Design System Enhancement",
        description: "Update the design system components with new branding guidelines and color schemes",
        status: "pending",
        progress_status: "pending",
        priority: "high",
        assigned_to: user?.uid || "mock-user",
        due_date: "2024-02-15",
        created_at: { seconds: Date.now() / 1000 },
        tags: "design,urgent,ui",
        progress: 0,
        comments: []
      },
      {
        id: "mock-task-2",
        title: "Payment API Integration",
        description: "Integrate third-party payment API for checkout flow with enhanced security",
        status: "in_progress",
        progress_status: "in_progress",
        priority: "high",
        assigned_to: user?.uid || "mock-user",
        due_date: "2024-02-20",
        created_at: { seconds: Date.now() / 1000 },
        tags: "backend,api,security",
        progress: 65,
        comments: [{ id: 1, text: "Working on authentication flow" }]
      },
      {
        id: "mock-task-3",
        title: "User Experience Testing",
        description: "Conduct comprehensive user testing for the new dashboard interface",
        status: "review",
        progress_status: "review",
        priority: "medium",
        assigned_to: user?.uid || "mock-user",
        due_date: "2024-02-18",
        created_at: { seconds: Date.now() / 1000 },
        tags: "testing,ux,analytics",
        progress: 90,
        comments: [{ id: 1, text: "Initial feedback looks positive" }]
      },
      {
        id: "mock-task-4",
        title: "API Documentation Update",
        description: "Update comprehensive API documentation with new endpoints and examples",
        status: "completed",
        progress_status: "completed",
        priority: "low",
        assigned_to: user?.uid || "mock-user",
        due_date: "2024-02-10",
        created_at: { seconds: Date.now() / 1000 },
        tags: "docs,api",
        progress: 100,
        comments: []
      },
      {
        id: "mock-task-5",
        title: "Performance Optimization",
        description: "Optimize application performance and reduce bundle size",
        status: "in_progress",
        progress_status: "in_progress",
        priority: "medium",
        assigned_to: user?.uid || "mock-user",
        due_date: "2024-02-25",
        created_at: { seconds: Date.now() / 1000 },
        tags: "performance,optimization",
        progress: 35,
        comments: []
      }
    ];

    const getMockProjects = () => [
      {
        id: "mock-project-1",
        name: "Website Redesign",
        description: "Complete website redesign project with modern UI",
        color: "#8b5cf6"
      },
      {
        id: "mock-project-2",
        name: "Mobile Application",
        description: "iOS and Android app development",
        color: "#a855f7"
      },
      {
        id: "mock-project-3",
        name: "Analytics Dashboard",
        description: "Real-time analytics and reporting dashboard",
        color: "#9333ea"
      }
    ];

    const getMockEmployees = () => [
      {
        id: user?.uid || "mock-user",
        name: user?.email?.split('@')[0] || "You",
        email: user?.email || "you@example.com",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'You'}`,
        role: "Developer"
      }
    ];

    const setupFirebaseWithTimeout = async () => {
      // Check network connectivity first
      if (!navigator.onLine) {
        console.warn("No internet connection detected - using offline mode");
        toast.error("No internet connection - using offline mode");
        loadMockData();
        return;
      }

      try {
        connectionTimeout = setTimeout(() => {
          if (!hasConnected && mounted) {
            console.warn("Firebase connection timeout - switching to offline mode");
            toast.error("Connection timeout - using offline mode");
            loadMockData();
          }
        }, 2000); // Reduce timeout to 2 seconds

        const testConnection = async () => {
          try {
            // Test with a simple query that should resolve quickly
            const testQuery = query(collection(db, "tasks"), where("assigned_to", "==", user?.uid || ""));

            // Use Promise.race to enforce timeout
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Connection timeout')), 1500)
            );

            await Promise.race([
              getDocs(testQuery),
              timeoutPromise
            ]);

            hasConnected = true;
            clearTimeout(connectionTimeout);

            if (mounted) {
              setupRealtimeListeners();
            }
          } catch (error: any) {
            // Check for specific network errors
            if (error.message?.includes('Failed to fetch') ||
                error.message?.includes('timeout') ||
                error.code === 'unavailable' ||
                !navigator.onLine) {
              throw new Error('Network connection failed');
            }
            throw error;
          }
        };

        await testConnection();

      } catch (error: any) {
        console.error("Firebase connection failed:", error);
        if (mounted) {
          const errorMessage = error.message?.includes('Failed to fetch') || !navigator.onLine
            ? "No internet connection - using offline mode"
            : "Firebase connection failed - using offline mode";
          toast.error(errorMessage);
          loadMockData();
        }
      }
    };

    const loadMockData = () => {
      if (mounted) {
        setTasks(getMockTasks());
        setProjects(getMockProjects());
        setEmployees(getMockEmployees());
        setLoading(false);
      }
    };

    const setupRealtimeListeners = () => {
      try {
        // Query tasks assigned to the current user only
        const tasksQuery = query(
          collection(db, "tasks"),
          where("assigned_to", "==", user?.uid || "")
        );

        const tasksUnsub = onSnapshot(
          tasksQuery,
          (snapshot) => {
            if (mounted) {
              hasConnected = true;
              setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
              setLoading(false);
            }
          },
          (error) => {
            console.warn("Tasks listener error:", error);
            toast.error("Tasks data connection lost - using cached data");
            if (mounted) {
              setTasks(getMockTasks());
              setLoading(false);
            }
          }
        );

        const projectsUnsub = onSnapshot(
          collection(db, "projects"),
          (snapshot) => {
            if (mounted) {
              setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }
          },
          (error) => {
            console.warn("Projects listener error:", error);
            if (mounted) {
              setProjects(getMockProjects());
            }
          }
        );

        const employeesUnsub = onSnapshot(
          collection(db, "employees"),
          (snapshot) => {
            if (mounted) {
              setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }
          },
          (error) => {
            console.warn("Employees listener error:", error);
            if (mounted) {
              setEmployees(getMockEmployees());
            }
          }
        );

        unsubscribers.push(tasksUnsub, projectsUnsub, employeesUnsub);
      } catch (error) {
        console.error("Failed to setup Firebase listeners:", error);
        if (mounted) {
          toast.error("Connection error - using offline mode");
          loadMockData();
        }
      }
    };

    // Start the connection process
    setupFirebaseWithTimeout();

    return () => {
      mounted = false;

      // Clear connection timeout
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }

      // Unsubscribe from Firebase listeners
      unsubscribers.forEach(unsub => {
        try {
          unsub();
        } catch (error) {
          console.warn("Error unsubscribing:", error);
        }
      });
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterOpen && !(event.target as Element).closest('.filter-dropdown')) {
        setFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterOpen]);

  const getEmployeeName = (empId: string) =>
    employees.find((emp: any) => emp.id === empId)?.name || "Unassigned";

  const getEmployeeAvatar = (empId: string) => {
    const emp = employees.find((emp: any) => emp.id === empId);
    return emp?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${empId}`;
  };

  const getProjectColor = (projectId: string) => {
    const project = projects.find((p: any) => p.id === projectId);
    return project?.color || "#8b5cf6";
  };

  // Enhanced filter logic
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchTerm || 
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.tags?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !selectedDate || task.due_date === selectedDate;
    const matchesProject = !selectedProject || task.project_id === selectedProject;
    const matchesPriority = !selectedPriority || task.priority === selectedPriority;
    const matchesAssignee = !selectedAssignee || task.assigned_to === selectedAssignee;
    
    return matchesSearch && matchesDate && matchesProject && matchesPriority && matchesAssignee;
  });

  const columns = [
    {
      id: "pending",
      title: "To Do",
      icon: Circle,
      color: "purple",
      glassEffect: "bg-gradient-to-br from-purple-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:to-indigo-900/20",
      borderColor: "border-purple-200/50 dark:border-purple-500/30",
      iconColor: "text-purple-600 dark:text-purple-400",
      count: filteredTasks.filter((t: any) => t.status === "pending").length
    },
    {
      id: "in_progress",
      title: "In Progress",
      icon: Clock,
      color: "purple",
      glassEffect: "bg-gradient-to-br from-purple-50/80 to-violet-50/80 dark:from-purple-900/20 dark:to-violet-900/20",
      borderColor: "border-purple-200/50 dark:border-purple-500/30",
      iconColor: "text-purple-600 dark:text-purple-400",
      count: filteredTasks.filter((t: any) => t.status === "in_progress").length
    },
    {
      id: "review",
      title: "Review",
      icon: Eye,
      color: "purple",
      glassEffect: "bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/20 dark:to-purple-900/20",
      borderColor: "border-purple-200/50 dark:border-purple-500/30",
      iconColor: "text-purple-600 dark:text-purple-400",
      count: filteredTasks.filter((t: any) => t.status === "review").length
    },
    {
      id: "completed",
      title: "Done",
      icon: CheckCircle,
      color: "purple",
      glassEffect: "bg-gradient-to-br from-purple-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:to-indigo-900/20",
      borderColor: "border-purple-200/50 dark:border-purple-500/30",
      iconColor: "text-purple-600 dark:text-purple-400",
      count: filteredTasks.filter((t: any) => t.status === "completed").length
    }
  ];

  const handleAddTask = async () => {
    if (!newTaskForm.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    try {
      if (!db) {
        throw new Error("Database connection not available");
      }

      // Add timeout for Firebase operation
      const addTaskPromise = addDoc(collection(db, "tasks"), {
        ...newTaskForm,
        status: newTaskColumn || "pending",
        progress_status: newTaskColumn || "pending",
        created_by: user?.uid || "anonymous",
        created_at: Timestamp.now(),
        task_id: `TASK-${Date.now()}`,
        progress: 0,
        comments: [],
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation timeout')), 5000)
      );

      await Promise.race([addTaskPromise, timeoutPromise]);

      toast.success("Task created successfully! 🎉");
      setNewTaskForm({
        title: "",
        description: "",
        priority: "medium",
        due_date: "",
        assigned_to: "",
        project_id: "",
        tags: "",
      });
      setShowNewTaskModal(false);
      setNewTaskColumn("");
    } catch (error: any) {
      console.error("Error adding task:", error);

      if (error.message.includes('timeout') || error.message.includes('Failed to fetch')) {
        toast.error("Connection timeout - task not saved. Please try again.");
      } else {
        toast.error(`Failed to add task: ${error.message || 'Connection error'}`);
      }

      // Don't close modal on error so user can retry
    }
  };

  const handleTaskMove = async (task: any, newStatus: string) => {
    try {
      if (!db) {
        throw new Error("Database connection not available");
      }

      // Add timeout for Firebase operation
      const updateTaskPromise = updateDoc(doc(db, "tasks", task.id), {
        status: newStatus,
        progress_status: newStatus,
        progress_updated_at: Timestamp.now(),
        progress: newStatus === "completed" ? 100 : task.progress || 0,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation timeout')), 5000)
      );

      await Promise.race([updateTaskPromise, timeoutPromise]);

      toast.success(`Task moved to ${newStatus.replace('_', ' ')} 📈`);
    } catch (error: any) {
      console.error("Error updating task:", error);

      if (error.message.includes('timeout') || error.message.includes('Failed to fetch')) {
        toast.error("Connection timeout - task status not updated. Please try again.");
      } else {
        toast.error(`Failed to update task: ${error.message || 'Connection error'}`);
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, task: any) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, columnStatus: string) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== columnStatus) {
      handleTaskMove(draggedTask, columnStatus);
    }
    setDraggedTask(null);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <Flag className="w-3 h-3 text-red-500" />;
      case "medium":
        return <Flag className="w-3 h-3 text-yellow-500" />;
      case "low":
        return <Flag className="w-3 h-3 text-green-500" />;
      default:
        return <Flag className="w-3 h-3 text-gray-400" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-500/30";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-500/30";
      case "low":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-500/30";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-500/30";
    }
  };

  const TaskCard = ({ task }: { task: any }) => {
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed";

    const getCardBgColor = () => {
      if (isOverdue) return 'liquid-glass-card border-red-300/40 dark:border-red-400/50 bg-gradient-to-br from-red-50/70 via-pink-50/60 to-rose-50/70 dark:from-red-900/20 dark:via-red-800/10 dark:to-red-900/20';

      switch (task.status) {
        case 'completed':
          return 'liquid-glass-card border-purple-300/40 dark:border-purple-400/50 bg-gradient-to-br from-purple-50/70 via-indigo-50/60 to-purple-50/70 dark:from-purple-900/20 dark:via-indigo-800/10 dark:to-purple-900/20';
        case 'in_progress':
          return 'liquid-glass-card border-purple-300/40 dark:border-purple-400/50 bg-gradient-to-br from-purple-50/70 via-violet-50/60 to-indigo-50/70 dark:from-purple-900/20 dark:via-violet-800/10 dark:to-indigo-900/20';
        case 'review':
          return 'liquid-glass-card border-purple-300/40 dark:border-purple-400/50 bg-gradient-to-br from-indigo-50/70 via-purple-50/60 to-violet-50/70 dark:from-indigo-900/20 dark:via-purple-800/10 dark:to-violet-900/20';
        default:
          return 'liquid-glass-card border-purple-300/40 dark:border-purple-400/50 bg-gradient-to-br from-purple-50/70 via-indigo-50/60 to-purple-50/70 dark:from-purple-900/20 dark:via-indigo-800/10 dark:to-purple-900/20';
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{
          y: -4,
          scale: 1.02
        }}
        whileTap={{ scale: 0.98 }}
        layout
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onClick={() => {
          setSelectedTask(task);
          setShowTaskDetailModal(true);
        }}
        className={`${getCardBgColor()} rounded-xl border p-4 mb-3 transition-all duration-500 cursor-pointer group relative overflow-hidden backdrop-blur-xl hover:-translate-y-2 hover:scale-[1.02]`}
      >
        {/* Enhanced Priority stripe */}
        <div className={`absolute top-0 left-0 w-full h-1.5 rounded-t-xl ${
          task.priority === "high" ? "bg-gradient-to-r from-red-500 via-red-600 to-red-700 dark:from-red-500 dark:via-red-600 dark:to-red-700 animate-pulse" :
          task.priority === "medium" ? "bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 dark:from-purple-400 dark:via-purple-500 dark:to-purple-600" :
          "bg-gradient-to-r from-purple-300 via-purple-400 to-purple-500 dark:from-purple-300 dark:via-purple-400 dark:to-purple-500"
        }`} />

        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-tight mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
              {task.title}
            </h4>
            <div className="flex items-center gap-1">
              {getPriorityIcon(task.priority)}
              <span className={`px-1.5 py-0.5 text-xs rounded-full border ${getPriorityBadge(task.priority)}`}>
                {task.priority?.toUpperCase()}
              </span>
              {isOverdue && (
                <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded-full border border-red-200 flex items-center gap-1 dark:bg-red-900/30 dark:text-red-300 dark:border-red-500/30">
                  <AlertCircle className="w-2 h-2" />
                  Overdue
                </span>
              )}
            </div>
          </div>
          <button 
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              // Add menu options
            }}
          >
            <MoreHorizontal className="w-3 h-3" />
          </button>
        </div>
        
        {/* Description */}
        {task.description && (
          <p className="text-xs text-gray-700 dark:text-gray-200 mb-2 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Progress Bar */}
        {task.progress > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-2"
          >
            <div className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-200 mb-1">
              <span className="font-medium">Progress</span>
              <motion.span
                className="font-bold text-purple-600 dark:text-purple-400"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                {task.progress}%
              </motion.span>
            </div>
            <div className="w-full bg-gray-200/60 dark:bg-gray-700/50 rounded-full h-1.5 backdrop-blur-sm">
              <motion.div
                className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 dark:from-purple-400 dark:via-purple-500 dark:to-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${task.progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        )}

        {/* Tags */}
        {task.tags && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-1 mb-2"
          >
            {task.tags.split(',').map((tag: string, index: number) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="px-1.5 py-0.5 text-xs bg-gradient-to-r from-purple-100/80 via-indigo-100/70 to-purple-100/80 dark:from-purple-900/40 dark:via-indigo-800/30 dark:to-purple-900/40 text-purple-700 dark:text-purple-300 rounded-lg border border-purple-200/50 dark:border-purple-400/30 font-medium shadow-sm backdrop-blur-sm"
              >
                #{tag.trim()}
              </motion.span>
            ))}
          </motion.div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-1">
            <img
              src={getEmployeeAvatar(task.assigned_to)}
              alt="avatar"
              className="w-4 h-4 rounded-full border border-white dark:border-gray-600 shadow-lg ring-1 ring-white/50 dark:ring-gray-400/30"
            />
            <span className="font-medium text-xs">{getEmployeeName(task.assigned_to)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {task.due_date && (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
                <Calendar className="w-2 h-2" />
                <span className="text-xs">{new Date(task.due_date).toLocaleDateString()}</span>
              </div>
            )}
            {task.comments?.length > 0 && (
              <div className="flex items-center gap-1">
                <MessageCircle className="w-2 h-2" />
                <span className="text-xs">{task.comments.length}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 dark:bg-gradient-to-br dark:from-purple-900/20 dark:via-indigo-800/30 dark:to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 dark:border-purple-400 dark:border-t-purple-300 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium text-sm">Loading your workspace...</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Preparing the ultimate kanban experience
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 dark:bg-gradient-to-br dark:from-purple-900/20 dark:via-indigo-800/30 dark:to-purple-900/20 backdrop-blur-sm">
      {/* Enhanced Header */}
      <div className="liquid-glass border-b border-purple-200 dark:border-purple-500/30 p-3 flex-shrink-0 backdrop-blur-2xl bg-gradient-to-r from-purple-50/80 via-indigo-50/80 to-purple-100/80 dark:bg-gradient-to-r dark:from-black/95 dark:via-black/90 dark:to-black/95">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse" />
                <Layers className="w-4 h-4 text-white relative z-10" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  My Task Board
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {filteredTasks.length} tasks • {projects.length} projects
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="px-2 py-1 text-xs bg-gradient-to-r from-purple-100/80 to-indigo-100/80 dark:from-purple-900/40 dark:to-indigo-800/40 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-400/30 rounded-full flex items-center gap-1 backdrop-blur-sm">
                <Activity className="w-2 h-2" />
                {navigator.onLine ? 'Live' : 'Offline'}
              </span>
              <span className="px-2 py-1 text-xs bg-gradient-to-r from-indigo-100/80 to-purple-100/80 dark:from-indigo-900/40 dark:to-purple-800/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-400/30 rounded-full backdrop-blur-sm shadow-sm">
                {Math.round((columns.find(c => c.id === "completed")?.count || 0) / Math.max(filteredTasks.length, 1) * 100)}% Complete
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Enhanced Search */}
            <div className="relative search-input">
              <Search className="w-3 h-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks, tags, or people..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-xs border border-purple-200/50 dark:border-purple-500/30 rounded-lg bg-white/80 dark:bg-black/60 text-gray-900 dark:text-purple-100 placeholder:text-gray-400 dark:placeholder:text-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent backdrop-blur-xl w-48"
              />
            </div>

            {/* Enhanced Filter */}
            <div className="relative filter-dropdown">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border-2 border-purple-300 dark:border-purple-500/40 rounded-lg bg-white/95 dark:bg-black/95 text-gray-900 dark:text-white hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 z-30 relative shadow-lg hover:shadow-xl font-medium"
              >
                <Filter className="w-3 h-3" />
                Filters
                <ChevronDown className="w-3 h-3" />
              </button>

              {filterOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-black/95 backdrop-blur-xl border border-purple-200 dark:border-purple-500/30 rounded-xl z-[99999] p-4 shadow-2xl">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Filter Tasks</h3>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Priority
                        </label>
                        <select
                          value={selectedPriority}
                          onChange={(e) => setSelectedPriority(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-purple-200 dark:border-purple-500/30 rounded-lg bg-white dark:bg-black/90 text-gray-900 dark:text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">All Priorities</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-purple-200 dark:border-purple-500/30 rounded-lg bg-white dark:bg-black/90 text-gray-900 dark:text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Assignee
                      </label>
                      <select
                        value={selectedAssignee}
                        onChange={(e) => setSelectedAssignee(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-purple-200 dark:border-purple-500/30 rounded-lg bg-white dark:bg-black/90 text-gray-900 dark:text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">All Assignees</option>
                        {employees.map((emp: any) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name || emp.email}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Project
                      </label>
                      <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-purple-200 dark:border-purple-500/30 rounded-lg bg-white dark:bg-black/90 text-gray-900 dark:text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">All Projects</option>
                        {projects.map((project: any) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          setSelectedDate("");
                          setSelectedProject("");
                          setSelectedPriority("");
                          setSelectedAssignee("");
                          setFilterOpen(false);
                        }}
                        className="px-3 py-1.5 text-xs text-gray-600 dark:text-purple-400 hover:text-gray-900 dark:hover:text-purple-200 transition-colors"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={() => setFilterOpen(false)}
                        className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowNewTaskModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:via-indigo-700 hover:to-purple-800 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 backdrop-blur-sm border border-white/20"
            >
              <Plus className="w-3 h-3" />
              New Task
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3">
          {columns.map((column) => (
            <div key={column.id} className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {column.count}
              </div>
              <div className="text-xs text-gray-500 dark:text-purple-300">
                {column.title.replace(/[^\w\s]/gi, '')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Kanban Board */}
      <div className="flex-1 min-h-0 p-4">
        <div className="flex gap-4 h-full min-w-max overflow-x-auto w-full pb-4">
          {columns.map((column) => (
            <motion.div 
              key={column.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: columns.indexOf(column) * 0.1 }}
              className="flex flex-col w-64 min-w-64 max-w-64 h-full flex-shrink-0"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Enhanced Column Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${column.glassEffect} rounded-t-xl p-3 border-2 ${column.borderColor} relative overflow-hidden backdrop-blur-2xl`}
              >
                <div className="absolute inset-0 bg-white/5"></div>
                <div className="relative flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: 10 }}
                      className={`w-8 h-8 rounded-xl bg-white/90 dark:bg-purple-800/80 backdrop-blur-xl flex items-center justify-center ${column.iconColor} shadow-xl border border-white/50 dark:border-purple-500/50`}
                    >
                      <column.icon className="w-3 h-3" />
                    </motion.div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                        {column.title}
                      </h2>
                      <motion.p
                        key={column.count}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="text-xs text-gray-600 dark:text-purple-300 font-medium"
                      >
                        {column.count} tasks
                      </motion.p>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setNewTaskColumn(column.id);
                      setShowNewTaskModal(true);
                    }}
                    className="w-7 h-7 bg-white/90 dark:bg-purple-800/80 backdrop-blur-xl rounded-lg flex items-center justify-center text-gray-600 dark:text-purple-400 hover:text-gray-900 dark:hover:text-purple-200 hover:bg-white dark:hover:bg-purple-700 transition-all shadow-xl border border-white/50 dark:border-purple-500/50"
                    title={`Add task to ${column.title}`}
                  >
                    <Plus className="w-3 h-3" />
                  </motion.button>
                </div>

                {/* Enhanced Progress indicator */}
                <div className="relative w-full bg-white/30 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((column.count / Math.max(filteredTasks.length, 1)) * 100, 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 h-1.5 rounded-full shadow-sm"
                  />
                </div>
              </motion.div>

              {/* Enhanced Column Content */}
              <div className={`flex-1 ${column.glassEffect} rounded-b-xl border-2 border-t-0 ${column.borderColor} p-3 overflow-y-auto custom-scrollbar backdrop-blur-2xl`}>
                <AnimatePresence>
                  {filteredTasks.filter((t: any) => t.status === column.id).map((task: any, index: number) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <TaskCard task={task} />
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Enhanced Empty State */}
                {filteredTasks.filter((t: any) => t.status === column.id).length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-purple-500"
                  >
                    <div className="w-12 h-12 bg-purple-200/60 dark:bg-purple-700/60 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm border border-purple-300/30 dark:border-purple-500/30">
                      <column.icon className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium mb-2">No tasks yet</p>
                    <p className="text-xs text-center mb-3">
                      {column.id === "pending" && "Tasks start their journey here"}
                      {column.id === "in_progress" && "Active work happens here"}
                      {column.id === "review" && "Quality checks happen here"}
                      {column.id === "completed" && "Completed tasks celebrate here"}
                    </p>
                    <button 
                      onClick={() => {
                        setNewTaskColumn(column.id);
                        setShowNewTaskModal(true);
                      }}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      + Add first task
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Enhanced Responsive New Task Modal */}
      <AnimatePresence>
        {showNewTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowNewTaskModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white/95 via-purple-50/90 to-indigo-50/90 dark:from-black/95 dark:via-purple-900/90 dark:to-indigo-800/90 rounded-3xl shadow-2xl border-2 border-purple-200/50 dark:border-purple-500/30 backdrop-blur-xl"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10 dark:from-purple-500/10 dark:via-indigo-600/10 dark:to-purple-500/10 p-6 border-b border-purple-200/30 dark:border-purple-500/30 backdrop-blur-xl z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-purple-500 dark:to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl"
                    >
                      <Plus className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                        Create New Task
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Add a task to your personal board
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowNewTaskModal(false)}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Modal Content - Responsive Grid */}
              <div className="p-6 space-y-6">
                {/* Column Selection */}
                {newTaskColumn && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-purple-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:to-indigo-900/20 p-4 rounded-2xl border border-purple-200/50 dark:border-purple-500/30"
                  >
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <div>
                        <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                          Adding to: <span className="font-bold">{columns.find(c => c.id === newTaskColumn)?.title}</span>
                        </p>
                        <p className="text-xs text-purple-600/70 dark:text-purple-400/70">
                          This task will be created in the selected column
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Form Fields - Responsive Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Task Title */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Task Title *
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.02 }}
                      type="text"
                      value={newTaskForm.title}
                      onChange={(e) => setNewTaskForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-purple-200/50 dark:border-purple-600/50 rounded-xl bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500 focus:border-purple-500 dark:focus:border-purple-500 transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-xl"
                      placeholder="Enter a clear, actionable task title..."
                      autoFocus
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Priority
                    </label>
                    <motion.select
                      whileFocus={{ scale: 1.02 }}
                      value={newTaskForm.priority}
                      onChange={(e) => setNewTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-purple-200/50 dark:border-purple-600/50 rounded-xl bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500 transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-xl"
                    >
                      <option value="low">🟢 Low Priority</option>
                      <option value="medium">🟡 Medium Priority</option>
                      <option value="high">🔴 High Priority</option>
                    </motion.select>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Due Date
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.02 }}
                      type="date"
                      value={newTaskForm.due_date}
                      onChange={(e) => setNewTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-purple-200/50 dark:border-purple-600/50 rounded-xl bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500 transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-xl"
                    />
                  </div>

                  {/* Project */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Project
                    </label>
                    <motion.select
                      whileFocus={{ scale: 1.02 }}
                      value={newTaskForm.project_id}
                      onChange={(e) => setNewTaskForm(prev => ({ ...prev, project_id: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-purple-200/50 dark:border-purple-600/50 rounded-xl bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500 transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-xl"
                    >
                      <option value="">📁 Select project...</option>
                      {projects.map((project: any) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </motion.select>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Tags
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.02 }}
                      type="text"
                      value={newTaskForm.tags}
                      onChange={(e) => setNewTaskForm(prev => ({ ...prev, tags: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-purple-200/50 dark:border-purple-600/50 rounded-xl bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500 transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-xl"
                      placeholder="frontend, api, urgent..."
                    />
                  </div>

                  {/* Description */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Description
                    </label>
                    <motion.textarea
                      whileFocus={{ scale: 1.02 }}
                      value={newTaskForm.description}
                      onChange={(e) => setNewTaskForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-purple-200/50 dark:border-purple-600/50 rounded-xl bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500 transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-xl resize-none"
                      placeholder="Provide context and details for this task..."
                    />
                  </div>
                </div>

                {/* Action Buttons - Responsive */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200/30 dark:border-gray-700/30">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowNewTaskModal(false)}
                    className="flex-1 sm:flex-none px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors font-medium border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddTask}
                    disabled={!newTaskForm.title.trim()}
                    className="flex-1 sm:flex-auto flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 dark:from-purple-600 dark:via-indigo-600 dark:to-purple-700 text-white rounded-xl hover:from-purple-600 hover:via-indigo-600 hover:to-purple-700 dark:hover:from-purple-700 dark:hover:via-indigo-700 dark:hover:to-purple-800 transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    <Save className="w-5 h-5" />
                    Create Task
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Enhanced Task Detail Modal */}
      <AnimatePresence>
        {showTaskDetailModal && selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setShowTaskDetailModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="relative w-full max-w-4xl bg-gradient-to-br from-white/95 to-purple-50/95 dark:from-black/95 dark:to-purple-900/90 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto border-2 border-purple-200/50 dark:border-purple-500/30 backdrop-blur-xl"
            >
              {/* Task Detail Header */}
              <div className="bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-purple-500/20 dark:from-purple-600/20 dark:via-indigo-700/20 dark:to-purple-600/20 p-6 border-b border-purple-200/30 dark:border-purple-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-purple-500 dark:to-indigo-600 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-xl"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse" />
                      {getPriorityIcon((selectedTask as any).priority)}
                    </motion.div>
                    <div>
                      <motion.h2
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-2xl font-bold text-gray-900 dark:text-white"
                      >
                        {(selectedTask as any).title}
                      </motion.h2>
                      <motion.p
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-purple-600 dark:text-purple-400 text-sm font-medium"
                      >
                        Task #{(selectedTask as any).id?.slice(-8)} • {(selectedTask as any).status?.replace('_', ' ').toUpperCase()}
                      </motion.p>
                    </div>
                  </div>
                  <motion.button
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    onClick={() => setShowTaskDetailModal(false)}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Task Detail Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Main Content */}
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        Description
                      </h3>
                      <div className="p-4 bg-purple-50/80 dark:bg-purple-800/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50 backdrop-blur-sm">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {(selectedTask as any).description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {(selectedTask as any).progress > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Progress
                        </h3>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-purple-200/60 dark:bg-purple-700/50 rounded-full h-3 backdrop-blur-sm">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-purple-500 dark:to-indigo-600 h-3 rounded-full transition-all duration-300 shadow-sm"
                              style={{ width: `${(selectedTask as any).progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {(selectedTask as any).progress}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {(selectedTask as any).tags && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <Flag className="w-5 h-5" />
                          Tags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {(selectedTask as any).tags.split(',').map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="px-3 py-1 text-sm bg-gradient-to-r from-purple-100/80 to-indigo-100/80 dark:from-purple-900/40 dark:to-indigo-800/40 text-purple-700 dark:text-purple-300 rounded-lg border border-purple-200/50 dark:border-purple-400/30 backdrop-blur-sm"
                            >
                              #{tag.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50/80 dark:bg-purple-800/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50 backdrop-blur-sm">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Status</h3>
                      <span className={`px-3 py-1 text-sm rounded-lg ${
                        (selectedTask as any).status === "completed" ? "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-500/30" :
                        (selectedTask as any).status === "in_progress" ? "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-500/30" :
                        (selectedTask as any).status === "review" ? "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-500/30" :
                        "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-500/30"
                      }`}>
                        {(selectedTask as any).status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="p-4 bg-purple-50/80 dark:bg-purple-800/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50 backdrop-blur-sm">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Priority</h3>
                      <span className={`px-3 py-1 text-sm rounded-lg border ${getPriorityBadge((selectedTask as any).priority)}`}>
                        {(selectedTask as any).priority?.toUpperCase()}
                      </span>
                    </div>

                    <div className="p-4 bg-purple-50/80 dark:bg-purple-800/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50 backdrop-blur-sm">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Assignee</h3>
                      <div className="flex items-center gap-2">
                        <img
                          src={getEmployeeAvatar((selectedTask as any).assigned_to)}
                          alt="avatar"
                          className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-600 shadow-lg"
                        />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {getEmployeeName((selectedTask as any).assigned_to)}
                        </span>
                      </div>
                    </div>

                    {(selectedTask as any).due_date && (
                      <div className="p-4 bg-purple-50/80 dark:bg-purple-800/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50 backdrop-blur-sm">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Due Date</h3>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {new Date((selectedTask as any).due_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KanbanPage;
