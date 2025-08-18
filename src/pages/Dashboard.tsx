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
  Briefcase,
  Settings,
  FolderOpen,
  UserCheck,
  ArrowLeft,
  PieChart,
} from "lucide-react";
import { collection, getDocs, addDoc, updateDoc, doc, Timestamp, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuthStore } from "../store/authStore";
import { useTaskManagement } from "../hooks/useTaskManagement";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, addDays, startOfDay } from "date-fns";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader } from "@/components/ui/loader";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Unified task management
  const { tasks, loading: tasksLoading, moveTask, getTaskStats } = useTaskManagement();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("month");
  const [selectedProject, setSelectedProject] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDayTasksModal, setShowDayTasksModal] = useState(false);
  const [selectedDayTasks, setSelectedDayTasks] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const cleanup = setupRealtimeListeners();
    return cleanup;
  }, []);

  const setupRealtimeListeners = () => {
    const unsubscribers: any[] = [];
    let mounted = true;
    let connectionTimeout: NodeJS.Timeout;
    let hasConnected = false;

    if (!navigator.onLine) {
      console.warn("No internet connection detected");
      toast.error("No internet connection");
      setLoading(false);
      return () => {};
    }

    const setupFirebaseWithTimeout = async () => {
      try {
        connectionTimeout = setTimeout(() => {
          if (!hasConnected && mounted) {
            console.warn("Firebase connection timeout");
            toast.error("Connection timeout");
            setLoading(false);
          }
        }, 3000);

        const testConnection = async () => {
          try {
            const testQuery = query(collection(db, "tasks"), where("assigned_to", "==", user?.uid || ""));
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Connection timeout')), 2000)
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
            ? "No internet connection"
            : "Firebase connection failed";
          toast.error(errorMessage);
          setLoading(false);
        }
      }
    };

    const setupRealtimeListeners = () => {
      try {
        // Tasks listener
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
                created_by: doc.data().created_by,
                created_at: doc.data().created_at,
                progress_updated_at: doc.data().progress_updated_at,
                task_id: doc.data().task_id,
                progress: doc.data().progress,
                tags: doc.data().tags,
                ...doc.data(),
              }));
              setEvents(taskEvents);
              setLoading(false);
            }
          },
          (error: any) => {
            console.warn("Tasks listener error:", error);
            if (mounted) {
              setEvents([]);
              setLoading(false);
            }
          }
        );

        // Projects listener
        const projectsUnsub = onSnapshot(
          collection(db, "projects"),
          (snapshot) => {
            if (mounted) {
              const projectsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name,
                color: doc.data().color || "#06b6d4",
                ...doc.data(),
              }));
              setProjects(projectsData);
            }
          },
          (error: any) => {
            console.warn("Projects listener error:", error);
            if (mounted) {
              setProjects([]);
            }
          }
        );

        // Teams listener
        const teamsUnsub = onSnapshot(
          collection(db, "teams"),
          (snapshot) => {
            if (mounted) {
              const teamsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setTeams(teamsData);
            }
          },
          (error: any) => {
            console.warn("Teams listener error:", error);
            if (mounted) {
              setTeams([]);
            }
          }
        );

        // Employees listener
        const employeesUnsub = onSnapshot(
          collection(db, "employees"),
          (snapshot) => {
            if (mounted) {
              const employeesData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setEmployees(employeesData);
            }
          },
          (error: any) => {
            console.warn("Employees listener error:", error);
            if (mounted) {
              setEmployees([]);
            }
          }
        );

        unsubscribers.push(tasksUnsub, projectsUnsub, teamsUnsub, employeesUnsub);
      } catch (error: any) {
        console.error("Failed to setup Firebase listeners:", error);
        if (mounted) {
          toast.error("Connection error");
          setLoading(false);
        }
      }
    };

    setupFirebaseWithTimeout();

    return () => {
      mounted = false;
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
      unsubscribers.forEach(unsub => {
        try {
          unsub();
        } catch (error) {
          console.warn("Error unsubscribing:", error);
        }
      });
    };
  };

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
      const statusMatches = statusFilter === "all" ||
        (statusFilter === "overdue" && new Date() > event.date && event.status !== "completed") ||
        (statusFilter !== "overdue" && event.status === statusFilter);

      return eventMatches && projectMatches && searchMatches && statusMatches;
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
      case "high": return "#ef4444";
      case "medium": return "#f59e0b";
      case "low": return "#10b981";
      default: return "#6b7280";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800";
      case "in_progress": return "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800";
      case "review": return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800";
      case "pending": return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800";
      default: return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800";
      case "medium":
        return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800";
      case "low":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800";
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

  const getEmployeeName = (empId: string) =>
    employees.find((emp: any) => emp.id === empId)?.name || "Unassigned";

  // Data for charts
  const taskStatusData = [
    { name: 'Completed', value: events.filter(t => t.status === "completed").length, color: '#10b981' },
    { name: 'In Progress', value: events.filter(t => t.status === "in_progress").length, color: '#06b6d4' },
    { name: 'Pending', value: events.filter(t => t.status === "pending").length, color: '#6b7280' },
    { name: 'Review', value: events.filter(t => t.status === "review").length, color: '#f59e0b' },
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center bg-gray-50 dark:bg-black">
        <Loader size="lg">
          <span className="text-gray-600 dark:text-gray-300">Loading workspace...</span>
        </Loader>
      </div>
    );
  }

  // Calculate overall performance score like in Performance page
  const calculateOverallScore = () => {
    const totalTasks = events.length;

    // Check both status and progress_status fields
    const completedTasks = events.filter(e =>
      e.status === "completed" || e.progress_status === "completed"
    ).length;

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const onTimeTasks = events.filter(event => {
      const isCompleted = event.status === "completed" || event.progress_status === "completed";
      if (!isCompleted) return false;

      // Check for due date in multiple possible fields
      const dueDate = event.due_date || event.date;
      if (!dueDate) return false;

      // Get completion date from progress_updated_at or updated_at
      const updatedTime = event.progress_updated_at || event.updated_at;
      if (!updatedTime) return false;

      const dueDateObj = new Date(dueDate.toDate ? dueDate.toDate() : dueDate);
      const completedDateObj = updatedTime.toDate ?
        updatedTime.toDate() :
        (updatedTime.seconds ? new Date(updatedTime.seconds * 1000) : new Date(updatedTime));

      return completedDateObj <= dueDateObj;
    }).length;

    const onTimeRate = completedTasks > 0 ? (onTimeTasks / completedTasks) * 100 : 0;

    // Enhanced overall score calculation with better weighting
    const pendingTasks = events.filter(e =>
      e.status === "pending" || e.progress_status === "pending"
    ).length;
    const inProgressTasks = events.filter(e =>
      e.status === "in_progress" || e.progress_status === "in_progress"
    ).length;

    // Factor in task distribution and efficiency
    const taskEfficiency = totalTasks > 0 ?
      ((completedTasks * 100) + (inProgressTasks * 50) + (pendingTasks * 20)) / (totalTasks * 100) * 100 : 0;

    const overallScore = Math.round(
      (completionRate * 0.4) +
      (onTimeRate * 0.3) +
      (taskEfficiency * 0.3)
    );

    return Math.min(100, Math.max(0, overallScore));
  };

  // Real data stat cards with navigation
  const statCards = [
    {
      title: "My Tasks",
      value: events.length,
      icon: Target,
      color: "cyan",
      route: "/mytasks",
      description: "View all assigned tasks"
    },
    {
      title: "Projects",
      value: projects.length,
      icon: FolderOpen,
      color: "green",
      route: "/projects",
      description: "Manage projects"
    },
    {
      title: "Performance",
      value: Math.round((events.filter(e => e.status === "completed").length / Math.max(events.length, 1)) * 100) + "%",
      icon: Award,
      color: "orange",
      route: "/Performance",
      description: "View analytics"
    },
    {
      title: "Overall Score",
      value: calculateOverallScore() + "%",
      icon: Trophy,
      color: "purple",
      route: "/Performance",
      description: "Performance score"
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-md bg-cyan-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user?.email?.split('@')[0]}! 👋
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Here's your project overview for today
              </p>
            </div>
          </div>
          <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-xs border border-green-200 dark:border-green-800">
            Real Data
          </span>
        </div>

        {/* Interactive Stats Cards with Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                whileHover={{ y: -2 }}
                onClick={() => navigate(stat.route)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`p-2 rounded-md transition-all group-hover:scale-110 ${
                    stat.color === 'cyan' ? 'bg-cyan-100 dark:bg-cyan-900/30' :
                    stat.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
                    stat.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/30' :
                    stat.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30' :
                    'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <Icon className={`h-4 w-4 ${
                      stat.color === 'cyan' ? 'text-cyan-600 dark:text-cyan-400' :
                      stat.color === 'green' ? 'text-green-600 dark:text-green-400' :
                      stat.color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
                      stat.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`} />
                  </div>
                </div>
                <div className="flex items-center justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Charts & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Task Status Chart */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-cyan-500 rounded-md mr-2">
                <PieChart className="h-3 w-3 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Task Status
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Distribution by status
                </p>
              </div>
            </div>
            <div className="h-40">
              {taskStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                  No task data
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="p-2 bg-orange-500 rounded-md mr-2">
                  <Activity className="h-3 w-3 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Recent Activity
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your latest tasks and updates
                  </p>
                </div>
              </div>
              <span className="px-2 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full text-xs border border-orange-200 dark:border-orange-800">
                {statusFilter === "all" ? events.length :
                  statusFilter === "overdue" ? events.filter(t => t.date && new Date() > t.date && t.status !== "completed").length :
                  events.filter(t => t.status === statusFilter).length
                } {statusFilter === "all" ? "tasks" : statusFilter === "overdue" ? "overdue" : statusFilter.replace("_", " ")}
              </span>
            </div>
            {events.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {events
                  .sort((a, b) => {
                    const aTime = a.progress_updated_at?.seconds || a.created_at?.seconds || 0;
                    const bTime = b.progress_updated_at?.seconds || b.created_at?.seconds || 0;
                    return bTime - aTime;
                  })
                  .slice(0, 5)
                  .map((event, index) => (
                    <div
                      key={event.id}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border-l-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      style={{ borderLeftColor: getEventColor(event) }}
                      onClick={() => {
                        setSelectedTask(event);
                        setShowTaskDetailModal(true);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {event.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {event.description || "No description"}
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs border ${getStatusColor(event.status)}`}>
                          {event.status || "pending"}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No tasks assigned yet. Check back later! 🚀
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Task Calendar Board */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-2 bg-cyan-500 rounded-md mr-3">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Task Calendar Board
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Track your deadlines and schedule
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={prevPeriod}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors border border-gray-200 dark:border-gray-700"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={nextPeriod}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors border border-gray-200 dark:border-gray-700"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
              <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-xs border border-green-200 dark:border-green-800">
                {events.length} tasks
              </span>
            </div>
          </div>

          {/* Task Status Overview - Moved to Top with Filtering */}
          <div className="grid grid-cols-4 gap-3 mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <button
              onClick={() => setStatusFilter("all")}
              className={`text-center p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                statusFilter === "all"
                  ? "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 ring-2 ring-cyan-500"
                  : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-1">
                {events.length}
              </div>
              <div className="text-xs text-gray-700 dark:text-gray-300 font-medium">All Tasks</div>
            </button>

            <button
              onClick={() => setStatusFilter("completed")}
              className={`text-center p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                statusFilter === "completed"
                  ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 ring-2 ring-green-500"
                  : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30"
              }`}
            >
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                {events.filter(t => t.status === "completed").length}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300 font-medium">Completed</div>
            </button>

            <button
              onClick={() => setStatusFilter("in_progress")}
              className={`text-center p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                statusFilter === "in_progress"
                  ? "bg-cyan-100 dark:bg-cyan-900/30 border-cyan-300 dark:border-cyan-700 ring-2 ring-cyan-500"
                  : "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/30"
              }`}
            >
              <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mb-1">
                {events.filter(t => t.status === "in_progress").length}
              </div>
              <div className="text-xs text-cyan-700 dark:text-cyan-300 font-medium">In Progress</div>
            </button>

            <button
              onClick={() => setStatusFilter("overdue")}
              className={`text-center p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                statusFilter === "overdue"
                  ? "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 ring-2 ring-red-500"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30"
              }`}
            >
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                {events.filter(t => {
                  if (!t.date) return false;
                  return new Date() > t.date && t.status !== "completed";
                }).length}
              </div>
              <div className="text-xs text-red-700 dark:text-red-300 font-medium">Overdue</div>
            </button>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              {getDateLabel()}
            </h4>
            {statusFilter !== "all" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Filtering by: <span className="font-medium capitalize">{statusFilter === "overdue" ? "Overdue" : statusFilter.replace("_", " ")}</span>
                </span>
                <button
                  onClick={() => setStatusFilter("all")}
                  className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-200 transition-colors"
                >
                  Clear Filter
                </button>
              </div>
            )}
          </div>

          {/* Week Headers */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 mb-4">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                className="p-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const dayEvents = getEventsForDate(day);
              const isToday_ = isToday(day);
              const isCurrentMonth = viewMode === "week" || isSameMonth(day, currentDate);

              return (
                <div
                  key={index}
                  className={`p-2 min-h-[100px] border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer rounded-md ${
                    !isCurrentMonth ? "text-gray-400 bg-gray-50/50 dark:bg-gray-800/50" : ""
                  } ${isToday_ ? "bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800" : ""}`}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className={`text-xs font-medium mb-2 ${
                    isToday_
                      ? "w-5 h-5 bg-cyan-500 text-white rounded-full flex items-center justify-center text-xs font-bold"
                      : ""
                  }`}>
                    {format(day, "d")}
                  </div>

                  <div className="space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((event, eventIndex) => (
                      <div
                        key={eventIndex}
                        className={`text-xs px-2 py-1 rounded border text-left cursor-pointer hover:shadow-sm transition-all ${getStatusColor(event.status)}`}
                        style={{
                          borderLeftWidth: "2px",
                          borderLeftColor: getEventColor(event)
                        }}
                        title={`${event.title} - ${event.status}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(event);
                          setShowTaskDetailModal(true);
                        }}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        {event.description && (
                          <div className="text-gray-500 dark:text-gray-400 truncate text-xs mt-1">
                            {event.description.substring(0, 25)}...
                          </div>
                        )}
                      </div>
                    ))}

                    {dayEvents.length > 2 && (
                      <div 
                        className="text-xs text-gray-500 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDayTasks(dayEvents);
                          setShowDayTasksModal(true);
                        }}
                      >
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Day Tasks Modal */}
      <AnimatePresence>
        {showDayTasksModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowDayTasksModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    All Tasks
                  </h2>
                  <button
                    onClick={() => setShowDayTasksModal(false)}
                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {selectedDayTasks.map((task, index) => (
                    <div
                      key={task.id}
                      className={`p-3 rounded border text-left cursor-pointer hover:shadow-sm transition-all ${getStatusColor(task.status)}`}
                      style={{
                        borderLeftWidth: "3px",
                        borderLeftColor: getEventColor(task)
                      }}
                      onClick={() => {
                        setSelectedTask(task);
                        setShowDayTasksModal(false);
                        setShowTaskDetailModal(true);
                      }}
                    >
                      <div className="font-medium text-sm">{task.title}</div>
                      {task.description && (
                        <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                          {task.description.substring(0, 50)}...
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className={`px-1.5 py-0.5 text-xs rounded ${getPriorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          {task.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {showTaskDetailModal && selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowTaskDetailModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowTaskDetailModal(false)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      Task Details
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowTaskDetailModal(false)}
                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Task Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex-1">
                      {selectedTask.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded border ${getPriorityBadge(selectedTask.priority)}`}>
                      {selectedTask.priority?.toUpperCase()} PRIORITY
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>Assigned to: {getEmployeeName(selectedTask.assigned_to)}</span>
                    </div>
                    {selectedTask.due_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Due: {new Date(selectedTask.due_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Flag className="w-4 h-4" />
                      <span>Status: {selectedTask.status}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedTask.description && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {selectedTask.description}
                    </p>
                  </div>
                )}

                {/* Progress */}
                {selectedTask.progress > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Progress</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Completion</span>
                        <span className="font-medium text-cyan-600 dark:text-cyan-400">
                          {selectedTask.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-cyan-500"
                          style={{ width: `${selectedTask.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {selectedTask.tags && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.tags.split(',').map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded border"
                        >
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Task ID and Created By */}
                {(selectedTask.task_id || selectedTask.created_by) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTask.task_id && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Task ID</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedTask.task_id}
                        </p>
                      </div>
                    )}
                    {selectedTask.created_by && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Created By</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {getEmployeeName(selectedTask.created_by)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Created</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedTask.created_at?.seconds 
                        ? new Date(selectedTask.created_at.seconds * 1000).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>
                  {selectedTask.progress_updated_at && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Last Updated</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedTask.progress_updated_at?.seconds 
                          ? new Date(selectedTask.progress_updated_at.seconds * 1000).toLocaleString()
                          : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
