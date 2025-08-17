import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useTaskStore, useTaskActions, useTaskData } from "../store/taskStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  ChevronDown,
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  AlertCircle,
  User,
  Flag,
  ExternalLink,
  MessageCircle,
  MoreHorizontal,
  Edit,
  Save,
  X,
  Plus,
  Eye,
  Target,
  Activity,
  Layers,
  ArrowUpDown,
  FileText,
  Link,
  Timer,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { NetworkStatus, ErrorBoundary } from "../components/NetworkStatus";

export default function Tasks() {
  // Global task store
  const { tasks, loading, userMap } = useTaskData();
  const { updateTaskProgress, initializeRealTimeListeners } = useTaskActions();

  // Local state for UI
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [progressFilter, setProgressFilter] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);

  // Initialize real-time task listeners
  useEffect(() => {
    if (!user?.uid) return;

    const cleanup = initializeRealTimeListeners(user.uid);

    return cleanup;
  }, [user?.uid, initializeRealTimeListeners]);

  const handleInputChange = (taskId: string, field: string, value: any) => {
    setProgressData((prev: any) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [field]: value,
      },
    }));
  };

  const handleUpdateProgress = async (taskId: string) => {
    const data = progressData[taskId] || {};
    if (!data.progress_status) {
      toast.error("Please select a progress status.");
      return;
    }

    try {
      await updateTaskProgress(taskId, {
        progress_status: data.progress_status,
        progress_description: data.progress_description || "",
        progress_link: data.progress_link || "",
      });

      setEditingTask(null);
      // Clear the progress data for this task
      setProgressData(prev => {
        const newData = { ...prev };
        delete newData[taskId];
        return newData;
      });
    } catch (error: any) {
      console.error("Error updating progress:", error);
      // Error is already handled in the store
    }
  };

  // Update filtered tasks when tasks or filters change
  useEffect(() => {
    filterTasks(searchTerm, statusFilter, progressFilter, selectedDate);
  }, [tasks, searchTerm, statusFilter, progressFilter, selectedDate]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    filterTasks(value, statusFilter, progressFilter, selectedDate);
  };

  const filterTasks = (search: string, status: string, progress: string, date: string) => {
    let filtered = tasks;

    if (search && search.length >= 2) {
      const lower = search.toLowerCase();
      filtered = filtered.filter((task) =>
        Object.values(task).some(
          (val) => typeof val === "string" && val.toLowerCase().includes(lower)
        )
      );
    }

    if (status) {
      filtered = filtered.filter((task) => task.status === status);
    }

    if (progress) {
      filtered = filtered.filter((task) => task.progress_status === progress);
    }

    if (date) {
      filtered = filtered.filter((task) => {
        if (!task.due_date) return false;
        const taskDate = new Date(task.due_date.toDate?.() || task.due_date);
        return taskDate.toISOString().split('T')[0] === date;
      });
    }

    setFilteredTasks(filtered);
  };

  const formatGoogleCalendarDate = (date: Date) => {
    return date.toISOString().replace(/[-:]|\.\d{3}/g, "").slice(0, 15) + "Z";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800";
      case "low":
        return "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800";
      case "in_progress":
        return "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800";
      case "pending":
        return "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-3 h-3" />;
      case "in_progress":
        return <Clock className="w-3 h-3" />;
      case "pending":
        return <Circle className="w-3 h-3" />;
      default:
        return <Circle className="w-3 h-3" />;
    }
  };

  const TaskCard = ({ task }: { task: any }) => {
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.progress_status !== "completed";
    const isEditing = editingTask === task.id;
    const currentProgress = progressData[task.id] || {};

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white dark:bg-gray-900 rounded-lg border transition-all duration-200 ${
          isOverdue ? 'border-red-200 dark:border-red-800' : 'border-gray-200 dark:border-gray-800'
        } hover:shadow-lg hover:shadow-cyan-500/5`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                  {task.task_id || task.id}
                </span>
                {task.linked_ticket && (
                  <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded border">
                    #{task.linked_ticket}
                  </span>
                )}
                {isOverdue && (
                  <span className="text-xs px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded border flex items-center gap-1">
                    <AlertCircle className="w-2 h-2" />
                    Overdue
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {task.title}
              </h3>
              {task.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
            <button
              onClick={() => setEditingTask(isEditing ? null : task.id)}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
            </button>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>By {task.created_by}</span>
              </div>
              {task.due_date && (
                <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(task.due_date.toDate?.() || task.due_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            {task.due_date && (
              <button
                onClick={() => {
                  const dateTime = new Date(task.due_date);
                  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                    task.title || "Task Reminder"
                  )}&dates=${formatGoogleCalendarDate(dateTime)}/${formatGoogleCalendarDate(
                    new Date(dateTime.getTime() + 30 * 60 * 1000)
                  )}&details=${encodeURIComponent(task.description || "")}&location=&sf=true&output=xml`;
                  window.open(calendarUrl, "_blank");
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Plus className="w-2 h-2" />
                Add to Calendar
              </button>
            )}
          </div>
        </div>

        {/* Status and Progress */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Review Status
              </label>
              <div className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded border ${getStatusColor(task.status)}`}>
                {getStatusIcon(task.status)}
                {task.status || "Not Set"}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Progress Status
              </label>
              {isEditing ? (
                <select
                  value={currentProgress.progress_status || task.progress_status || ""}
                  onChange={(e) => handleInputChange(task.id, "progress_status", e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="">Select Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              ) : (
                <div className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded border ${getStatusColor(task.progress_status)}`}>
                  {getStatusIcon(task.progress_status)}
                  {task.progress_status || "Not Set"}
                </div>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Progress Description
                </label>
                <textarea
                  placeholder="Optional description of progress..."
                  rows={2}
                  value={currentProgress.progress_description || task.progress_description || ""}
                  onChange={(e) => handleInputChange(task.id, "progress_description", e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Progress Link
                </label>
                <input
                  type="url"
                  placeholder="Optional link to work/documentation..."
                  value={currentProgress.progress_link || task.progress_link || ""}
                  onChange={(e) => handleInputChange(task.id, "progress_link", e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <button
                onClick={() => handleUpdateProgress(task.id)}
                disabled={!currentProgress.progress_status}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-cyan-500 text-white text-xs rounded hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-3 h-3" />
                Update Progress
              </button>
            </div>
          )}

          {/* Current Progress Info */}
          {!isEditing && (task.progress_description || task.progress_link) && (
            <div className="border-t border-gray-200 dark:border-gray-800 pt-3 space-y-2">
              {task.progress_description && (
                <div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Description:</span>
                  <p className="text-xs text-gray-800 dark:text-gray-200 mt-1">{task.progress_description}</p>
                </div>
              )}
              {task.progress_link && (
                <div>
                  <a
                    href={task.progress_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    <ExternalLink className="w-2 h-2" />
                    View Progress Link
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Feedback */}
          {(task.reassign_count > 0 || (task.comments && task.comments.length > 0)) && (
            <div className="border-t border-gray-200 dark:border-gray-800 pt-3">
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                {task.reassign_count > 0 && (
                  <span>Reassigned: {task.reassign_count}</span>
                )}
                {task.comments && task.comments.length > 0 && (
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {task.comments.length} comments
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-cyan-500 mx-auto mb-3"></div>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-black">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                My Assigned Tasks
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filteredTasks.length} tasks • Track and update your progress
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 w-64"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown className="w-4 h-4" />
              </button>

              {filterOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Filter Tasks</h3>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Review Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => {
                            setStatusFilter(e.target.value);
                            filterTasks(searchTerm, e.target.value, progressFilter, selectedDate);
                          }}
                          className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        >
                          <option value="">All</option>
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Progress Status</label>
                        <select
                          value={progressFilter}
                          onChange={(e) => {
                            setProgressFilter(e.target.value);
                            filterTasks(searchTerm, statusFilter, e.target.value, selectedDate);
                          }}
                          className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        >
                          <option value="">All</option>
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          filterTasks(searchTerm, statusFilter, progressFilter, e.target.value);
                        }}
                        className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                    
                    <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          setStatusFilter("");
                          setProgressFilter("");
                          setSelectedDate("");
                          filterTasks(searchTerm, "", "", "");
                          setFilterOpen(false);
                        }}
                        className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={() => setFilterOpen(false)}
                        className="px-3 py-1 text-xs bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total", count: filteredTasks.length, color: "gray" },
            { label: "Pending", count: filteredTasks.filter(t => t.progress_status === "pending").length, color: "red" },
            { label: "In Progress", count: filteredTasks.filter(t => t.progress_status === "in_progress").length, color: "blue" },
            { label: "Completed", count: filteredTasks.filter(t => t.progress_status === "completed").length, color: "green" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className={`text-lg font-bold ${
                stat.color === "red" ? "text-red-600 dark:text-red-400" :
                stat.color === "blue" ? "text-blue-600 dark:text-blue-400" :
                stat.color === "green" ? "text-green-600 dark:text-green-400" :
                "text-gray-600 dark:text-gray-400"
              }`}>
                {stat.count}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="p-6">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No tasks found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter || progressFilter || selectedDate 
                ? "Try adjusting your filters to see more tasks."
                : "You don't have any assigned tasks yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
