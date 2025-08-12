import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Filter,
  Search,
  Grid3X3,
  List,
  Share,
  Settings,
  Star,
  MoreHorizontal,
  Clock,
  User,
  Tag,
} from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuthStore } from "../store/authStore";
import dayjs from "dayjs";

interface Task {
  id: string;
  task_id: string;
  title: string;
  description: string;
  due_date: any;
  progress_status: string;
  priority: "low" | "medium" | "high";
  project_name?: string;
  assigned_to: string;
  created_by: string;
}

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const { user } = useAuthStore();

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const tasksQuery = query(
        collection(db, "tasks"),
        where("assigned_to", "==", user.uid)
      );
      const querySnapshot = await getDocs(tasksQuery);
      const tasksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];

      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      // Use mock data on error
      setTasks([
        {
          id: "mock-1",
          task_id: "TASK-001",
          title: "Design Review",
          description: "Review new dashboard designs",
          due_date: { seconds: dayjs().add(2, 'day').unix() },
          progress_status: "pending",
          priority: "high",
          assigned_to: user?.uid || "",
          created_by: user?.uid || "",
        },
        {
          id: "mock-2",
          task_id: "TASK-002",
          title: "Code Review",
          description: "Review PR for authentication module",
          due_date: { seconds: dayjs().add(5, 'day').unix() },
          progress_status: "in_progress",
          priority: "medium",
          assigned_to: user?.uid || "",
          created_by: user?.uid || "",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const startOfMonth = currentDate.startOf("month");
    const endOfMonth = currentDate.endOf("month");
    const startDate = startOfMonth.startOf("week");
    const endDate = endOfMonth.endOf("week");

    const days = [];
    let currentDay = startDate;

    while (currentDay.isBefore(endDate) || currentDay.isSame(endDate, "day")) {
      days.push(currentDay);
      currentDay = currentDay.add(1, "day");
    }

    return days;
  };

  const getTasksForDate = (date: dayjs.Dayjs) => {
    return tasks.filter((task) => {
      if (!task.due_date) return false;
      const taskDate = dayjs.unix(task.due_date.seconds);
      return taskDate.isSame(date, "day");
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500 dark:bg-red-400";
      case "medium":
        return "bg-yellow-500 dark:bg-yellow-400";
      case "low":
        return "bg-green-500 dark:bg-green-400";
      default:
        return "bg-purple-500 dark:bg-purple-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-500/30";
      case "in_progress":
        return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-500/30";
      case "review":
        return "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-500/30";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-500/30";
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filterStatus === "all") return true;
    return task.progress_status === filterStatus;
  });

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(
      direction === "prev"
        ? currentDate.subtract(1, "month")
        : currentDate.add(1, "month")
    );
  };

  const days = getDaysInMonth();

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 dark:bg-gradient-to-br dark:from-purple-900/20 dark:via-indigo-800/30 dark:to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 dark:border-purple-400 dark:border-t-purple-300 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 dark:bg-gradient-to-br dark:from-purple-900/20 dark:via-indigo-800/30 dark:to-purple-900/20 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass border-b border-purple-200 dark:border-purple-500/30 p-6 rounded-t-2xl backdrop-blur-2xl bg-gradient-to-r from-purple-50/80 via-indigo-50/80 to-purple-100/80 dark:bg-gradient-to-r dark:from-black/95 dark:via-black/90 dark:to-black/95"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center relative overflow-hidden shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse" />
                <CalendarIcon className="w-6 h-6 text-white relative z-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Calendar
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {filteredTasks.length} tasks • {currentDate.format("MMMM YYYY")}
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
                  className="pl-10 pr-4 py-2.5 text-sm border border-purple-200/50 dark:border-purple-500/30 rounded-lg bg-white/80 dark:bg-black/60 text-gray-900 dark:text-purple-100 placeholder:text-gray-400 dark:placeholder:text-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent backdrop-blur-xl w-48"
                />
              </div>

              {/* Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2.5 text-sm border border-purple-200/50 dark:border-purple-500/30 rounded-lg bg-white/80 dark:bg-black/60 text-gray-900 dark:text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 backdrop-blur-xl"
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="completed">Completed</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-white/80 dark:bg-black/60 rounded-lg border border-purple-200/50 dark:border-purple-500/30 p-1 backdrop-blur-xl">
                <button
                  onClick={() => setViewMode("month")}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === "month"
                      ? "bg-purple-600 text-white shadow-lg"
                      : "text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === "week"
                      ? "bg-purple-600 text-white shadow-lg"
                      : "text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Calendar Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="liquid-glass-card border-0 border-t border-purple-200/50 dark:border-purple-500/30 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateMonth("prev")}
                className="p-2 rounded-xl bg-white/80 dark:bg-purple-800/80 backdrop-blur-xl border border-purple-200/50 dark:border-purple-500/30 text-gray-600 dark:text-purple-300 hover:text-gray-900 dark:hover:text-purple-100 hover:bg-white dark:hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentDate.format("MMMM YYYY")}
                </h2>
                <p className="text-sm text-gray-500 dark:text-purple-300">
                  {currentDate.format("dddd, MMMM Do")}
                </p>
              </div>

              <button
                onClick={() => navigateMonth("next")}
                className="p-2 rounded-xl bg-white/80 dark:bg-purple-800/80 backdrop-blur-xl border border-purple-200/50 dark:border-purple-500/30 text-gray-600 dark:text-purple-300 hover:text-gray-900 dark:hover:text-purple-100 hover:bg-white dark:hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => setCurrentDate(dayjs())}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:via-indigo-700 hover:to-purple-800 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 backdrop-blur-sm border border-white/20 text-sm font-medium"
            >
              Today
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-semibold text-gray-600 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg backdrop-blur-sm border border-purple-200/30 dark:border-purple-500/20"
              >
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {days.map((day, index) => {
              const dayTasks = getTasksForDate(day);
              const isCurrentMonth = day.month() === currentDate.month();
              const isToday = day.isSame(dayjs(), "day");
              const isSelected = selectedDate === day.format("YYYY-MM-DD");

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.01 }}
                  onClick={() => setSelectedDate(day.format("YYYY-MM-DD"))}
                  className={`min-h-24 p-2 rounded-xl cursor-pointer transition-all duration-200 border backdrop-blur-sm relative overflow-hidden group hover:scale-105 hover:shadow-lg ${
                    isCurrentMonth
                      ? isToday
                        ? "bg-gradient-to-br from-purple-100/80 to-indigo-100/80 dark:from-purple-700/50 dark:to-indigo-700/50 border-purple-300 dark:border-purple-400 shadow-lg"
                        : isSelected
                        ? "bg-gradient-to-br from-purple-50/80 to-indigo-50/80 dark:from-purple-800/40 dark:to-indigo-800/40 border-purple-200 dark:border-purple-500"
                        : "bg-white/60 dark:bg-purple-900/20 border-purple-200/50 dark:border-purple-500/30 hover:bg-purple-50/80 dark:hover:bg-purple-800/30"
                      : "bg-gray-50/40 dark:bg-gray-800/20 border-gray-200/30 dark:border-gray-600/20 text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {/* Date Number */}
                  <div className={`text-sm font-semibold mb-1 ${
                    isCurrentMonth
                      ? isToday
                        ? "text-purple-700 dark:text-purple-300"
                        : "text-gray-900 dark:text-white"
                      : "text-gray-400 dark:text-gray-500"
                  }`}>
                    {day.date()}
                  </div>

                  {/* Task Indicators */}
                  {isCurrentMonth && dayTasks.length > 0 && (
                    <div className="space-y-1">
                      {dayTasks.slice(0, 2).map((task, taskIndex) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: taskIndex * 0.1 }}
                          className={`px-2 py-1 rounded-md text-xs font-medium truncate border ${getStatusColor(task.progress_status)}`}
                          title={task.title}
                        >
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                            <span className="truncate">{task.title}</span>
                          </div>
                        </motion.div>
                      ))}
                      {dayTasks.length > 2 && (
                        <div className="text-xs text-purple-600 dark:text-purple-400 font-medium px-2">
                          +{dayTasks.length - 2} more
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/5 to-purple-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Selected Date Tasks */}
        <AnimatePresence>
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="liquid-glass-card border-0 border-t border-purple-200/50 dark:border-purple-500/30 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Tasks for {dayjs(selectedDate).format("MMMM D, YYYY")}
                </h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                {getTasksForDate(dayjs(selectedDate)).map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="liquid-glass-card bg-gradient-to-r from-white/80 to-purple-50/80 dark:from-purple-900/20 dark:to-indigo-900/20 p-4 border border-purple-200/50 dark:border-purple-500/30"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {task.title}
                          </h4>
                          <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(task.progress_status)}`}>
                            {task.progress_status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Due: {dayjs.unix(task.due_date.seconds).format("h:mm A")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {task.task_id}
                          </span>
                        </div>
                      </div>
                      <button className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}

                {getTasksForDate(dayjs(selectedDate)).length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No tasks scheduled for this date</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Calendar;
