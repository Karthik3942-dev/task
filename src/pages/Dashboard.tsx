import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
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
  Award,
  BarChart3,
  Sparkles,
  Trophy,
  Rocket,
} from "lucide-react";
import { collection, getDocs, addDoc, updateDoc, doc, Timestamp, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuthStore } from "../store/authStore";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, addDays, startOfDay } from "date-fns";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("month"); // month, week, day, timeline
  const [selectedProject, setSelectedProject] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cleanup = setupRealtimeListeners();
    return cleanup;
  }, []);

  const setupRealtimeListeners = () => {
    const unsubscribers: any[] = [];
    let mounted = true;
    let connectionTimeout: NodeJS.Timeout;
    let hasConnected = false;

    // Check network connectivity first
    if (!navigator.onLine) {
      console.warn("No internet connection detected - using offline mode");
      toast.error("No internet connection - using offline mode");
      loadMockData();
      return () => {};
    }

    // Enhanced mock data for better testing - Only user's tasks
    const getMockTasks = () => [
      {
        id: "mock-task-1",
        title: "Design System Enhancement",
        description: "Update the design system components with new branding guidelines and color schemes",
        date: new Date(),
        type: "task",
        status: "pending",
        priority: "high",
        project_id: "proj-1",
        assigned_to: user?.uid || "mock-user",
        created_by: "admin",
        due_date: new Date(Date.now() + 86400000),
      },
      {
        id: "mock-task-2",
        title: "API Integration Testing",
        description: "Test and validate all API endpoints for the new payment system",
        date: new Date(Date.now() + 86400000),
        type: "task",
        status: "in_progress",
        priority: "high",
        project_id: "proj-1",
        assigned_to: user?.uid || "mock-user",
        created_by: "admin",
        due_date: new Date(Date.now() + 172800000),
      },
      {
        id: "mock-task-3",
        title: "Code Review & Documentation",
        description: "Review code changes and update project documentation",
        date: new Date(Date.now() + 172800000),
        type: "task",
        status: "completed",
        priority: "medium",
        project_id: "proj-2",
        assigned_to: user?.uid || "mock-user",
        created_by: "admin",
        due_date: new Date(Date.now() - 86400000),
      }
    ];

    const getMockProjects = () => [
      { id: "proj-1", name: "Mobile app design", color: "#7c3aed" },
      { id: "proj-2", name: "Process", color: "#4f46e5" },
      { id: "proj-3", name: "Creative group", color: "#059669" },
      { id: "proj-4", name: "HR", color: "#dc2626" },
      { id: "proj-5", name: "Landing (empty)", color: "#ea580c" },
      { id: "proj-6", name: "Upgrade Defnox", color: "#0891b2" },
    ];

    const setupFirebaseWithTimeout = async () => {
      try {
        connectionTimeout = setTimeout(() => {
          if (!hasConnected && mounted) {
            console.warn("Firebase connection timeout - switching to offline mode");
            toast.error("Connection timeout - using offline mode");
            loadMockData();
          }
        }, 2000); // Reduce timeout to 2 seconds for faster fallback

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
                error.code === 'permission-denied' ||
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
        setEvents(getMockTasks());
        setProjects(getMockProjects());
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
              const taskEvents = snapshot.docs.map((doc) => ({
                id: doc.id,
                title: doc.data().title,
                description: doc.data().description,
                date: new Date(doc.data().due_date || Date.now()),
                type: "task",
                status: doc.data().status,
                priority: doc.data().priority,
                project_id: doc.data().project_id,
                assigned_to: doc.data().assigned_to,
                ...doc.data(),
              }));
              setEvents(taskEvents);
              setLoading(false);
            }
          },
          (error: any) => {
            console.warn("Tasks listener error:", error);

            // Handle specific error types
            if (error.message?.includes('Failed to fetch') ||
                error.code === 'unavailable' ||
                !navigator.onLine) {
              toast.error("Connection lost - using offline mode");
            } else {
              toast.error("Data sync error - using cached data");
            }

            if (mounted) {
              setEvents(getMockTasks());
              setLoading(false);
            }
          }
        );

        const projectsUnsub = onSnapshot(
          collection(db, "projects"),
          (snapshot) => {
            if (mounted) {
              const projectsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name,
                color: doc.data().color || "#7c3aed",
                ...doc.data(),
              }));
              setProjects(projectsData);
            }
          },
          (error: any) => {
            console.warn("Projects listener error:", error);

            // Handle specific error types
            if (error.message?.includes('Failed to fetch') ||
                error.code === 'unavailable' ||
                !navigator.onLine) {
              console.warn("Projects connection lost - using cached data");
            }

            if (mounted) {
              setProjects(getMockProjects());
            }
          }
        );

        unsubscribers.push(tasksUnsub, projectsUnsub);
      } catch (error: any) {
        console.error("Failed to setup Firebase listeners:", error);
        if (mounted) {
          const errorMessage = error.message?.includes('Failed to fetch') || !navigator.onLine
            ? "No internet connection - using offline mode"
            : "Connection error - using offline mode";
          toast.error(errorMessage);
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
  };

  // Calendar date calculations based on view mode
  const getCalendarDays = () => {
    if (viewMode === "day") {
      return [currentDate];
    } else if (viewMode === "week") {
      const weekStart = startOfWeek(currentDate);
      return eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
    } else {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart);
      const calendarEnd = endOfWeek(monthEnd);
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }
  };

  const calendarDays = getCalendarDays();

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventMatches = isSameDay(event.date, date);
      const projectMatches = selectedProject === "all" || event.project_id === selectedProject;
      const searchMatches = !searchTerm || event.title.toLowerCase().includes(searchTerm.toLowerCase());

      return eventMatches && projectMatches && searchMatches;
    });
  };

  const nextPeriod = () => {
    if (viewMode === "day") {
      setCurrentDate(addDays(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const prevPeriod = () => {
    if (viewMode === "day") {
      setCurrentDate(addDays(currentDate, -1));
    } else if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const getEventColor = (event: any) => {
    const project = projects.find(p => p.id === event.project_id);
    if (project) return project.color;
    
    switch (event.priority) {
      case "high": return "#dc2626";
      case "medium": return "#ea580c";
      case "low": return "#059669";
      default: return "#6b7280";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "in_progress": return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400";
      case "review": return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400";
      case "pending": return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400";
      default: return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getDateLabel = () => {
    if (viewMode === "day") {
      return format(currentDate, "EEEE, MMMM d, yyyy");
    } else if (viewMode === "week") {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = addDays(weekStart, 6);
      return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
    } else {
      return format(currentDate, "MMMM yyyy");
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 dark:from-indigo-950 dark:via-purple-950 dark:to-indigo-950">
        <motion.div className="text-center">
          <motion.div className="relative mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 border-4 border-purple-500 dark:border-purple-400 border-t-transparent rounded-full mx-auto"
            />
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-2">
              Loading your workspace...
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Preparing your dashboard experience
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Updated stats cards with specific content and themes
  const statCards = [
    {
      title: "Total Projects",
      value: 4,
      icon: Target,
      gradient: "from-purple-600 to-indigo-600",
      bgGradient: "from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30",
      change: null,
    },
    {
      title: "Active Teams",
      value: "100%",
      icon: Users,
      gradient: "from-emerald-600 to-green-600",
      bgGradient: "from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30",
      change: null,
    },
    {
      title: "Total Tasks",
      value: 3,
      icon: CheckCircle,
      gradient: "from-blue-600 to-cyan-600",
      bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30",
      change: "+12% from last month",
    },
    {
      title: "Efficiency Score",
      value: Math.round((events.filter(e => e.status === "completed").length / Math.max(events.length, 1)) * 100) + "%",
      icon: Award,
      gradient: "from-amber-600 to-orange-600",
      bgGradient: "from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30",
      change: null,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 dark:from-indigo-950 dark:via-purple-950 dark:to-indigo-950 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg"
            >
              <Sparkles className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-gray-900 dark:text-white mb-1"
              >
                Welcome back, {user?.email?.split('@')[0]}! 👋
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 dark:text-gray-400 text-sm"
              >
                Here's your project overview for today
              </motion.p>
            </div>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-lg"
          >
            <Trophy className="h-4 w-4" />
            <span className="font-semibold text-sm">Dashboard</span>
          </motion.div>
        </motion.div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${stat.bgGradient} p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-gray-700/50`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {stat.value}
                    </p>
                    {stat.change && (
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
                        <span className="text-sm text-emerald-500 font-medium">
                          {stat.change}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.gradient} shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                
                {/* Animated background gradient */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full"
                  animate={{ x: ["0%", "200%"] }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 2,
                    ease: "linear"
                  }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions & Upcoming Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl border border-purple-200/50 dark:border-purple-800/50 p-4 shadow-lg"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg mr-2">
                <Rocket className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Quick Actions
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Jump to your tasks
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/mytasks')}
                className="w-full p-3 text-left bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30 rounded-lg border border-purple-200 dark:border-purple-700 transition-all cursor-pointer group"
              >
                <div className="flex items-center">
                  <Target className="h-4 w-4 text-purple-600 dark:text-purple-400 mr-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    View My Tasks
                  </span>
                </div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/calendar')}
                className="w-full p-3 text-left bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 hover:from-emerald-100 hover:to-green-100 dark:hover:from-emerald-900/30 dark:hover:to-green-900/30 rounded-lg border border-emerald-200 dark:border-emerald-700 transition-all cursor-pointer group"
              >
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mr-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Check Calendar
                  </span>
                </div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/Performance')}
                className="w-full p-3 text-left bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30 rounded-lg border border-blue-200 dark:border-blue-700 transition-all cursor-pointer group"
              >
                <div className="flex items-center">
                  <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    View Performance
                  </span>
                </div>
              </motion.button>
            </div>
          </motion.div>

          {/* Upcoming Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl border border-purple-200/50 dark:border-purple-800/50 p-4 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg mr-2">
                  <Activity className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Recent Activity
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Your latest tasks and updates
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-600 dark:text-amber-400 rounded-full text-xs font-medium border border-amber-200 dark:border-amber-700">
                {events.length} events
              </span>
            </div>
            {events.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {events.slice(0, 5).map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-lg border-l-3 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 transition-all group"
                    style={{ borderLeftColor: getEventColor(event) }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {event.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {event.description || "No description"}
                        </p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(event.status)}`}>
                        {event.status || "pending"}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                </motion.div>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  No recent activity. Start working on tasks! 🚀
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Task Calendar Board */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-purple-200/50 dark:border-purple-800/50 p-8 shadow-xl"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 10 }}
                className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl mr-4"
              >
                <Calendar className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Task Calendar Board
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track your deadlines and schedule
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={prevPeriod}
                  className="p-3 hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded-xl transition-colors border border-purple-200 dark:border-purple-700"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={nextPeriod}
                  className="p-3 hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded-xl transition-colors border border-purple-200 dark:border-purple-700"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </motion.button>
              </div>
              <span className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium border border-emerald-200 dark:border-emerald-700">
                {events.length} tasks
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
              {getDateLabel()}
            </h4>
          </div>

          {/* Week Headers */}
          <div className="grid grid-cols-7 border-b border-purple-200 dark:border-purple-700 mb-6">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                className="p-4 text-center text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              const dayEvents = getEventsForDate(day);
              const isToday_ = isToday(day);
              const isCurrentMonth = viewMode === "week" || isSameMonth(day, currentDate);

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.01 }}
                  whileHover={{ scale: 1.02 }}
                  className={`p-3 min-h-[120px] border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all cursor-pointer relative rounded-xl ${
                    !isCurrentMonth ? "text-gray-400 bg-gray-50/50 dark:bg-gray-800/50" : ""
                  } ${isToday_ ? "bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 border-purple-400 dark:border-purple-600" : ""}`}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className={`text-sm font-medium mb-3 ${
                    isToday_
                      ? "w-7 h-7 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold"
                      : ""
                  }`}>
                    {format(day, "d")}
                  </div>

                  <div className="space-y-2 overflow-hidden">
                    {dayEvents.slice(0, 2).map((event, eventIndex) => (
                      <motion.div
                        key={eventIndex}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: eventIndex * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                        className={`text-xs px-3 py-2 rounded-lg border text-left cursor-pointer hover:shadow-lg transition-all ${getStatusColor(event.status)}`}
                        style={{
                          borderLeftWidth: "4px",
                          borderLeftColor: getEventColor(event)
                        }}
                        title={`${event.title} - ${event.status}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Show task description modal
                          toast.success(`Task: ${event.title}\n\nDescription: ${event.description || "No description provided"}`);
                        }}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        {event.description && (
                          <div className="text-gray-600 dark:text-gray-400 truncate text-xs mt-1">
                            {event.description.substring(0, 30)}...
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Calendar Stats */}
          <div className="grid grid-cols-3 gap-6 mt-8">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="text-center p-6 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-700 shadow-lg"
            >
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                {events.filter(t => t.status === "completed").length}
              </div>
              <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Completed</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="text-center p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-700 shadow-lg"
            >
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2">
                {events.filter(t => t.status === "in_progress").length}
              </div>
              <div className="text-sm font-medium text-amber-700 dark:text-amber-300">In Progress</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="text-center p-6 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-2xl border border-red-200 dark:border-red-700 shadow-lg"
            >
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                {events.filter(t => {
                  if (!t.date) return false;
                  return new Date() > t.date && t.status !== "completed";
                }).length}
              </div>
              <div className="text-sm font-medium text-red-700 dark:text-red-300">Overdue</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
