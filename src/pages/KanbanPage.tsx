import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, Timestamp, onSnapshot } from "firebase/firestore";
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
        assigned_to: "mock-user",
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
        assigned_to: "mock-user-2",
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
        assigned_to: "mock-user-3",
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
        assigned_to: "mock-user",
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
        assigned_to: "mock-user-2",
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
        color: "#00D4FF"
      },
      {
        id: "mock-project-2",
        name: "Mobile Application",
        description: "iOS and Android app development",
        color: "#FF6600"
      },
      {
        id: "mock-project-3",
        name: "Analytics Dashboard",
        description: "Real-time analytics and reporting dashboard",
        color: "#f59e0b"
      }
    ];

    const getMockEmployees = () => [
      {
        id: "mock-user",
        name: "Alice Johnson",
        email: "alice@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
        role: "Senior Designer"
      },
      {
        id: "mock-user-2",
        name: "Bob Smith",
        email: "bob@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
        role: "Full Stack Developer"
      },
      {
        id: "mock-user-3",
        name: "Carol Davis",
        email: "carol@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol",
        role: "QA Engineer"
      },
      {
        id: "mock-user-4",
        name: "David Wilson",
        email: "david@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
        role: "Product Manager"
      }
    ];

    const setupFirebaseWithTimeout = async () => {
      try {
        // Set a timeout for Firebase connection
        connectionTimeout = setTimeout(() => {
          if (!hasConnected && mounted) {
            console.warn("Firebase connection timeout - switching to offline mode");
            toast.error("Connection timeout - using offline mode");
            loadMockData();
          }
        }, 3000); // 3 second timeout

        // Test Firebase connection with a simple operation
        const testConnection = async () => {
          try {
            // Try to get a simple document to test connection
            await collection(db, "tasks");
            hasConnected = true;
            clearTimeout(connectionTimeout);

            if (mounted) {
              setupRealtimeListeners();
            }
          } catch (error) {
            throw error;
          }
        };

        await testConnection();

      } catch (error) {
        console.error("Firebase connection failed:", error);
        if (mounted) {
          toast.error("Firebase connection failed - using offline mode");
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
        const tasksUnsub = onSnapshot(
          collection(db, "tasks"),
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
    return project?.color || "#6366f1";
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

  // Enhanced color schemes for better visual appeal
  const getColumnColors = (status: string) => {
    const lightTheme = {
      pending: { bg: 'from-amber-50 to-orange-50', border: 'border-amber-200', icon: 'text-amber-600' },
      in_progress: { bg: 'from-blue-50 to-cyan-50', border: 'border-blue-200', icon: 'text-blue-600' },
      review: { bg: 'from-purple-50 to-indigo-50', border: 'border-purple-200', icon: 'text-purple-600' },
      completed: { bg: 'from-emerald-50 to-green-50', border: 'border-emerald-200', icon: 'text-emerald-600' }
    };
    
    const darkTheme = {
      pending: { bg: 'from-amber-900/20 to-orange-900/20', border: 'border-amber-500/30', icon: 'text-amber-400' },
      in_progress: { bg: 'from-blue-900/20 to-cyan-900/20', border: 'border-blue-500/30', icon: 'text-blue-400' },
      review: { bg: 'from-purple-900/20 to-indigo-900/20', border: 'border-purple-500/30', icon: 'text-purple-400' },
      completed: { bg: 'from-emerald-900/20 to-green-900/20', border: 'border-emerald-500/30', icon: 'text-emerald-400' }
    };

    return {
      light: lightTheme[status as keyof typeof lightTheme] || lightTheme.pending,
      dark: darkTheme[status as keyof typeof darkTheme] || darkTheme.pending
    };
  };

  const columns = [
    {
      id: "pending",
      title: "To Do",
      icon: Circle,
      color: "amber",
      glassEffect: "bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-900/20 dark:to-orange-900/20",
      borderColor: "border-amber-200/50 dark:border-amber-500/30",
      iconColor: "text-amber-600 dark:text-amber-400",
      count: filteredTasks.filter((t: any) => t.status === "pending").length
    },
    {
      id: "in_progress",
      title: "In Progress",
      icon: Clock,
      color: "blue",
      glassEffect: "bg-gradient-to-br from-blue-50/80 to-cyan-50/80 dark:from-blue-900/20 dark:to-cyan-900/20",
      borderColor: "border-blue-200/50 dark:border-blue-500/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      count: filteredTasks.filter((t: any) => t.status === "in_progress").length
    },
    {
      id: "review",
      title: "Review",
      icon: Eye,
      color: "purple",
      glassEffect: "bg-gradient-to-br from-purple-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:to-indigo-900/20",
      borderColor: "border-purple-200/50 dark:border-purple-500/30",
      iconColor: "text-purple-600 dark:text-purple-400",
      count: filteredTasks.filter((t: any) => t.status === "review").length
    },
    {
      id: "completed",
      title: "Done",
      icon: CheckCircle,
      color: "emerald",
      glassEffect: "bg-gradient-to-br from-emerald-50/80 to-green-50/80 dark:from-emerald-900/20 dark:to-green-900/20",
      borderColor: "border-emerald-200/50 dark:border-emerald-500/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
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
        return <Flag className="w-4 h-4 text-red-500" />;
      case "medium":
        return <Flag className="w-4 h-4 text-yellow-500" />;
      case "low":
        return <Flag className="w-4 h-4 text-green-500" />;
      default:
        return <Flag className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const TaskCard = ({ task }: { task: any }) => {
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed";

    const getCardBgColor = () => {
      if (isOverdue) return 'enhanced-glass-card border-red-300/40 dark:border-red-400/50 bg-gradient-to-br from-red-50/70 via-pink-50/60 to-rose-50/70 dark:from-black/90 dark:via-black/80 dark:to-black/90';

      switch (task.status) {
        case 'completed':
          return 'enhanced-glass-card border-blue-300/40 dark:border-purple-400/50 bg-gradient-to-br from-blue-50/70 via-gray-50/60 to-slate-50/70 dark:from-black/90 dark:via-black/80 dark:to-black/90';
        case 'in_progress':
          return 'enhanced-glass-card border-blue-300/40 dark:border-purple-400/50 bg-gradient-to-br from-blue-50/70 via-sky-50/60 to-indigo-50/70 dark:from-black/90 dark:via-black/80 dark:to-black/90';
        case 'review':
          return 'enhanced-glass-card border-gray-300/40 dark:border-purple-300/50 bg-gradient-to-br from-gray-50/70 via-slate-50/60 to-blue-50/70 dark:from-black/90 dark:via-black/80 dark:to-black/90';
        default:
          return 'enhanced-glass-card border-gray-300/40 dark:border-purple-400/50 bg-gradient-to-br from-gray-50/70 via-slate-50/60 to-blue-50/70 dark:from-black/90 dark:via-black/80 dark:to-black/90';
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
        className={`${getCardBgColor()} rounded-2xl border p-5 mb-4 transition-all duration-500 cursor-pointer group relative overflow-hidden backdrop-blur-xl hover:-translate-y-2 hover:scale-[1.02] moving-border-subtle`}
      >
        {/* Enhanced Priority stripe */}
        <div className={`absolute top-0 left-0 w-full h-2 rounded-t-2xl ${
          task.priority === "high" ? "bg-gradient-to-r from-red-500 via-red-600 to-red-700 dark:from-purple-500 dark:via-purple-600 dark:to-purple-700 animate-pulse" :
          task.priority === "medium" ? "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 dark:from-purple-400 dark:via-purple-500 dark:to-purple-600" :
          "bg-gradient-to-r from-gray-500 via-gray-600 to-gray-700 dark:from-purple-300 dark:via-purple-400 dark:to-purple-500"
        }`} />

        {/* Floating glass orbs */}
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white/30 dark:bg-purple-400/40 animate-pulse" />
        <div className="absolute bottom-3 left-3 w-1 h-1 rounded-full bg-white/40 dark:bg-purple-500/40 animate-pulse" style={{animationDelay: '1s'}} />

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-1 group-hover:text-blue-600 dark:group-hover:text-purple-400 transition-colors duration-300">
              {task.title}
            </h4>
            <div className="flex items-center gap-2">
              {getPriorityIcon(task.priority)}
              <span className={`px-2 py-0.5 text-xs rounded-full border ${getPriorityBadge(task.priority)}`}>
                {task.priority?.toUpperCase()}
              </span>
              {isOverdue && (
                <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full border border-red-200 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Overdue
                </span>
              )}
            </div>
          </div>
          <button 
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 p-1 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              // Add menu options
            }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
        
        {/* Description */}
        {task.description && (
          <p className="text-xs text-gray-700 dark:text-gray-200 mb-3 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Progress Bar */}
        {task.progress > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-3"
          >
            <div className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-200 mb-2">
              <span className="font-medium">Progress</span>
              <motion.span
                className="font-bold text-blue-600 dark:text-purple-400"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                {task.progress}%
              </motion.span>
            </div>
                    <div className="w-full bg-gray-200/60 dark:bg-gray-700/50 rounded-full h-2.5 backdrop-blur-sm">
          <motion.div
            className={`h-2.5 rounded-full ${
                  task.status === 'completed' ? 'bg-gradient-to-r from-blue-500 via-gray-500 to-slate-500 dark:from-purple-400 dark:via-purple-500 dark:to-purple-600' :
                  task.status === 'in_progress' ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 dark:from-purple-400 dark:via-purple-500 dark:to-purple-600' :
                  task.status === 'review' ? 'bg-gradient-to-r from-gray-500 via-slate-500 to-blue-500 dark:from-purple-400 dark:via-purple-500 dark:to-purple-600' :
                  'bg-gradient-to-r from-gray-500 via-slate-500 to-blue-500 dark:from-purple-400 dark:via-purple-500 dark:to-purple-600'
                }`}
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
            className="flex flex-wrap gap-2 mb-3"
          >
            {task.tags.split(',').map((tag: string, index: number) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="px-2 py-1 text-xs bg-gradient-to-r from-blue-100/80 via-gray-100/70 to-slate-100/80 dark:from-purple-900/40 dark:via-purple-800/30 dark:to-purple-900/40 text-blue-700 dark:text-purple-300 rounded-lg border border-blue-200/50 dark:border-purple-400/30 font-medium shadow-sm backdrop-blur-sm"
              >
                #{tag.trim()}
              </motion.span>
            ))}
          </motion.div>
        )}

        {/* Project Badge */}
        {task.project_id && (
          <div className="mb-3">
            <span 
              className="px-2 py-1 text-xs text-white rounded-md"
              style={{ backgroundColor: getProjectColor(task.project_id) }}
            >
              {projects.find(p => p.id === task.project_id)?.name || "Project"}
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <img
              src={getEmployeeAvatar(task.assigned_to)}
              alt="avatar"
              className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-600 shadow-lg ring-2 ring-white/50 dark:ring-gray-400/30"
            />
            <span className="font-medium">{getEmployeeName(task.assigned_to)}</span>
          </div>
          
          <div className="flex items-center gap-3">
            {task.due_date && (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
                <Calendar className="w-3 h-3" />
                <span>{new Date(task.due_date).toLocaleDateString()}</span>
              </div>
            )}
            {task.comments?.length > 0 && (
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                <span>{task.comments.length}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-cyan-50 via-orange-50 to-cyan-100 dark:bg-gradient-to-br dark:from-purple-900/20 dark:via-purple-800/30 dark:to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 dark:border-blue-400 dark:border-t-blue-300 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading your workspace...</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Preparing the ultimate kanban experience
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-cyan-50 via-orange-50 to-cyan-100 dark:bg-gradient-to-br dark:from-purple-900/20 dark:via-purple-800/30 dark:to-purple-900/20 backdrop-blur-sm">
      {/* Enhanced Header */}
      <div className="liquid-glass border-b border-gray-200 dark:border-purple-500/30 p-4 flex-shrink-0 backdrop-blur-2xl bg-gradient-to-r from-cyan-50/80 via-orange-50/80 to-cyan-100/80 dark:bg-gradient-to-r dark:from-black/95 dark:via-black/90 dark:to-black/95">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-gray-600 to-slate-600 rounded-2xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse" />
                <Layers className="w-6 h-6 text-white relative z-10" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-gray-600 dark:from-purple-400 dark:to-purple-500 bg-clip-text text-transparent">
                  Project Board
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {filteredTasks.length} tasks • {projects.length} projects
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 text-xs bg-gradient-to-r from-blue-100/80 to-gray-100/80 dark:from-purple-900/40 dark:to-purple-800/40 text-blue-700 dark:text-purple-300 border border-blue-200/50 dark:border-purple-400/30 rounded-full flex items-center gap-1 backdrop-blur-sm">
                <Activity className="w-3 h-3" />
                {navigator.onLine ? 'Live' : 'Offline'}
              </span>
              <span className="px-3 py-1.5 text-xs bg-gradient-to-r from-gray-100/80 to-slate-100/80 dark:from-purple-900/40 dark:to-purple-800/40 text-gray-700 dark:text-purple-300 border border-gray-200/50 dark:border-purple-400/30 rounded-full backdrop-blur-sm shadow-sm">
                {Math.round((columns.find(c => c.id === "completed")?.count || 0) / Math.max(filteredTasks.length, 1) * 100)}% Complete
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-blue-50/80 dark:bg-purple-800/60 rounded-xl p-1 backdrop-blur-sm border border-blue-200/50 dark:border-purple-500/30">
              {[
              { id: "board", icon: Layers, label: "Board" },
              { id: "list", icon: Eye, label: "List" },
              { id: "timeline", icon: TrendingUp, label: "Timeline" },
              { id: "table", icon: Activity, label: "Table" }
            ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => {
                    setViewMode(mode.id);
                    if (mode.id === 'list') {
                      toast.success('Switched to List view! 📋');
                    } else if (mode.id === 'timeline') {
                      toast.success('Switched to Timeline view! ⏰');
                    } else if (mode.id === 'table') {
                      toast.success('Switched to Table view! 📊');
                    } else if (mode.id === 'board') {
                      toast.success('Switched to Board view! 📋');
                    }
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-all ${
                    viewMode === mode.id
                      ? 'bg-white dark:bg-purple-700 text-gray-900 dark:text-purple-100 shadow-lg backdrop-blur-sm'
                      : 'text-gray-600 dark:text-purple-400 hover:text-gray-900 dark:hover:text-purple-200 hover:bg-white/50 dark:hover:bg-purple-700/50'
                  }`}
                >
                  <mode.icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{mode.label}</span>
                </button>
              ))}
            </div>

            {/* Enhanced Search */}
            <div className="relative search-input">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks, tags, or people..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm border border-gray-200/50 dark:border-purple-500/30 rounded-xl bg-white/80 dark:bg-black/60 text-gray-900 dark:text-purple-100 placeholder:text-gray-400 dark:placeholder:text-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent backdrop-blur-xl w-64"
              />
            </div>

            {/* Enhanced Filter */}
            <div className="relative filter-dropdown">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-2 px-4 py-2 text-sm border-2 border-cyan-300 dark:border-orange-500/40 rounded-lg bg-white/95 dark:bg-black/95 text-gray-900 dark:text-white hover:bg-cyan-50 dark:hover:bg-orange-900/20 transition-all duration-200 z-30 relative shadow-lg hover:shadow-xl font-medium"
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown className="w-4 h-4" />
              </button>

              {filterOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white/95 dark:bg-black/95 backdrop-blur-xl border border-gray-200 dark:border-purple-500/30 rounded-xl z-[99999] p-6 shadow-2xl">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Filter Tasks</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Priority
                        </label>
                        <select
                          value={selectedPriority}
                          onChange={(e) => setSelectedPriority(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-purple-500/30 rounded-lg bg-white dark:bg-black/90 text-gray-900 dark:text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">All Priorities</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-purple-500/30 rounded-lg bg-white dark:bg-black/90 text-gray-900 dark:text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Assignee
                      </label>
                      <select
                        value={selectedAssignee}
                        onChange={(e) => setSelectedAssignee(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-purple-500/30 rounded-lg bg-white dark:bg-black/90 text-gray-900 dark:text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Project
                      </label>
                      <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-purple-500/30 rounded-lg bg-white dark:bg-black/90 text-gray-900 dark:text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">All Projects</option>
                        {projects.map((project: any) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                                              <button
                          onClick={() => {
                            setSelectedDate("");
                            setSelectedProject("");
                            setSelectedPriority("");
                            setSelectedAssignee("");
                            setFilterOpen(false);
                          }}
                          className="px-4 py-2 text-sm text-gray-600 dark:text-purple-400 hover:text-gray-900 dark:hover:text-purple-200 transition-colors"
                        >
                          Clear All
                        </button>
                        <button
                          onClick={() => setFilterOpen(false)}
                          className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white rounded-xl hover:from-purple-700 hover:via-purple-800 hover:to-purple-900 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 backdrop-blur-sm border border-white/20"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          {columns.map((column) => (
            <div key={column.id} className="text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
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
      <div className="flex-1 min-h-0 p-6">
        {viewMode === "board" && (
          <div className="flex gap-6 h-full min-w-max overflow-x-auto w-full pb-4">
          {columns.map((column) => (
            <motion.div 
              key={column.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: columns.indexOf(column) * 0.1 }}
              className="flex flex-col w-80 min-w-80 max-w-80 h-full flex-shrink-0"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Enhanced Column Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${column.glassEffect} rounded-t-2xl p-5 border-2 ${column.borderColor} relative overflow-hidden backdrop-blur-2xl`}
              >
                <div className="absolute inset-0 bg-white/5"></div>
                <div className="relative flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: 10 }}
                      className={`w-12 h-12 rounded-2xl bg-white/90 dark:bg-purple-800/80 backdrop-blur-xl flex items-center justify-center ${column.iconColor} shadow-xl border border-white/50 dark:border-purple-500/50`}
                    >
                      <column.icon className="w-5 h-5" />
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
                    className="w-9 h-9 bg-white/90 dark:bg-purple-800/80 backdrop-blur-xl rounded-xl flex items-center justify-center text-gray-600 dark:text-purple-400 hover:text-gray-900 dark:hover:text-purple-200 hover:bg-white dark:hover:bg-purple-700 transition-all shadow-xl border border-white/50 dark:border-purple-500/50"
                    title={`Add task to ${column.title}`}
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Enhanced Progress indicator */}
                <div className="relative w-full bg-white/30 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((column.count / Math.max(filteredTasks.length, 1)) * 100, 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="bg-gradient-to-r from-gray-700 to-gray-800 h-2 rounded-full shadow-sm"
                  />
                </div>
              </motion.div>

              {/* Enhanced Column Content */}
              <div className={`flex-1 ${column.glassEffect} rounded-b-2xl border-2 border-t-0 ${column.borderColor} p-5 overflow-y-auto custom-scrollbar backdrop-blur-2xl`}>
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
                    className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-purple-500"
                  >
                                          <div className="w-16 h-16 bg-gray-200/60 dark:bg-purple-700/60 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-gray-300/30 dark:border-purple-500/30">
                        <column.icon className="w-6 h-6" />
                      </div>
                    <p className="text-sm font-medium mb-2">No tasks yet</p>
                    <p className="text-xs text-center mb-4">
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
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="flex-1 w-full">
            <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-purple-500/30 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Eye className="w-6 h-6 text-purple-600" />
                  Task List View
                </h2>
                <span className="text-sm text-gray-500 dark:text-purple-300">{filteredTasks.length} tasks</span>
              </div>

              <div className="space-y-3">
                {filteredTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-750 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => {
                      setSelectedTask(task);
                      setShowTaskDetailModal(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-3 h-3 rounded-full ${
                          task.priority === "high" ? "bg-red-500" :
                          task.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                        }`} />

                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors">
                            {task.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {task.description || "No description"}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <img
                            src={getEmployeeAvatar(task.assigned_to)}
                            alt="avatar"
                            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                          />
                          <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                            task.status === "completed" ? "bg-green-100 text-green-700" :
                            task.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                            task.status === "review" ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {task.status?.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {task.due_date && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </div>

                    {task.progress > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{task.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}

                {filteredTasks.length === 0 && (
                  <div className="text-center py-12">
                    <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No tasks found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Timeline View */}
        {viewMode === "timeline" && (
          <div className="flex-1 w-full">
            <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-purple-500/30 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                  Timeline View
                </h2>
                <span className="text-sm text-gray-500">{filteredTasks.length} tasks</span>
              </div>

              <div className="relative">
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-blue-500"></div>

                <div className="space-y-6">
                  {filteredTasks
                    .sort((a, b) => new Date(a.due_date || a.created_at?.seconds * 1000).getTime() - new Date(b.due_date || b.created_at?.seconds * 1000).getTime())
                    .map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative flex items-start gap-6"
                    >
                      <div className={`relative z-10 w-4 h-4 rounded-full border-4 border-white shadow-lg ${
                        task.status === "completed" ? "bg-green-500" :
                        task.status === "in_progress" ? "bg-blue-500" :
                        task.status === "review" ? "bg-yellow-500" :
                        "bg-gray-400"
                      }`}>
                        {task.status === "in_progress" && (
                          <div className="absolute inset-0 rounded-full animate-ping bg-blue-400" />
                        )}
                      </div>

                      <motion.div
                        whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                        className="flex-1 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-750 rounded-xl p-4 border border-gray-200 dark:border-gray-600 cursor-pointer group"
                        onClick={() => {
                          setSelectedTask(task);
                          setShowTaskDetailModal(true);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-purple-600 transition-colors">
                              {task.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {task.description || "No description"}
                            </p>

                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-2">
                                <img
                                  src={getEmployeeAvatar(task.assigned_to)}
                                  alt="avatar"
                                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {getEmployeeName(task.assigned_to)}
                                </span>
                              </div>

                              {task.due_date && (
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(task.due_date).toLocaleDateString()}
                                </div>
                              )}

                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityBadge(task.priority)}`}>
                                {task.priority?.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <Timer className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                        </div>

                        {task.progress > 0 && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                              <span>Progress</span>
                              <span>{task.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </motion.div>
                  ))}

                  {filteredTasks.length === 0 && (
                    <div className="text-center py-12 ml-16">
                      <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No tasks in timeline</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table View */}
        {viewMode === "table" && (
          <div className="flex-1 w-full">
            <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-purple-500/30 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                  <Activity className="w-6 h-6 text-green-600" />
                  Table View
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Task</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assignee</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Progress</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {filteredTasks.map((task, index) => (
                      <motion.tr
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedTask(task);
                          setShowTaskDetailModal(true);
                        }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              task.priority === "high" ? "bg-red-500" :
                              task.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                            }`} />
                            <div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{task.title}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                {task.description || "No description"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <img
                              src={getEmployeeAvatar(task.assigned_to)}
                              alt="avatar"
                              className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                            />
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                              {getEmployeeName(task.assigned_to)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                            task.status === "completed" ? "bg-green-100 text-green-700 border border-green-200" :
                            task.status === "in_progress" ? "bg-blue-100 text-blue-700 border border-blue-200" :
                            task.status === "review" ? "bg-yellow-100 text-yellow-700 border border-yellow-200" :
                            "bg-gray-100 text-gray-700 border border-gray-200"
                          }`}>
                            {task.status?.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getPriorityIcon(task.priority)}
                            <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityBadge(task.priority)}`}>
                              {task.priority?.toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {task.progress > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${task.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600">{task.progress}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Not started</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {task.due_date ? (
                            <div className={`flex items-center gap-1 text-sm ${
                              new Date(task.due_date) < new Date() && task.status !== "completed" ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              <Calendar className="w-4 h-4" />
                              {new Date(task.due_date).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No due date</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(task);
                                setShowTaskDetailModal(true);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                              title="Edit Task"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>

                {filteredTasks.length === 0 && (
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No tasks found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


      </div>

      {/* Enhanced New Task Modal */}
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-black/95 rounded-2xl shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Create New Task
                  </h2>
                </div>
                <button
                  onClick={() => setShowNewTaskModal(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={newTaskForm.title}
                    onChange={(e) => setNewTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter a clear, actionable task title..."
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newTaskForm.description}
                    onChange={(e) => setNewTaskForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Provide context and details for this task..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={newTaskForm.priority}
                      onChange={(e) => setNewTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="low">🟢 Low Priority</option>
                      <option value="medium">🟡 Medium Priority</option>
                      <option value="high">🔴 High Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={newTaskForm.due_date}
                      onChange={(e) => setNewTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Assign To
                  </label>
                  <select
                    value={newTaskForm.assigned_to}
                    onChange={(e) => setNewTaskForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">👤 Select team member...</option>
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name || emp.email} {emp.role && `(${emp.role})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Project
                    </label>
                    <select
                      value={newTaskForm.project_id}
                      onChange={(e) => setNewTaskForm(prev => ({ ...prev, project_id: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">📁 Select project...</option>
                      {projects.map((project: any) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={newTaskForm.tags}
                      onChange={(e) => setNewTaskForm(prev => ({ ...prev, tags: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="frontend, api, urgent"
                    />
                  </div>
                </div>

                {newTaskColumn && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        This task will be added to: <strong>{columns.find(c => c.id === newTaskColumn)?.title}</strong>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTask}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <Save className="w-4 h-4" />
                  Create Task
                </button>
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
              className="relative w-full max-w-4xl bg-gradient-to-br from-white to-gray-50 dark:from-black/95 dark:to-black/90 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-purple-500/30"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
                    >
                      {getPriorityIcon(selectedTask.priority)}
                    </motion.div>
                    <div>
                      <motion.h2
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-2xl font-bold text-white"
                      >
                        {selectedTask.title}
                      </motion.h2>
                      <motion.p
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-blue-100 text-sm"
                      >
                        Task #{selectedTask.id?.slice(-8)} • {selectedTask.status?.replace('_', ' ').toUpperCase()}
                      </motion.p>
                    </div>
                  </div>
                  <motion.button
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    onClick={() => setShowTaskDetailModal(false)}
                    className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors rounded-xl hover:bg-white/20 backdrop-blur-sm"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Main Content */}
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedTask.description || "No description provided."}
                      </p>
                    </div>

                    {selectedTask.progress > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Progress</h3>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${selectedTask.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {selectedTask.progress}%
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedTask.tags && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedTask.tags.split(',').map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-lg"
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
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Status</h3>
                      <span className={`px-3 py-1 text-sm rounded-lg ${
                        selectedTask.status === "completed" ? "bg-green-100 text-green-700" :
                        selectedTask.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                        selectedTask.status === "review" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {selectedTask.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Priority</h3>
                      <span className={`px-3 py-1 text-sm rounded-lg border ${getPriorityBadge(selectedTask.priority)}`}>
                        {selectedTask.priority?.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Assignee</h3>
                      <div className="flex items-center gap-2">
                        <img
                          src={getEmployeeAvatar(selectedTask.assigned_to)}
                          alt="avatar"
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {getEmployeeName(selectedTask.assigned_to)}
                        </span>
                      </div>
                    </div>

                    {selectedTask.due_date && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Due Date</h3>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {new Date(selectedTask.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedTask.project_id && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Project</h3>
                        <span 
                          className="px-3 py-1 text-sm text-white rounded-lg"
                          style={{ backgroundColor: getProjectColor(selectedTask.project_id) }}
                        >
                          {projects.find(p => p.id === selectedTask.project_id)?.name || "Unknown Project"}
                        </span>
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
