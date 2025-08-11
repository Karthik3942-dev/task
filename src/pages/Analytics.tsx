import React, { useState, useEffect } from "react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db, isFirebaseConnected } from "../lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  CheckCircle,
  Filter,
  Download,
  Search,
  ChevronDown,
  BarChart3,
  AlertCircle,
  Clock,
  Target,
  Zap,
  Star,
  Calendar,
  Eye,
  FileText,
  ArrowRight,
  User,
  Award,
  Timer,
  RefreshCw,
} from "lucide-react";

const Analytics = () => {
  const [data, setData] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [selectedMetric, setSelectedMetric] = useState("overview");
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let retryTimer: NodeJS.Timeout;
    
    const initializeWithRetry = () => {
      try {
        setHasError(false);
        fetchAnalyticsData();
        
        if (connectionStatus === 'offline' && retryCount < 3) {
          retryTimer = setTimeout(() => {
            console.log(`Retrying Analytics connection (attempt ${retryCount + 1})`);
            setRetryCount(prev => prev + 1);
            initializeWithRetry();
          }, 5000 * (retryCount + 1));
        }
      } catch (error) {
        console.error("Analytics initialization error:", error);
        setHasError(true);
        setConnectionStatus('offline');
        setLoading(false);
      }
    };

    initializeWithRetry();
    
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [retryCount]);

  const fetchAnalyticsData = async () => {
    if (!db) {
      console.warn("Firebase not available for Analytics");
      setConnectionStatus('offline');
      setLoading(false);
      return;
    }

    setConnectionStatus('connecting');
    
    try {
      const [projectsSnapshot, tasksSnapshot, usersSnapshot] = await Promise.all([
        getDocs(collection(db, "projects")).catch(() => ({ docs: [] })),
        getDocs(collection(db, "tasks")).catch(() => ({ docs: [] })),
        getDocs(collection(db, "users")).catch(() => ({ docs: [] })),
      ]);

      const projectsData = projectsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const tasksData = tasksSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const usersData = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setProjects(projectsData);
      setTasks(tasksData);
      setUsers(usersData);
      setConnectionStatus('connected');
      
      // Generate analytics data
      generateAnalyticsData(projectsData, tasksData, usersData);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      setConnectionStatus('offline');
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  const generateAnalyticsData = (projectsData: any[], tasksData: any[], usersData: any[]) => {
    // Generate mock analytics data based on actual data
    const weeklyData = [
      { name: "Mon", projects: projectsData.length * 0.1, tasks: tasksData.length * 0.15, users: usersData.length * 0.05 },
      { name: "Tue", projects: projectsData.length * 0.12, tasks: tasksData.length * 0.18, users: usersData.length * 0.08 },
      { name: "Wed", projects: projectsData.length * 0.15, tasks: tasksData.length * 0.22, users: usersData.length * 0.12 },
      { name: "Thu", projects: projectsData.length * 0.18, tasks: tasksData.length * 0.25, users: usersData.length * 0.15 },
      { name: "Fri", projects: projectsData.length * 0.20, tasks: tasksData.length * 0.28, users: usersData.length * 0.18 },
      { name: "Sat", projects: projectsData.length * 0.08, tasks: tasksData.length * 0.10, users: usersData.length * 0.03 },
      { name: "Sun", projects: projectsData.length * 0.05, tasks: tasksData.length * 0.08, users: usersData.length * 0.02 },
    ];
    
    setData(weeklyData);
  };

  const handleRefresh = () => {
    setHasError(false);
    setRetryCount(0);
    setLoading(true);
    fetchAnalyticsData();
  };

  // Calculate key metrics
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const activeProjects = projects.filter(project => project.status === 'active').length;
  const totalUsers = users.length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Error boundary fallback
  if (hasError && connectionStatus === 'offline') {
    return (
      <div className="h-full bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-violet-900/10 dark:to-indigo-900/5 flex items-center justify-center">
        <div className="text-center p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl shadow-lg max-w-md">
          <div className="p-4 bg-orange-100 dark:bg-orange-500/20 rounded-xl mb-4 inline-block">
            <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Analytics Unavailable</h3>
          <p className="text-sm text-violet-600/70 dark:text-violet-300/70 mb-4">
            Unable to load analytics data. Please check your connection.
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-lg text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-violet-900/10 dark:to-indigo-900/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-violet-600 dark:text-violet-400 font-medium">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-violet-900/10 dark:to-indigo-900/5 flex flex-col relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-violet-200/20 to-purple-200/20 dark:from-violet-900/10 dark:to-purple-900/10 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br from-indigo-200/20 to-violet-200/20 dark:from-indigo-900/10 dark:to-violet-900/10 rounded-full blur-3xl opacity-60"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-violet-200/50 dark:border-violet-500/20 px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Analytics
                </h1>
                <p className="text-xs text-violet-600/70 dark:text-violet-300/70 font-medium">
                  Performance insights
                </p>
              </div>
            </div>
            
            <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-sm flex items-center gap-2 ${
              connectionStatus === 'connected'
                ? 'bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/30'
                : connectionStatus === 'connecting'
                ? 'bg-amber-50/80 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-500/30'
                : 'bg-gray-50/80 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200/60 dark:border-gray-500/30'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-emerald-500' :
                connectionStatus === 'connecting' ? 'bg-amber-500 animate-pulse' :
                'bg-gray-500'
              }`}></div>
              {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Loading' : 'Offline'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 bg-white/70 dark:bg-slate-800/70 text-violet-600 dark:text-violet-300 hover:bg-violet-100/70 dark:hover:bg-violet-700/40 border border-violet-200/60 dark:border-violet-500/30 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-sm backdrop-blur-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button className="p-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-sm">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-3">
          {['day', 'week', 'month', 'quarter'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                selectedPeriod === period
                  ? 'bg-violet-100/60 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-500/30'
                  : 'text-violet-600/70 dark:text-violet-300/70 hover:bg-violet-50/60 dark:hover:bg-violet-500/5'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-auto px-6 py-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              title: "Active Projects",
              value: activeProjects,
              icon: Target,
              color: "violet",
              change: "+12%",
              changeIcon: TrendingUp
            },
            {
              title: "Completed Tasks",
              value: completedTasks,
              icon: CheckCircle,
              color: "emerald",
              change: "+8%",
              changeIcon: TrendingUp
            },
            {
              title: "Team Members",
              value: totalUsers,
              icon: Users,
              color: "blue",
              change: "+3%",
              changeIcon: TrendingUp
            },
            {
              title: "Completion Rate",
              value: `${completionRate}%`,
              icon: Award,
              color: "amber",
              change: "+5%",
              changeIcon: TrendingUp
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl p-4 shadow-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 bg-gradient-to-br from-${stat.color}-500 to-${stat.color}-600 rounded-xl shadow-md`}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 bg-${stat.color}-50/80 dark:bg-${stat.color}-500/10 rounded-lg`}>
                  <stat.changeIcon className={`w-3 h-3 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  <span className={`text-xs font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-xs font-medium text-violet-600/70 dark:text-violet-300/70 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Weekly Activity Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Weekly Activity</h3>
                <p className="text-sm text-violet-600/70 dark:text-violet-300/70">Task completion trends</p>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      borderRadius: '12px',
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tasks"
                    stroke="#8b5cf6"
                    fill="url(#gradient)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Project Status Distribution */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Project Status</h3>
                <p className="text-sm text-violet-600/70 dark:text-violet-300/70">Current distribution</p>
              </div>
            </div>
            
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Active', value: activeProjects, fill: '#8b5cf6' },
                      { name: 'Completed', value: projects.filter(p => p.status === 'completed').length, fill: '#10b981' },
                      { name: 'On Hold', value: projects.filter(p => p.status === 'on-hold').length, fill: '#f59e0b' },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
