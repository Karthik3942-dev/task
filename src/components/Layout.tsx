import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Briefcase,
  CheckSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon,
  Search,
  Bell,
  Plus,
  Star,
  MoreHorizontal,
  ChevronRight,
  Folder,
  FileText,
  UserPlus,
  Shield,
  BarChart3,
  Clock,
  Filter,
  ArrowUpDown,
  Grid3X3,
  TrendingUp,
  Target,
  Activity,
  Zap,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import FirebaseConnectionStatus from "./FirebaseConnectionStatus";
import { NetworkStatus, ErrorBoundary } from "./NetworkStatus";

function Layout() {
  const { signOut, user } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>("employee"); // Default to employee
  const [isManager, setIsManager] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    dashboard: true,
    projects: false,
    tickets: false,
    administration: false,
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Check if user is team leader
  useEffect(() => {
    const checkTeamLeader = async () => {
      if (!user?.uid) {
        setIsManager(false);
        return;
      }

      try {
        const docRef = doc(db, "teamLeaders", user.uid);
        const docSnap = await getDoc(docRef);
        const isTeamLeader = docSnap.exists();
        setIsManager(isTeamLeader);
        setUserRole(isTeamLeader ? "manager" : "employee");
      } catch (err) {
        console.error("Failed to check teamLeader role:", err);
        setIsManager(false);
        setUserRole("employee");
      }
    };

    checkTeamLeader();
  }, [user?.uid]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  const isActive = (path: string) => location.pathname === path;
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev],
    }));
  };

  return (
    <div className="min-h-screen h-screen bg-gray-50 dark:bg-black flex overflow-hidden">
      <FirebaseConnectionStatus />

      {/* Responsive Sidebar */}
      <div
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-[240px] sm:w-[200px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out flex flex-col shadow-xl md:shadow-none`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-sm font-bold text-white">T</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                TAS ENKONIX
              </span>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Project Management
              </div>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <nav className="space-y-1">
            {/* Dashboard Section */}
            <div>
              <button
                onClick={() => toggleSection("dashboard")}
                className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <Grid3X3 className="w-3 h-3 text-cyan-500" />
                  <span>Dashboard</span>
                </div>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    expandedSections.dashboard ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </button>
              {expandedSections.dashboard && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ml-5 mt-0.5 space-y-0.5"
                >
                  <Link
                    to="/"
                    onClick={closeSidebar}
                    className={`flex items-center gap-2 px-2 py-1 text-xs rounded-md transition-all duration-200 ${
                      isActive("/")
                        ? "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-medium border border-cyan-200 dark:border-cyan-800"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-300"
                    }`}
                  >
                    <LayoutDashboard className="w-3 h-3" />
                    Overview
                  </Link>
                  <Link
                    to="/Performance"
                    onClick={closeSidebar}
                    className={`flex items-center gap-2 px-2 py-1 text-xs rounded-md transition-all duration-200 ${
                      isActive("/Performance")
                        ? "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-medium border border-cyan-200 dark:border-cyan-800"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-300"
                    }`}
                  >
                    <TrendingUp className="w-3 h-3" />
                    Performance
                  </Link>
                  <Link
                    to="/mytasks"
                    onClick={closeSidebar}
                    className={`flex items-center gap-2 px-2 py-1 text-xs rounded-md transition-all duration-200 ${
                      isActive("/mytasks")
                        ? "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-medium border border-cyan-200 dark:border-cyan-800"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-300"
                    }`}
                  >
                    <CheckSquare className="w-3 h-3" />
                    My Tasks
                  </Link>
                  <Link
                    to="/calendar"
                    onClick={closeSidebar}
                    className={`flex items-center gap-2 px-2 py-1 text-xs rounded-md transition-all duration-200 ${
                      isActive("/calendar")
                        ? "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-medium border border-cyan-200 dark:border-cyan-800"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-300"
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    Calendar
                  </Link>
                  <Link
                    to="/ProjectDocCreator"
                    onClick={closeSidebar}
                    className={`flex items-center gap-2 px-2 py-1 text-xs rounded-md transition-all duration-200 ${
                      isActive("/ProjectDocCreator")
                        ? "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-medium border border-cyan-200 dark:border-cyan-800"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-300"
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    Document Creator
                  </Link>
                </motion.div>
              )}
            </div>

            {/* Projects Section */}
            <div>
              <button
                onClick={() => toggleSection("projects")}
                className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3 h-3 text-cyan-500" />
                  <span>Projects</span>
                </div>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    expandedSections.projects ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </button>
              {expandedSections.projects && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ml-5 mt-0.5 space-y-0.5"
                >
                  <Link
                    to="/projects"
                    onClick={closeSidebar}
                    className={`flex items-center gap-2 px-2 py-1 text-xs rounded-md transition-all duration-200 ${
                      isActive("/projects")
                        ? "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-medium border border-cyan-200 dark:border-cyan-800"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-300"
                    }`}
                  >
                    <Briefcase className="w-3 h-3" />
                    Projects
                  </Link>
                  <Link
                    to="/RaiseProjectTicket"
                    onClick={closeSidebar}
                    className={`flex items-center gap-2 px-2 py-1 text-xs rounded-md transition-all duration-200 ${
                      isActive("/RaiseProjectTicket")
                        ? "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-medium border border-cyan-200 dark:border-cyan-800"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-300"
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    View Project Tickets
                  </Link>
                </motion.div>
              )}
            </div>

            {/* Teams Section - Only show for team leaders */}
            {isManager && (
              <div>
                <button
                  onClick={() => toggleSection("tickets")}
                  className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-cyan-500" />
                    <span>Teams</span>
                  </div>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${
                      expandedSections.tickets ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </button>
                {expandedSections.tickets && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-5 mt-0.5 space-y-0.5"
                  >
                    <Link
                      to="/TeamManager"
                      onClick={closeSidebar}
                      className={`flex items-center gap-2 px-2 py-1 text-xs rounded-md transition-all duration-200 ${
                        isActive("/TeamManager")
                          ? "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-medium border border-cyan-200 dark:border-cyan-800"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-300"
                      }`}
                    >
                      <Users className="w-3 h-3" />
                      Manage Team
                    </Link>
                    <Link
                      to="/TeamMatrix"
                      onClick={closeSidebar}
                      className={`flex items-center gap-2 px-2 py-1 text-xs rounded-md transition-all duration-200 ${
                        isActive("/TeamMatrix")
                          ? "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-medium border border-cyan-200 dark:border-cyan-800"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-300"
                      }`}
                    >
                      <BarChart3 className="w-3 h-3" />
                      Team Performance
                    </Link>
                    <Link
                      to="/tasks"
                      onClick={closeSidebar}
                      className={`flex items-center gap-2 px-2 py-1 text-xs rounded-md transition-all duration-200 ${
                        isActive("/tasks")
                          ? "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-medium border border-cyan-200 dark:border-cyan-800"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-300"
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      Create Tasks
                    </Link>
                    <Link
                      to="/ViewTasks"
                      onClick={closeSidebar}
                      className={`flex items-center gap-2 px-2 py-1 text-xs rounded-md transition-all duration-200 ${
                        isActive("/ViewTasks")
                          ? "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-medium border border-cyan-200 dark:border-cyan-800"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-300"
                      }`}
                    >
                      <CheckSquare className="w-3 h-3" />
                      All Tasks
                    </Link>
                  </motion.div>
                )}
              </div>
            )}

            {/* Administration Section */}
            <div>
              <button
                onClick={() => toggleSection("administration")}
                className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3 text-cyan-500" />
                  <span>Administration</span>
                </div>
                <ChevronRight
                  className={`w-3 h-3 transition-transform duration-200 ${
                    expandedSections.administration ? "rotate-90" : "rotate-0"
                  }`}
                />
              </button>
              {expandedSections.administration && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ml-5 mt-0.5 space-y-0.5"
                >
                  <Link
                    to="/users"
                    onClick={closeSidebar}
                    className={`flex items-center gap-2 px-2 py-1 text-xs rounded-md transition-all duration-200 ${
                      isActive("/users")
                        ? "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-medium border border-cyan-200 dark:border-cyan-800"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-300"
                    }`}
                  >
                    <UserPlus className="w-3 h-3" />
                    User Management
                  </Link>
                  <Link
                    to="/settings"
                    onClick={closeSidebar}
                    className={`flex items-center gap-2 px-2 py-1 text-xs rounded-md transition-all duration-200 ${
                      isActive("/settings")
                        ? "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-medium border border-cyan-200 dark:border-cyan-800"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-300"
                    }`}
                  >
                    <Settings className="w-3 h-3" />
                    Settings
                  </Link>
                </motion.div>
              )}
            </div>
          </nav>
        </div>

        {/* User Profile */}
        <div className="border-t border-gray-200 dark:border-gray-800 px-2 py-2">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-md px-2 py-2">
            <div className="w-6 h-6 bg-cyan-500 rounded-md flex items-center justify-center text-white text-xs font-semibold">
              {user?.email?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                {user?.email?.split("@")[0] || "Admin"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </p>
            </div>
            <button
              onClick={signOut}
              className="p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200"
              title="Sign Out"
            >
              <LogOut className="w-3 h-3 text-red-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Responsive Top Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 sm:px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">
                  Project Board
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full whitespace-nowrap">
                  On track
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {isManager && (
                <Link
                  to="/TeamManager"
                  className="hidden sm:inline-flex px-3 py-1.5 text-xs bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors"
                >
                  Teams
                </Link>
              )}

              {/* User Avatar - Mobile */}
              <div className="sm:hidden w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                {user?.email?.charAt(0).toUpperCase() || "A"}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Responsive Page Content */}
        <main className="flex-1 flex flex-col min-h-0 bg-gray-50 dark:bg-black overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex-1 min-h-0 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
            >
              <div className="min-h-full">
                <Outlet />
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default Layout;
