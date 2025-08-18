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
  Grid3X3,
  List,
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
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

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

  const TaskTable = ({ tasks }: { tasks: any[] }) => {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto min-w-full">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" style={{ minWidth: '1400px' }}>
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Linked Ticket
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Task ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Assigned By
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Review
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Progress Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Progress Link
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Add to Calendar
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Feedback
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {tasks.map((task) => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.progress_status !== "completed";
                const isEditing = editingTask === task.id;
                const currentProgress = progressData[task.id] || {};

                return (
                  <motion.tr
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      isOverdue ? 'bg-red-50 dark:bg-red-900/10' : ''
                    }`}
                  >
                    {/* Linked Ticket */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {task.linked_ticket ? (
                        <span className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded border">
                          #{task.linked_ticket}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>

                    {/* Task ID */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        {task.task_id || task.id?.slice(0, 8)}
                      </span>
                      {isOverdue && (
                        <div className="mt-1">
                          <span className="text-xs px-1 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded border flex items-center gap-1">
                            <AlertCircle className="w-2 h-2" />
                            Overdue
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Title */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white max-w-xs truncate">
                        {task.title}
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-4">
                      <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
                        {task.description ? (
                          <div className="line-clamp-2" title={task.description}>
                            {task.description}
                          </div>
                        ) : (
                          <span className="text-gray-400">No description</span>
                        )}
                      </div>
                    </td>

                    {/* Due Date */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {task.due_date ? (
                        <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
                          <Calendar className="w-3 h-3" />
                          <span className="text-xs">
                            {new Date(task.due_date.toDate?.() || task.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No due date</span>
                      )}
                    </td>

                    {/* Assigned By */}
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      {task.created_by || task.assigned_by || 'Unknown'}
                    </td>

                    {/* Review */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded border ${getStatusColor(task.status)}`}>
                        {getStatusIcon(task.status)}
                        <span>{task.status || "Pending"}</span>
                      </div>
                    </td>

                    {/* Progress Status */}
                    <td className="px-4 py-4 whitespace-nowrap">
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
                          <span>{task.progress_status || "Pending"}</span>
                        </div>
                      )}
                    </td>

                    {/* Progress Link */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="url"
                          placeholder="Optional link..."
                          value={currentProgress.progress_link || task.progress_link || ""}
                          onChange={(e) => handleInputChange(task.id, "progress_link", e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                      ) : task.progress_link ? (
                        <a
                          href={task.progress_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Link
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">No link</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingTask(isEditing ? null : task.id)}
                          className="p-1 text-cyan-600 dark:text-cyan-400 hover:text-cyan-900 dark:hover:text-cyan-300 transition-colors"
                          title={isEditing ? "Cancel" : "Edit"}
                        >
                          {isEditing ? <X className="w-3 h-3" /> : <Edit className="w-3 h-3" />}
                        </button>
                        {isEditing && (
                          <button
                            onClick={() => handleUpdateProgress(task.id)}
                            disabled={!currentProgress.progress_status}
                            className="p-1 text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 transition-colors disabled:opacity-50"
                            title="Save"
                          >
                            <Save className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Add to Calendar */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {task.due_date ? (
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
                          title="Add to Calendar"
                        >
                          <Plus className="w-2 h-2" />
                          Add Reminder
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">No date</span>
                      )}
                    </td>

                    {/* Feedback */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {task.reassign_count > 0 && (
                          <span className="text-xs text-orange-600 dark:text-orange-400">
                            Reassigned: {task.reassign_count}
                          </span>
                        )}
                        {task.comments && task.comments.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                            <MessageCircle className="w-2 h-2" />
                            Comments: {task.comments.length}
                          </span>
                        )}
                        {(!task.reassign_count || task.reassign_count === 0) && (!task.comments || task.comments.length === 0) && (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
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
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === "table"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <List className="w-4 h-4" />
                Table
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === "cards"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                Cards
              </button>
              
            </div>

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

      {/* Tasks Display */}
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
        ) : viewMode === "table" ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TaskTable tasks={filteredTasks} />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
