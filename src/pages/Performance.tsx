import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { useAuthStore } from "../store/authStore";
import {
  TrendingUp,
  Target,
  CheckCircle,
  Clock,
  AlertTriangle,
  Award,
  BarChart3,
  Activity,
  Calendar as CalendarIcon,
  Star,
  ArrowUp,
  ArrowDown,
  Users,
  Briefcase,
  Zap,
  RefreshCw,
  Sparkles,
  Trophy,
  Flame,
  Rocket,
  User,
  Flag,
  ArrowRight,
  Edit,
  Trash2,
  Eye,
  Timer,
} from "lucide-react";
import toast from "react-hot-toast";

// Custom Tooltip Component
const CustomTooltip = ({ performanceData, children }: { performanceData: any, children: React.ReactNode }) => {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-[320px] whitespace-pre-line text-sm p-4 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-xl shadow-xl backdrop-blur-sm"
        >
          <div className="font-semibold mb-3 text-purple-600 dark:text-purple-400">
            ⭐ Performance Score Breakdown
          </div>
          <div className="space-y-2 text-gray-800 dark:text-gray-200">
            <p className="flex justify-between">
              <span>🟦 <strong>Productivity Score:</strong></span>
              <span>{performanceData?.productivityScore ?? "0"} / 100</span>
            </p>
            <p className="flex justify-between">
              <span>🟩 <strong>Completion Rate:</strong></span>
              <span>{performanceData?.completionRate?.toFixed(1) ?? "0.0"}% / 100%</span>
            </p>
            <p className="flex justify-between">
              <span>🟨 <strong>On-Time Delivery:</strong></span>
              <span>{performanceData?.onTimeRate?.toFixed(1) ?? "0.0"}% / 100%</span>
            </p>
            <p className="flex justify-between">
              <span>🟪 <strong>Review Score:</strong></span>
              <span>{performanceData?.reviewScore ?? "0"} / 100</span>
            </p>
            <p className="flex justify-between">
              <span>🔵 <strong>HR Score:</strong></span>
              <span>
                {performanceData?.hrFeedbackScore !== undefined
                  ? Number(performanceData.hrFeedbackScore).toFixed(1)
                  : "0.0"}{" "}
                / 100
              </span>
            </p>
          </div>
          <hr className="my-3 border-purple-200 dark:border-purple-700" />
          <p className="font-bold text-purple-600 dark:text-purple-400 text-center">
            🏁 Final Score: {performanceData?.totalPerformanceScore ?? "0"}% / 100%
          </p>
        </motion.div>
      )}
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({ label, value, color = "blue", tooltip, icon: Icon }: any) => {
  const colorMap = {
    blue: "text-blue-600 dark:text-blue-400",
    green: "text-emerald-600 dark:text-emerald-400",
    yellow: "text-amber-600 dark:text-amber-400",
    red: "text-red-600 dark:text-red-400",
    purple: "text-purple-600 dark:text-purple-400",
  };

  const bgColorMap = {
    blue: "from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30",
    green: "from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30",
    yellow: "from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30",
    red: "from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30",
    purple: "from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="relative group"
    >
      <div className={`bg-gradient-to-br ${bgColorMap[color]} rounded-xl shadow-lg p-4 border border-white/20 dark:border-gray-700/50 cursor-default transition-all duration-300 hover:shadow-xl`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">{label}</p>
            <p className={`text-2xl font-bold ${colorMap[color]}`}>{value}</p>
          </div>
          {Icon && (
            <div className={`p-2 rounded-lg bg-gradient-to-r ${color === 'blue' ? 'from-blue-500 to-cyan-500' : color === 'green' ? 'from-emerald-500 to-green-500' : color === 'yellow' ? 'from-amber-500 to-orange-500' : color === 'red' ? 'from-red-500 to-rose-500' : 'from-purple-500 to-indigo-500'} shadow-lg`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          )}
        </div>
      </div>
      {tooltip && (
        <div className="absolute z-10 hidden group-hover:block bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 shadow-xl rounded-xl p-3 text-xs text-gray-600 dark:text-gray-300 w-64 mt-2 backdrop-blur-sm">
          {tooltip}
        </div>
      )}
    </motion.div>
  );
};

export default function EmployeePerformancePage() {
  const { user } = useAuthStore();

  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isSelfOnly, setIsSelfOnly] = useState(true);
  const [groupedEmployees, setGroupedEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noTeam, setNoTeam] = useState(false);
  const [performanceData, setPerformanceData] = useState<any>({});
  const [monthChartData, setMonthChartData] = useState<any[]>([]);
  const [dateChartData, setDateChartData] = useState<any[]>([]);
  const [usingOfflineMode, setUsingOfflineMode] = useState(false);

  console.log("👤 Current user from store:", user);

  // Mock data for offline mode
  const getMockData = () => {
    const mockTasks = [
      {
        id: "mock-task-1",
        title: "Design System Enhancement",
        description: "Update the design system components with new branding guidelines",
        progress_status: "completed",
        priority: "high",
        assigned_to: user?.uid || "mock-user",
        created_by: "admin",
        due_date: new Date(Date.now() + 86400000),
        created_at: { toDate: () => new Date(Date.now() - 172800000) },
        progress_updated_at: { toDate: () => new Date(Date.now() - 86400000) },
        reviewpoints: 85,
        reassign_history: [],
      },
      {
        id: "mock-task-2",
        title: "API Integration Testing",
        description: "Test and validate all API endpoints",
        progress_status: "completed",
        priority: "high",
        assigned_to: user?.uid || "mock-user",
        created_by: "admin",
        due_date: new Date(Date.now() + 172800000),
        created_at: { toDate: () => new Date(Date.now() - 259200000) },
        progress_updated_at: { toDate: () => new Date(Date.now() - 86400000) },
        reviewpoints: 92,
        reassign_history: [],
      },
      {
        id: "mock-task-3",
        title: "Performance Optimization",
        description: "Optimize application performance metrics",
        progress_status: "completed",
        priority: "medium",
        assigned_to: user?.uid || "mock-user",
        created_by: "admin",
        due_date: new Date(Date.now() - 172800000),
        created_at: { toDate: () => new Date(Date.now() - 345600000) },
        progress_updated_at: { toDate: () => new Date(Date.now() - 259200000) },
        reviewpoints: 88,
        reassign_history: [],
      },
      {
        id: "mock-task-4",
        title: "Security Implementation",
        description: "Implement security enhancements",
        progress_status: "in_progress",
        priority: "high",
        assigned_to: user?.uid || "mock-user",
        created_by: "admin",
        due_date: new Date(Date.now() + 432000000),
        created_at: { toDate: () => new Date(Date.now() - 86400000) },
        progress_updated_at: null,
        reviewpoints: null,
        reassign_history: [],
      }
    ];

    const mockEmployees = [
      {
        id: user?.uid || "mock-user",
        name: user?.email?.split('@')[0] || "Current User",
        department: "Engineering",
        email: user?.email || "user@example.com",
      }
    ];

    return { tasks: mockTasks, employees: mockEmployees };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🔥 useEffect triggered");
        console.log("👤 Current user:", user);

        if (!user?.uid) {
          console.warn("⚠ User UID not available yet");
          setLoading(false);
          return;
        }

        // Check network connectivity first
        if (!navigator.onLine) {
          console.warn("No internet connection detected - using offline mode");
          toast.error("No internet connection - using offline mode");
          setUsingOfflineMode(true);
          loadMockData();
          return;
        }

        // Try Firebase with timeout
        const fetchPromise = new Promise(async (resolve, reject) => {
          try {
            const teamsSnap = await getDocs(collection(db, "teams"));
            const empSnap = await getDocs(collection(db, "employees"));
            const taskSnap = await getDocs(collection(db, "tasks"));

            const allEmployees = empSnap.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            const tasksData = taskSnap.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            if (teamsSnap.empty) {
              console.warn("❌ No teams found for this user");
              setEmployees(allEmployees);
              setGroupedEmployees([]);
              setNoTeam(true);
              setTasks(tasksData);
              
              const loggedInEmployee = allEmployees.find(
                (emp) => emp.id === user.uid
              );
              setSelectedEmployee(loggedInEmployee);
              resolve({ success: true });
              return;
            }

            const grouped = teamsSnap.docs.map((teamDoc) => {
              const teamData = teamDoc.data();
              const memberIds = teamData.members || [];

              const members = allEmployees.filter((emp) =>
                memberIds.includes(emp.id)
              );

              const lead = allEmployees.find(
                (emp) => emp.id === teamData.created_by
              );

              return {
                teamId: teamDoc.id,
                teamName: teamData.teamName || "Unnamed Team",
                teamLead: lead?.name || "Unknown Lead",
                members,
              };
            });

            setGroupedEmployees(grouped);
            setEmployees(allEmployees);
            
            const loggedInEmployee = allEmployees.find(
              (emp) => emp.id === user.uid
            );
            setSelectedEmployee(loggedInEmployee);
            setTasks(tasksData);

            resolve({ success: true });
          } catch (error: any) {
            // Check for specific network errors
            if (error.message?.includes('Failed to fetch') ||
                error.message?.includes('timeout') ||
                error.code === 'unavailable' ||
                !navigator.onLine) {
              reject(new Error('Network connection failed'));
            } else {
              reject(error);
            }
          }
        });

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Firebase connection timeout')), 3000); // Reduce timeout to 3 seconds
        });

        await Promise.race([fetchPromise, timeoutPromise]);
        
        if (usingOfflineMode) {
          toast.success("Connection restored! Data updated.");
          setUsingOfflineMode(false);
        }

      } catch (error: any) {
        console.error("❌ Error loading data", error);

        // Use mock data as fallback
        const mockData = getMockData();
        setTasks(mockData.tasks);
        setEmployees(mockData.employees);
        setSelectedEmployee(mockData.employees[0]);
        setGroupedEmployees([]);
        setNoTeam(false);
        setUsingOfflineMode(true);

        const errorMessage = error.message?.includes('Failed to fetch') || !navigator.onLine
          ? "No internet connection - using offline mode"
          : "Connection failed - using offline mode";

        toast.error(errorMessage, {
          duration: 4000,
          icon: '📴'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.uid, usingOfflineMode]);

  useEffect(() => {
    if (!selectedEmployee || tasks.length === 0) return;

    const empTasks = tasks.filter(
      (task) => task.assigned_to === selectedEmployee.id
    );

    const perf = {
      total: empTasks.length,
      completed: 0,
      onTime: 0,
      reassigned: 0,
    };

    const dateMap: any = {};
    const monthMap: any = {};

    empTasks.forEach((task) => {
      const {
        progress_status,
        due_date,
        progress_updated_at,
        reassign_history = [],
      } = task;

      const completeDate = progress_updated_at?.toDate?.() || new Date();
      const dateKey = completeDate.toISOString().split("T")[0];
      const monthKey = completeDate.toISOString().slice(0, 7);

      if (!monthMap[monthKey])
        monthMap[monthKey] = { Completed: 0, Reassigned: 0 };
      if (!dateMap[dateKey]) dateMap[dateKey] = { Completed: 0, Reassigned: 0 };

      if (progress_status === "completed") {
        perf.completed++;

        const due = new Date(due_date);
        if (completeDate <= due) {
          perf.onTime++;
        }

        dateMap[dateKey].Completed++;
        monthMap[monthKey].Completed++;
      }

      if (reassign_history.length > 0) {
        const count = reassign_history.length;
        perf.reassigned += count;
        dateMap[dateKey].Reassigned += count;
        monthMap[monthKey].Reassigned += count;
      }
    });

    const completionRate = (perf.completed / perf.total) * 100 || 0;
    const onTimeRate =
      perf.completed > 0 ? (perf.onTime / perf.completed) * 100 : 0;

    const team = groupedEmployees.find((g) =>
      g.members.some((m: any) => m.id === selectedEmployee.id)
    );

    const peerMembers =
      team?.members?.filter((m: any) => m.id !== selectedEmployee.id) || [];
    const peerTasks = tasks.filter((t) =>
      peerMembers.some((m: any) => m.id === t.assigned_to)
    );

    const avgWorkload =
      peerMembers.length > 0 ? peerTasks.length / peerMembers.length : 0;

    // Calculate review score
    const empReviews = empTasks
      .map((t) => t.reviewpoints)
      .filter((p) => typeof p === "number");

    const avgReviewScore =
      empReviews.length > 0
        ? empReviews.reduce((a, b) => a + b, 0) / empReviews.length
        : 0;

    // Calculate productivity score
    const empProductivity = empTasks
      .map((task) => {
        const assignedAt = task.created_at?.toDate?.();
        const dueAt = new Date(task.due_date);
        const completedAt = task.progress_updated_at?.toDate?.();

        if (!assignedAt || !dueAt || !completedAt) return null;

        const totalTime = dueAt.getTime() - assignedAt.getTime();
        const timeLeft = dueAt.getTime() - completedAt.getTime();
        const timeOverdue = completedAt.getTime() - dueAt.getTime();

        if (completedAt <= dueAt) {
          const leftRatio = timeLeft / totalTime;
          if (leftRatio >= 0.5) return 100;
          if (leftRatio >= 0 && leftRatio < 0.1) return 70;
          return 60;
        } else {
          const overdueRatio = timeOverdue / totalTime;
          if (overdueRatio <= 0.1) return 50;
          if (overdueRatio <= 0.5) return 30;
          return 10;
        }
      })
      .filter((s) => s !== null);

    const avgProductivityScore =
      empProductivity.length > 0
        ? empProductivity.reduce((a: any, b: any) => a + b, 0) / empProductivity.length
        : 0;

    // Fetch HR feedback and calculate final score
    const fetchHRFeedbackAndCalculate = async () => {
      const empId = selectedEmployee.id;
      const today = new Date();
      const dateKey = today.toISOString().split("T")[0];
      const feedbackDocId = `${empId}_${dateKey}`;

      let hrFeedbackScore = 0;

      try {
        if (!usingOfflineMode) {
          const hrDocRef = doc(db, "HR_feedback", feedbackDocId);
          const hrDocSnap = await getDoc(hrDocRef);
          if (hrDocSnap.exists()) {
            const data = hrDocSnap.data();
            if (typeof data.score === "number") {
              hrFeedbackScore = data.score;
            }
          }
        } else {
          // Mock HR feedback for offline mode
          hrFeedbackScore = 85;
        }
      } catch (error) {
        console.error("Failed to fetch HR feedback:", error);
        hrFeedbackScore = 75; // Default value
      }

      const hrWeighted = hrFeedbackScore * 0.1;

      const totalPerformanceScore = Math.max(
        +(
          avgProductivityScore * 0.2 +
          completionRate * 0.25 +
          onTimeRate * 0.25 +
          avgReviewScore * 0.2 +
          hrWeighted
        ).toFixed(2),
        0
      );

      setPerformanceData({
        ...perf,
        completionRate,
        onTimeRate,
        workloadComparison: {
          employee: perf.total,
          average: avgWorkload.toFixed(1),
        },
        reviewScore: avgReviewScore.toFixed(1),
        productivityScore: avgProductivityScore.toFixed(1),
        hrFeedbackScore: hrFeedbackScore.toFixed(1),
        totalPerformanceScore,
      });

      const dateData = Object.entries(dateMap).map(([date, val]) => ({
        date,
        ...val,
      }));

      const monthData = Object.entries(monthMap).map(([month, val]) => ({
        month,
        ...val,
      }));

      setDateChartData(dateData);
      setMonthChartData(monthData);
    };

    fetchHRFeedbackAndCalculate();
  }, [selectedEmployee, tasks, groupedEmployees, usingOfflineMode]);

  const handleRefresh = async () => {
    setLoading(true);
    // Re-trigger the useEffect by updating a dependency
    const currentTime = Date.now();
    // Force re-fetch by temporarily clearing the user and setting it back
    setTimeout(() => {
      setLoading(false);
      window.location.reload(); // Simple refresh for now
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 dark:from-indigo-950 dark:via-purple-950 dark:to-indigo-950 flex items-center justify-center">
        <motion.div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 border-4 border-purple-500 dark:border-purple-400 border-t-transparent rounded-full mx-auto mb-4"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-2">
              Loading Performance Data
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Analyzing your productivity metrics...
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (noTeam && !usingOfflineMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 dark:from-indigo-950 dark:via-purple-950 dark:to-indigo-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-purple-200/50 dark:border-purple-800/50 shadow-xl"
        >
          <Users className="h-16 w-16 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold">
            You are not assigned to any team yet.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Please contact your administrator to be added to a team.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 dark:from-indigo-950 dark:via-purple-950 dark:to-indigo-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-6">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 shadow-xl"
            >
              <BarChart3 className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mb-2">
                Employee Performance Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Comprehensive performance analytics and insights
                {usingOfflineMode && (
                  <span className="ml-3 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
                    📴 Offline Mode
                  </span>
                )}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            title={usingOfflineMode ? "Try to reconnect" : "Refresh data"}
          >
            <RefreshCw className="h-5 w-5" />
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Employee Info Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-purple-200/50 dark:border-purple-800/50 p-6 shadow-xl h-fit"
          >
            <h2 className="text-lg font-bold text-purple-600 dark:text-purple-400 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Your Profile
            </h2>
            {selectedEmployee ? (
              <div className="p-4 border border-purple-200 dark:border-purple-700 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-lg font-semibold shadow-lg">
                    {selectedEmployee.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                      {selectedEmployee.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedEmployee.department || 'Engineering'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                  📊 Viewing your personal performance metrics
                </p>
              </div>
            ) : (
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading your profile...</p>
              </div>
            )}
          </motion.div>

          {/* Main Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3 space-y-6"
          >
            {selectedEmployee && (
              <>
                {/* Employee Header */}
                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-purple-200/50 dark:border-purple-800/50 p-6 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        {selectedEmployee.name}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                        <Briefcase className="h-4 w-4 mr-1" />
                        {selectedEmployee.department || 'Engineering'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Trophy className="h-6 w-6 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Performance Rating
                      </span>
                    </div>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <SummaryCard
                    label="Tasks Assigned"
                    value={performanceData.total || 0}
                    color="blue"
                    icon={Target}
                    tooltip="Total number of tasks assigned to this employee."
                  />
                  <SummaryCard
                    label="Tasks Completed"
                    value={performanceData.completed || 0}
                    color="green"
                    icon={CheckCircle}
                    tooltip="Total tasks marked as completed by the employee."
                  />
                  <SummaryCard
                    label="Reassigned"
                    value={performanceData.reassigned || 0}
                    color="yellow"
                    icon={ArrowRight}
                    tooltip="Total times tasks were reassigned from or to this employee."
                  />
                  <SummaryCard
                    label="On-Time"
                    value={`${performanceData.onTime || 0} (${performanceData.onTimeRate?.toFixed(1) || '0.0'}%)`}
                    color="blue"
                    icon={Clock}
                    tooltip="Number and percentage of tasks completed before or on the due date."
                  />
                  <CustomTooltip performanceData={performanceData}>
                    <SummaryCard
                      label="Total Performance Score"
                      value={`${performanceData.totalPerformanceScore || 0}%`}
                      color="purple"
                      icon={Award}
                    />
                  </CustomTooltip>
                </div>

                {/* Completion Rate Progress */}
                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-purple-200/50 dark:border-purple-800/50 p-6 shadow-xl">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                    Completion Rate Analysis
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Overall Completion Rate
                        </span>
                        <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          {performanceData.completionRate?.toFixed(1) || '0.0'}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${performanceData.completionRate || 0}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-4 rounded-full shadow-lg relative overflow-hidden"
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{ 
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 1,
                              ease: "linear"
                            }}
                          />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Month-wise Chart */}
                  <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-purple-200/50 dark:border-purple-800/50 p-6 shadow-xl">
                    <h3 className="font-semibold text-lg mb-4 flex items-center text-gray-800 dark:text-gray-200">
                      <CalendarIcon className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                      Month-wise Task Summary
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #e0e7ff',
                            borderRadius: '12px',
                          }}
                        />
                        <Legend />
                        <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Reassigned" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Date-wise Chart */}
                  <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-purple-200/50 dark:border-purple-800/50 p-6 shadow-xl">
                    <h3 className="font-semibold text-lg mb-4 flex items-center text-gray-800 dark:text-gray-200">
                      <Activity className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                      Date-wise Performance
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dateChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #e0e7ff',
                            borderRadius: '12px',
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="Completed" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="Reassigned" 
                          stroke="#f59e0b" 
                          strokeWidth={3}
                          dot={{ fill: '#f59e0b', strokeWidth: 2, r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Task Details Table */}
                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-purple-200/50 dark:border-purple-800/50 p-6 shadow-xl">
                  <h3 className="font-semibold text-lg mb-4 flex items-center text-gray-800 dark:text-gray-200">
                    <Flag className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                    Detailed Task Information
                  </h3>
                  <div className="overflow-x-auto max-h-[400px] border border-purple-200 dark:border-purple-700 rounded-xl shadow-inner">
                    <table className="min-w-full divide-y divide-purple-200 dark:divide-purple-700 text-sm">
                      <thead className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                            Task ID
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                            Title
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                            Due Date
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                            Review Score
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                            Reassigned
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-100 dark:divide-purple-800 bg-white dark:bg-gray-900">
                        {tasks
                          .filter((t) => t.assigned_to === selectedEmployee.id)
                          .map((task, index) => (
                            <motion.tr
                              key={task.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                            >
                              <td className="px-4 py-3 font-medium text-purple-600 dark:text-purple-400">
                                {task.id.slice(-6)}
                              </td>
                              <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                                <div className="font-medium">{task.title}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                  {task.description}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  task.progress_status === 'completed' 
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : task.progress_status === 'in_progress'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                                }`}>
                                  {task.progress_status || 'pending'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  (task.reviewpoints || 0) >= 80 
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : (task.reviewpoints || 0) >= 60
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                  {task.reviewpoints || 'N/A'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-gray-600 dark:text-gray-400">
                                  {task.reassign_history?.length || 0}
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
