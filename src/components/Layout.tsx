import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
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

function Layout() {
  const { signOut, user } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    dashboard: true,
    projects: false,
    tickets: false,
    administration: false,
  });

  useEffect(() => {
    // Apply theme from store
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!event.target) return;
      const target = event.target as Element;

      if (filterOpen && !target.closest(".filter-dropdown")) {
        setFilterOpen(false);
      }
      if (sortOpen && !target.closest(".sort-dropdown")) {
        setSortOpen(false);
      }
      if (workspaceOpen && !target.closest(".workspace-dropdown")) {
        setWorkspaceOpen(false);
      }
      if (projectOpen && !target.closest(".project-dropdown")) {
        setProjectOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterOpen, sortOpen, workspaceOpen, projectOpen]);

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
    <div className="min-h-screen h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 dark:from-indigo-950 dark:via-purple-950 dark:to-indigo-950 flex overflow-hidden">
      <FirebaseConnectionStatus />

      {/* Modern Sidebar */}
      <div
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-[240px] bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl border-r border-purple-200 dark:border-purple-800/50 transition-all duration-300 ease-in-out flex flex-col shadow-2xl`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-purple-200 dark:border-purple-800/50">
          <div className="relative workspace-dropdown">
            <button
              onClick={() => setWorkspaceOpen(!workspaceOpen)}
              className="flex items-center gap-2 hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded-lg px-3 py-2 transition-all duration-200 group"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-500 dark:to-indigo-500 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-base font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                    TAS 
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Workspace
                  </p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
            </button>
            {workspaceOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-xl backdrop-blur-xl z-[9999] p-3 shadow-2xl"
              >
                <div className="space-y-2">
                  <div className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Workspaces
                  </div>
                  <button
                    onClick={() => setWorkspaceOpen(false)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded-lg dark:text-gray-300 transition-colors"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Create workspace
                  </button>
                </div>
              </motion.div>
            )}
            
          </div>
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800/30 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-3 custom-scrollbar">
          <nav className="space-y-2">
            {/* Dashboard Section */}
            <div>
              <button
                onClick={() => toggleSection("dashboard")}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded-lg transition-all duration-200 group"
              >
                <div className="flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-medium">Dashboard</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    expandedSections.dashboard ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </button>
              {expandedSections.dashboard && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ml-6 mt-1 space-y-1"
                >
                  <Link
                    to="/"
                    onClick={closeSidebar}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                      isActive("/")
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform scale-[1.02]"
                        : "text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-800/30 hover:text-purple-600 dark:hover:text-purple-400"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Overview
                  </Link>
                  <Link
                    to="/Performance"
                    onClick={closeSidebar}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                      isActive("/Performance")
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform scale-[1.02]"
                        : "text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-800/30 hover:text-purple-600 dark:hover:text-purple-400"
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Performance
                  </Link>
                  <Link
                    to="/mytasks"
                    onClick={closeSidebar}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                      isActive("/mytasks")
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform scale-[1.02]"
                        : "text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-800/30 hover:text-purple-600 dark:hover:text-purple-400"
                    }`}
                  >
                    <CheckSquare className="w-4 h-4" />
                    My Tasks
                  </Link>
                  <Link
                    to="/calendar"
                    onClick={closeSidebar}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                      isActive("/calendar")
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform scale-[1.02]"
                        : "text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-800/30 hover:text-purple-600 dark:hover:text-purple-400"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    Calendar
                  </Link>
                </motion.div>
              )}
            </div>

            {/* Projects Section */}
            <div>
              <button
                onClick={() => toggleSection("projects")}
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded-xl transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-medium">Projects</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    expandedSections.projects ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </button>
              {expandedSections.projects && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ml-6 mt-1 space-y-1"
                >
                  <Link
                    to="/projects"
                    onClick={closeSidebar}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                      isActive("/projects")
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform scale-[1.02]"
                        : "text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-800/30 hover:text-purple-600 dark:hover:text-purple-400"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    All Projects
                  </Link>
                  <Link
                    to="/ProjectDocCreator"
                    onClick={closeSidebar}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                      isActive("/ProjectDocCreator")
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform scale-[1.02]"
                        : "text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-800/30 hover:text-purple-600 dark:hover:text-purple-400"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Document Creator
                  </Link>
                </motion.div>
              )}
            </div>

            {/* Team Management Section */}
            <div>
              <button
                onClick={() => toggleSection("tickets")}
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded-xl transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-medium">Team Management</span>
                </div>
                <ChevronRight
                  className={`w-4 h-4 transition-transform duration-200 ${
                    expandedSections.tickets ? "rotate-90" : "rotate-0"
                  }`}
                />
              </button>
              {expandedSections.tickets && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ml-6 mt-1 space-y-1"
                >
                  <Link
                    to="/TeamManager"
                    onClick={closeSidebar}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                      isActive("/TeamManager")
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform scale-[1.02]"
                        : "text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-800/30 hover:text-purple-600 dark:hover:text-purple-400"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Manage Team
                  </Link>
                  <Link
                    to="/TeamMatrix"
                    onClick={closeSidebar}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                      isActive("/TeamMatrix")
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform scale-[1.02]"
                        : "text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-800/30 hover:text-purple-600 dark:hover:text-purple-400"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Team Performance
                  </Link>
                  <Link
                    to="/tasks"
                    onClick={closeSidebar}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                      isActive("/tasks")
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform scale-[1.02]"
                        : "text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-800/30 hover:text-purple-600 dark:hover:text-purple-400"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    Create Tasks
                  </Link>
                  <Link
                    to="/ViewTasks"
                    onClick={closeSidebar}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                      isActive("/ViewTasks")
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform scale-[1.02]"
                        : "text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-800/30 hover:text-purple-600 dark:hover:text-purple-400"
                    }`}
                  >
                    <CheckSquare className="w-4 h-4" />
                    View Tasks
                  </Link>
                </motion.div>
              )}
            </div>

            {/* Administration Section */}
            <div>
              <button
                onClick={() => toggleSection("administration")}
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded-xl transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-medium">Administration</span>
                </div>
                <ChevronRight
                  className={`w-4 h-4 transition-transform duration-200 ${
                    expandedSections.administration ? "rotate-90" : "rotate-0"
                  }`}
                />
              </button>
              {expandedSections.administration && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ml-6 mt-1 space-y-1"
                >
                  <Link
                    to="/users"
                    onClick={closeSidebar}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                      isActive("/users")
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform scale-[1.02]"
                        : "text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-800/30 hover:text-purple-600 dark:hover:text-purple-400"
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    User Management
                  </Link>
                  <Link
                    to="/settings"
                    onClick={closeSidebar}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                      isActive("/settings")
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform scale-[1.02]"
                        : "text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-800/30 hover:text-purple-600 dark:hover:text-purple-400"
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </motion.div>
              )}
            </div>
          </nav>
        </div>

        {/* User Profile */}
        <div className="border-t border-purple-200 dark:border-purple-800/50 px-4 py-4">
          <div className="flex items-center gap-3 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/50 dark:to-indigo-900/50 rounded-xl px-4 py-3 shadow-sm border border-purple-200 dark:border-purple-700/50">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-lg">
              {user?.email?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {user?.email?.split("@")[0] || "Admin"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                Project Manager
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={signOut}
              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 border border-red-200 dark:border-red-500/30 bg-white/80 dark:bg-red-900/20"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Modern Top Header */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-purple-200 dark:border-purple-800/50 px-4 py-3 shadow-lg relative z-dropdown">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800/30 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="relative project-dropdown z-dropdown">
                <button
                  onClick={() => setProjectOpen(!projectOpen)}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded-lg px-2 py-1.5 transition-all duration-200 hover:shadow-sm relative z-dropdown"
                >
                  <span className="font-medium">Project Board</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {projectOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-xl shadow-2xl z-max p-3"
                  >
                    <div className="space-y-2">
                      <div className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Recent Projects
                      </div>
                      <Link
                        to="/mytasks"
                        onClick={() => setProjectOpen(false)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded-lg dark:text-gray-300 block transition-colors"
                      >
                        📋 My Tasks Kanban
                      </Link>
                      <Link
                        to="/projects"
                        onClick={() => setProjectOpen(false)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded-lg dark:text-gray-300 block transition-colors"
                      >
                        🚀 All Projects
                      </Link>
                      <Link
                        to="/ViewTasks"
                        onClick={() => setProjectOpen(false)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded-lg dark:text-gray-300 block transition-colors"
                      >
                        💼 View Tasks
                      </Link>
                      <hr className="my-2 border-purple-200 dark:border-purple-700" />
                      <Link
                        to="/tasks"
                        onClick={() => setProjectOpen(false)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded-lg text-purple-600 dark:text-purple-400 block transition-colors"
                      >
                        + Create Task
                      </Link>
                    </div>
                  </motion.div>
                )}
              </div>
              <span className="px-3 py-1.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium">
                ✓ On track
              </span>
            </div>

            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/TeamManager"
                  className="px-3 py-1.5 text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 shadow-md transition-all duration-200 hover:shadow-lg font-medium"
                  title="View created teams"
                >
                  Teams
                </Link>
              </motion.div>

              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-800/30 border border-purple-200 dark:border-purple-700 shadow-sm transition-all duration-200 hover:shadow-md"
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </motion.button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 flex flex-col min-h-0 bg-gray-50/50 dark:bg-gray-900/50 m-3 rounded-xl backdrop-blur-sm border border-purple-200/50 dark:border-purple-800/50 shadow-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-1 min-h-0 overflow-auto"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default Layout;
