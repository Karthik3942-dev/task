import React, { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, isFirebaseConnected } from "../lib/firebase";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Users,
  RefreshCw,
  AlertCircle,
  Eye,
  Grid,
  List,
  Settings,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("month");
  const [selectedProject, setSelectedProject] = useState("all");
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let retryTimer: NodeJS.Timeout;
    
    const initializeWithRetry = () => {
      try {
        setHasError(false);
        setupCalendarListeners();
        
        if (connectionStatus === 'offline' && retryCount < 3) {
          retryTimer = setTimeout(() => {
            console.log(`Retrying Calendar connection (attempt ${retryCount + 1})`);
            setRetryCount(prev => prev + 1);
            initializeWithRetry();
          }, 5000 * (retryCount + 1));
        }
      } catch (error) {
        console.error("Calendar initialization error:", error);
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

  const setupCalendarListeners = () => {
    if (!db) {
      console.warn("Firebase not available for Calendar");
      setConnectionStatus('offline');
      setLoading(false);
      return;
    }

    setConnectionStatus('connecting');

    try {
      // Setup listeners for events and projects
      const eventsUnsub = onSnapshot(
        collection(db, "events"),
        (snapshot) => {
          try {
            const eventsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setEvents(eventsData);
            setConnectionStatus('connected');
          } catch (error) {
            console.warn("Error processing events:", error);
          }
        },
        (error) => {
          console.warn("Events listener error:", error);
          setConnectionStatus('offline');
        }
      );

      const projectsUnsub = onSnapshot(
        collection(db, "projects"),
        (snapshot) => {
          try {
            const projectsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setProjects(projectsData);
          } catch (error) {
            console.warn("Error processing projects:", error);
          }
        },
        (error) => {
          console.warn("Projects listener error:", error);
        }
      );

      setLoading(false);
      return () => {
        eventsUnsub();
        projectsUnsub();
      };
    } catch (error) {
      console.error("Error setting up calendar listeners:", error);
      setConnectionStatus('offline');
      setHasError(true);
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setHasError(false);
    setRetryCount(0);
    setLoading(true);
    setupCalendarListeners();
  };

  // Get calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Navigate months
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, day);
    });
  };

  // Filter events based on search and project
  const filteredEvents = events.filter(event => {
    const matchesSearch = !searchTerm || 
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = selectedProject === 'all' || event.projectId === selectedProject;
    return matchesSearch && matchesProject;
  });

  // Error boundary fallback
  if (hasError && connectionStatus === 'offline') {
    return (
      <div className="h-full bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-violet-900/10 dark:to-indigo-900/5 flex items-center justify-center">
        <div className="text-center p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl shadow-lg max-w-md">
          <div className="p-4 bg-orange-100 dark:bg-orange-500/20 rounded-xl mb-4 inline-block">
            <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Calendar Unavailable</h3>
          <p className="text-sm text-violet-600/70 dark:text-violet-300/70 mb-4">
            Unable to load calendar data. Please check your connection.
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
          <p className="text-violet-600 dark:text-violet-400 font-medium">Loading Calendar...</p>
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
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Calendar
                </h1>
                <p className="text-xs text-violet-600/70 dark:text-violet-300/70 font-medium">
                  Schedule & events
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
              {events.length} Events
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
            
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-sm text-sm font-medium">
              <Plus className="w-4 h-4" />
              New Event
            </button>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-violet-100/60 dark:hover:bg-violet-500/10 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </button>
              
              <h2 className="text-lg font-bold text-slate-800 dark:text-white min-w-[180px] text-center">
                {format(currentDate, "MMMM yyyy")}
              </h2>
              
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-violet-100/60 dark:hover:bg-violet-500/10 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </button>
            </div>
            
            <button
              onClick={goToToday}
              className="px-3 py-2 bg-violet-100/60 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 hover:bg-violet-200/60 dark:hover:bg-violet-500/20 rounded-lg transition-colors text-xs font-medium"
            >
              Today
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-violet-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 bg-white/70 dark:bg-slate-800/70 border border-violet-200/60 dark:border-violet-500/30 rounded-xl text-violet-800 dark:text-violet-200 placeholder-violet-400 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 shadow-sm backdrop-blur-sm w-48"
              />
            </div>
            
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 bg-white/70 dark:bg-slate-800/70 border border-violet-200/60 dark:border-violet-500/30 rounded-xl text-violet-800 dark:text-violet-200 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 shadow-sm backdrop-blur-sm"
            >
              <option value="all">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="relative z-10 flex-1 overflow-auto px-6 py-4">
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl p-6 shadow-lg">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center p-3 text-sm font-bold text-violet-600/70 dark:text-violet-300/70">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isDayToday = isToday(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.01 }}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    p-2 min-h-[100px] border border-violet-100/50 dark:border-violet-500/10 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md
                    ${isCurrentMonth 
                      ? 'bg-white/40 dark:bg-slate-700/40' 
                      : 'bg-gray-50/40 dark:bg-slate-800/20'
                    }
                    ${isDayToday 
                      ? 'ring-2 ring-violet-500 bg-violet-50/60 dark:bg-violet-500/10' 
                      : ''
                    }
                    ${isSelected 
                      ? 'ring-2 ring-purple-500 bg-purple-50/60 dark:bg-purple-500/10' 
                      : ''
                    }
                  `}
                >
                  <div className={`
                    text-sm font-medium mb-2
                    ${isCurrentMonth 
                      ? isDayToday 
                        ? 'text-violet-700 dark:text-violet-300 font-bold' 
                        : 'text-slate-700 dark:text-slate-300'
                      : 'text-gray-400 dark:text-gray-500'
                    }
                  `}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event, eventIndex) => (
                      <div
                        key={eventIndex}
                        className="px-2 py-1 bg-gradient-to-r from-violet-500/80 to-purple-600/80 text-white text-xs rounded-lg shadow-sm truncate"
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Events */}
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
              Events for {format(selectedDate, "MMMM d, yyyy")}
            </h3>
            
            <div className="space-y-3">
              {getEventsForDay(selectedDate).length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-violet-400 mx-auto mb-3" />
                  <p className="text-violet-600/70 dark:text-violet-300/70">No events scheduled</p>
                </div>
              ) : (
                getEventsForDay(selectedDate).map((event, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-violet-50/60 to-purple-50/60 dark:from-violet-500/10 dark:to-purple-500/10 rounded-xl border border-violet-200/50 dark:border-violet-500/20"
                  >
                    <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 dark:text-white">{event.title}</h4>
                      {event.description && (
                        <p className="text-sm text-violet-600/70 dark:text-violet-300/70">{event.description}</p>
                      )}
                      {event.time && (
                        <p className="text-xs text-violet-500 dark:text-violet-400 mt-1">{event.time}</p>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
