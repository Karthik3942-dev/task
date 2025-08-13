import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  ChevronDown,
  Calendar as CalendarIcon,
  Clock,
  User,
  Eye,
  List,
  Grid,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";

const Calendar = () => {
  const { user } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("month");
  const [selectedProject, setSelectedProject] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      const cleanup = setupRealtimeListeners();
      return cleanup;
    }
  }, [user]);

  const setupRealtimeListeners = () => {
    if (!user?.uid) return () => {};

    const tasksUnsub = onSnapshot(
      query(collection(db, "tasks"), where("assigned_to", "==", user.uid)),
      (snapshot) => {
        const taskEvents = snapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title,
          date: new Date(doc.data().due_date || Date.now()),
          type: "task",
          status: doc.data().status || doc.data().progress_status,
          priority: doc.data().priority,
          project_id: doc.data().project_id,
          assigned_to: doc.data().assigned_to,
          description: doc.data().description,
          ...doc.data(),
        }));
        setEvents(taskEvents);
        setLoading(false);
      },
      (error) => {
        console.warn("Calendar tasks listener error:", error);
        toast.error("Failed to load calendar data");
        setEvents([]);
        setLoading(false);
      }
    );

    const projectsUnsub = onSnapshot(
      collection(db, "projects"),
      (snapshot) => {
        const projectsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          color: doc.data().color || "#06b6d4",
          ...doc.data(),
        }));
        setProjects(projectsData);
      },
      (error) => {
        console.warn("Calendar projects listener error:", error);
        setProjects([]);
      }
    );

    return () => {
      tasksUnsub();
      projectsUnsub();
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
      default: return "#06b6d4";
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

  if (!user?.uid) {
    return (
      <div className="h-full bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-cyan-500 mx-auto mb-3"></div>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Please log in to view your calendar</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-cyan-500 mx-auto mb-3"></div>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-black flex overflow-hidden">
      {/* Project Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            My Projects
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {new Date().getFullYear()} Calendar
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            <button
              onClick={() => setSelectedProject("all")}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedProject === "all"
                  ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-3 h-3" />
                <span>All Tasks</span>
                <span className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
                  {events.length}
                </span>
              </div>
            </button>

            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedProject === project.id
                    ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="flex-1 truncate">{project.name}</span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
                    {events.filter(e => e.project_id === project.id).length}
                  </span>
                </div>
              </button>
            ))}

            {/* Status Filter Section */}
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Filter by Status</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    statusFilter === "all"
                      ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>All Status</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
                      {events.length}
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => setStatusFilter("completed")}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    statusFilter === "completed"
                      ? "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300 border border-green-200 dark:border-green-800"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Completed</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
                      {events.filter(e => e.status === "completed").length}
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => setStatusFilter("in_progress")}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    statusFilter === "in_progress"
                      ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>In Progress</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
                      {events.filter(e => e.status === "in_progress").length}
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => setStatusFilter("overdue")}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    statusFilter === "overdue"
                      ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Overdue</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
                      {events.filter(e => e.date && new Date() > e.date && e.status !== "completed").length}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {getDateLabel()}
            </h1>
            <div className="flex items-center gap-1">
              <button
                onClick={prevPeriod}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextPeriod}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-md p-1">
              {[
                { id: "day", icon: Eye, label: "Day" },
                { id: "week", icon: List, label: "Week" },
                { id: "month", icon: Grid, label: "Month" }
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-all ${
                    viewMode === mode.id
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <mode.icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{mode.label}</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 w-40"
              />
            </div>

            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-xs bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors"
            >
              Today
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto">
          <div className="h-full bg-white dark:bg-gray-900 m-4 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
            {/* Week Headers */}
            {viewMode !== "day" && (
              <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div
                    key={day}
                    className="p-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800"
                  >
                    {day}
                  </div>
                ))}
              </div>
            )}

            {/* Calendar Days */}
            <div className={`flex-1 overflow-auto ${
              viewMode === "day" ? "p-4" :
              viewMode === "week" ? "grid grid-cols-7" :
              "grid grid-cols-7"
            }`}>
              {viewMode === "day" ? (
                // Day view
                <div className="space-y-3">
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {format(currentDate, "EEEE")}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {format(currentDate, "MMMM d, yyyy")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {getEventsForDate(currentDate).map((event, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-md border text-left ${getStatusColor(event.status)}`}
                        style={{
                          borderLeftWidth: "3px",
                          borderLeftColor: getEventColor(event)
                        }}
                      >
                        <div className="font-medium text-sm mb-1">{event.title}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="capitalize">{event.status}</span>
                          {event.priority && (
                            <>
                              <span>•</span>
                              <span className="capitalize">{event.priority} priority</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                    {getEventsForDate(currentDate).length === 0 && (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No tasks for today</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Week and Month view
                calendarDays.map((day, index) => {
                  const dayEvents = getEventsForDate(day);
                  const isToday_ = isToday(day);
                  const isCurrentMonth = viewMode === "week" || isSameMonth(day, currentDate);

                  return (
                    <div
                      key={index}
                      className={`p-2 ${viewMode === "week" ? "min-h-[160px]" : "min-h-[100px]"} border-r border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                        !isCurrentMonth ? "text-gray-400 bg-gray-50 dark:bg-gray-800/50" : ""
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
                        {dayEvents.slice(0, viewMode === "week" ? 4 : 2).map((event, eventIndex) => (
                          <div
                            key={eventIndex}
                            className={`text-xs px-2 py-1 rounded border text-left cursor-pointer hover:shadow-sm transition-all ${getStatusColor(event.status)}`}
                            style={{
                              borderLeftWidth: "2px",
                              borderLeftColor: getEventColor(event)
                            }}
                            title={`${event.title} - ${event.status}`}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                          </div>
                        ))}

                        {dayEvents.length > (viewMode === "week" ? 4 : 2) && (
                          <div className="text-xs text-gray-500 px-2 py-1">
                            +{dayEvents.length - (viewMode === "week" ? 4 : 2)} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Date Modal */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedDate(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {getEventsForDate(selectedDate).map((event, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border-l-2"
                    style={{ borderLeftColor: getEventColor(event) }}
                  >
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      {event.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="capitalize">{event.status}</span>
                      {event.priority && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{event.priority} priority</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {getEventsForDate(selectedDate).length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No tasks for this date</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Calendar;
