import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
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

const SummaryCard = ({ label, value, color = "cyan", icon: Icon }: any) => {
  const colorClasses = {
    cyan: "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
    green: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
    orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    red: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  };

  const iconClasses = {
    cyan: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400",
    green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
    red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  };

  return (
    <div className={`border rounded-lg p-4 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-200 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
        {Icon && (
          <div className={`p-2 rounded-md ${iconClasses[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
};

export default function EmployeePerformancePage() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<any>({});
  const [monthChartData, setMonthChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.uid) {
          setLoading(false);
          return;
        }

        // Fetch employees
        const empSnap = await getDocs(collection(db, "employees"));
        const allEmployees = empSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch tasks assigned to current user
        const tasksQuery = query(
          collection(db, "tasks"),
          where("assigned_to", "==", user.uid)
        );
        const taskSnap = await getDocs(tasksQuery);
        const tasksData = taskSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setEmployees(allEmployees);
        setTasks(tasksData);
        
        // Find current user in employees
        const loggedInEmployee = allEmployees.find(
          (emp) => emp.id === user.uid
        );
        setSelectedEmployee(loggedInEmployee || {
          id: user.uid,
          name: user.email?.split('@')[0] || "Current User",
          department: "N/A",
          email: user.email || "",
        });
        
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load performance data");
        
        // Set empty state on error
        setTasks([]);
        setEmployees([]);
        setSelectedEmployee({
          id: user?.uid || "",
          name: user?.email?.split('@')[0] || "Current User",
          department: "N/A",
          email: user?.email || "",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (selectedEmployee && tasks.length >= 0) {
      calculatePerformanceMetrics();
    }
  }, [selectedEmployee, tasks]);

  const calculatePerformanceMetrics = () => {
    const employeeTasks = tasks.filter(task => task.assigned_to === selectedEmployee.id);
    
    const totalTasks = employeeTasks.length;
    const completedTasks = employeeTasks.filter(task => task.progress_status === "completed").length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const onTimeTasks = employeeTasks.filter(task => {
      if (task.progress_status !== "completed" || !task.due_date || !task.progress_updated_at) return false;
      const dueDate = new Date(task.due_date);
      const completedDate = task.progress_updated_at.toDate ? task.progress_updated_at.toDate() : new Date(task.progress_updated_at);
      return completedDate <= dueDate;
    }).length;
    
    const onTimeRate = completedTasks > 0 ? (onTimeTasks / completedTasks) * 100 : 0;
    
    // Calculate review scores only from real data
    const reviewScores = employeeTasks
      .filter(task => task.reviewpoints && task.reviewpoints > 0)
      .map(task => task.reviewpoints);
    const avgReviewScore = reviewScores.length > 0 ? 
      reviewScores.reduce((sum, score) => sum + score, 0) / reviewScores.length : 0;
    
    // Calculate productivity based on real task completion timing
    const productivityScore = calculateProductivityScore(employeeTasks);
    
    // Get HR feedback for current user (real data only)
    const hrFeedbackScore = 0; // Will be updated with real HR feedback if available
    
    const totalPerformanceScore = Math.round(
      (completionRate * 0.3) + 
      (onTimeRate * 0.25) + 
      (avgReviewScore * 0.25) + 
      (productivityScore * 0.1) + 
      (hrFeedbackScore * 0.1)
    );

    setPerformanceData({
      totalTasks,
      completedTasks,
      completionRate,
      onTimeRate,
      productivityScore,
      reviewScore: avgReviewScore,
      hrFeedbackScore,
      totalPerformanceScore,
    });

    // Generate chart data based on real task completion dates
    const chartData = generateMonthlyChartData(employeeTasks);
    setMonthChartData(chartData);
  };

  const calculateProductivityScore = (tasks: any[]) => {
    if (tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(task => 
      task.progress_status === "completed" && 
      task.created_at && 
      task.progress_updated_at && 
      task.due_date
    );
    
    if (completedTasks.length === 0) return 0;
    
    const scores = completedTasks.map(task => {
      const createdDate = task.created_at.toDate ? task.created_at.toDate() : new Date(task.created_at);
      const completedDate = task.progress_updated_at.toDate ? task.progress_updated_at.toDate() : new Date(task.progress_updated_at);
      const dueDate = new Date(task.due_date);
      
      const totalTime = dueDate.getTime() - createdDate.getTime();
      const timeUsed = completedDate.getTime() - createdDate.getTime();
      
      if (totalTime <= 0) return 50; // Default for invalid dates
      
      if (completedDate <= dueDate) {
        // Completed on time or early
        const efficiency = 1 - (timeUsed / totalTime);
        return Math.min(100, 50 + (efficiency * 50));
      } else {
        // Completed late
        const lateness = (timeUsed - totalTime) / totalTime;
        return Math.max(0, 50 - (lateness * 50));
      }
    });
    
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  };

  const generateMonthlyChartData = (tasks: any[]) => {
    const monthlyData: { [key: string]: number } = {};
    const currentDate = new Date();
    
    // Initialize last 5 months
    for (let i = 4; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      monthlyData[monthKey] = 0;
    }
    
    // Count completed tasks by month
    tasks.forEach(task => {
      if (task.progress_status === "completed" && task.progress_updated_at) {
        const completedDate = task.progress_updated_at.toDate ? task.progress_updated_at.toDate() : new Date(task.progress_updated_at);
        const monthKey = completedDate.toLocaleDateString('en-US', { month: 'short' });
        if (monthlyData.hasOwnProperty(monthKey)) {
          monthlyData[monthKey]++;
        }
      }
    });

    return Object.entries(monthlyData).map(([month, score]) => ({ month, score }));
  };

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center bg-gray-50 dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-cyan-500 mx-auto mb-3"></div>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-md bg-cyan-500">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Performance Dashboard
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Track your productivity and achievements
              </p>
            </div>
          </div>
          <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-xs border border-green-200 dark:border-green-800">
            Real Data
          </span>
        </div>

        {/* Performance Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard
            label="Overall Score"
            value={`${performanceData.totalPerformanceScore || 0}%`}
            color="cyan"
            icon={Trophy}
          />
          <SummaryCard
            label="Tasks Completed"
            value={`${performanceData.completedTasks || 0}/${performanceData.totalTasks || 0}`}
            color="green"
            icon={CheckCircle}
          />
          <SummaryCard
            label="Completion Rate"
            value={`${Math.round(performanceData.completionRate || 0)}%`}
            color="purple"
            icon={Target}
          />
          <SummaryCard
            label="On-Time Delivery"
            value={`${Math.round(performanceData.onTimeRate || 0)}%`}
            color="orange"
            icon={Clock}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Performance Trend Chart */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-cyan-500 rounded-md mr-3">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Monthly Task Completion
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tasks completed per month
                </p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6B7280" 
                    fontSize={12}
                    tick={{ fill: '#6B7280' }}
                  />
                  <YAxis 
                    stroke="#6B7280" 
                    fontSize={12}
                    tick={{ fill: '#6B7280' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#06B6D4" 
                    strokeWidth={2}
                    dot={{ fill: '#06B6D4', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#06B6D4', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Task Status Distribution */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-500 rounded-md mr-3">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Task Status Distribution
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Current task status breakdown
                </p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { status: 'Completed', count: tasks.filter(t => t.progress_status === 'completed').length },
                  { status: 'In Progress', count: tasks.filter(t => t.progress_status === 'in_progress').length },
                  { status: 'Pending', count: tasks.filter(t => t.progress_status === 'pending').length },
                  { status: 'Review', count: tasks.filter(t => t.progress_status === 'review').length },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="status" 
                    stroke="#6B7280" 
                    fontSize={12}
                    tick={{ fill: '#6B7280' }}
                  />
                  <YAxis 
                    stroke="#6B7280" 
                    fontSize={12}
                    tick={{ fill: '#6B7280' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Task Performance */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-purple-500 rounded-md mr-2">
                <CheckCircle className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Task Performance
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Total Tasks:</span>
                <span className="font-medium text-gray-900 dark:text-white">{performanceData.totalTasks || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                <span className="font-medium text-green-600 dark:text-green-400">{performanceData.completedTasks || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Completion Rate:</span>
                <span className="font-medium text-cyan-600 dark:text-cyan-400">{Math.round(performanceData.completionRate || 0)}%</span>
              </div>
            </div>
          </div>

          {/* Quality Metrics */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-orange-500 rounded-md mr-2">
                <Star className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Quality Metrics
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Productivity Score:</span>
                <span className="font-medium text-orange-600 dark:text-orange-400">{Math.round(performanceData.productivityScore || 0)}/100</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">On-Time Delivery:</span>
                <span className="font-medium text-green-600 dark:text-green-400">{Math.round(performanceData.onTimeRate || 0)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Avg Review Score:</span>
                <span className="font-medium text-purple-600 dark:text-purple-400">{Math.round(performanceData.reviewScore || 0)}/100</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-cyan-500 rounded-md mr-2">
                <Activity className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </h3>
            </div>
            <div className="space-y-2">
              {tasks.slice(0, 3).map((task, index) => (
                <div key={task.id} className="text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 dark:text-white truncate flex-1 mr-2">{task.title}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs border ${
                      task.progress_status === 'completed' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' :
                      task.progress_status === 'in_progress' ? 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800' :
                      'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800'
                    }`}>
                      {task.progress_status}
                    </span>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
                  No tasks assigned yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
