import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useTaskManagement } from "../hooks/useTaskManagement";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  ChevronDown,
  Calendar,
  MessageCircle,
  CheckCircle,
  Clock,
  Circle,
  X,
  Save,
  User,
  Flag,
  ArrowRight,
  AlertCircle,
  Star,
  Edit,
  Trash2,
  Eye,
  Users,
  Layers,
  Target,
  Zap,
  TrendingUp,
  Activity,
  Timer,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";

const KanbanPage = () => {
  const { user } = useAuthStore();

  // Unified task management
  const { tasks, loading, moveTask, createTask, getTasksByStatus } = useTaskManagement();

  // Local state for UI
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTaskColumn, setNewTaskColumn] = useState("");
  const [draggedTask, setDraggedTask] = useState<any>(null);
  const [newTaskForm, setNewTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    assigned_to: "",
    project_id: "",
    tags: "",
  });

  // Task management is now handled by the useTaskManagement hook

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterOpen && !(event.target as Element).closest('.filter-dropdown')) {
        setFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterOpen]);

  const getEmployeeName = (empId: string) =>
    employees.find((emp: any) => emp.id === empId)?.name || "Unassigned";

  const getEmployeeAvatar = (empId: string) => {
    const emp = employees.find((emp: any) => emp.id === empId);
    return emp?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${empId}`;
  };

  const getProjectColor = (projectId: string) => {
    const project = projects.find((p: any) => p.id === projectId);
    return project?.color || "#06b6d4";
  };

  // Enhanced filter logic
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchTerm || 
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.tags?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !selectedDate || task.due_date === selectedDate;
    const matchesProject = !selectedProject || task.project_id === selectedProject;
    const matchesPriority = !selectedPriority || task.priority === selectedPriority;
    const matchesAssignee = !selectedAssignee || task.assigned_to === selectedAssignee;
    
    return matchesSearch && matchesDate && matchesProject && matchesPriority && matchesAssignee;
  });

  // Updated columns - removed review column
  const columns = [
    {
      id: "pending",
      title: "Pending",
      icon: Circle,
      color: "gray",
      count: filteredTasks.filter((t: any) => t.status === "pending").length
    },
    {
      id: "in_progress",
      title: "In Progress",
      icon: Clock,
      color: "cyan",
      count: filteredTasks.filter((t: any) => t.status === "in_progress").length
    },
    {
      id: "completed",
      title: "Completed",
      icon: CheckCircle,
      color: "green",
      count: filteredTasks.filter((t: any) => t.status === "completed").length
    }
  ];

  const handleAddTask = async () => {
    if (!newTaskForm.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    const success = await createTask({
      ...newTaskForm,
      status: newTaskColumn || "pending",
      progress_status: newTaskColumn || "pending",
    });

    if (success) {
      setNewTaskForm({
        title: "",
        description: "",
        priority: "medium",
        due_date: "",
        assigned_to: "",
        project_id: "",
        tags: "",
      });
      setShowNewTaskModal(false);
      setNewTaskColumn("");
    }
  };

  const handleTaskMove = async (task: any, newStatus: string) => {
    await moveTask(task.id, newStatus, {
      progress: newStatus === "completed" ? 100 : task.progress || 0,
    });
  };

  const handleDragStart = (e: React.DragEvent, task: any) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, columnStatus: string) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== columnStatus) {
      handleTaskMove(draggedTask, columnStatus);
    }
    setDraggedTask(null);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <Flag className="w-3 h-3 text-red-500" />;
      case "medium":
        return <Flag className="w-3 h-3 text-yellow-500" />;
      case "low":
        return <Flag className="w-3 h-3 text-green-500" />;
      default:
        return <Flag className="w-3 h-3 text-gray-400" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800";
      case "medium":
        return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800";
      case "low":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800";
    }
  };

  const TaskCard = ({ task }: { task: any }) => {
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed";

    const getCardBg = () => {
      if (isOverdue) return 'bg-white dark:bg-gray-900 border-red-200 dark:border-red-800';
      return 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800';
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        layout
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onClick={() => {
          setSelectedTask(task);
          setShowTaskDetailModal(true);
        }}
        className={`${getCardBg()} rounded-lg border p-3 mb-2 transition-all duration-200 cursor-pointer group hover:shadow-lg hover:shadow-cyan-500/5`}
      >
        {/* Priority indicator */}
        <div className={`absolute top-0 left-0 w-full h-0.5 ${
          task.priority === "high" ? "bg-red-500" :
          task.priority === "medium" ? "bg-yellow-500" :
          "bg-green-500"
        }`} />

        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="text-xs font-semibold text-gray-900 dark:text-white leading-tight mb-1">
              {task.title}
            </h4>
            <div className="flex items-center gap-1">
              {getPriorityIcon(task.priority)}
              <span className={`px-1.5 py-0.5 text-xs rounded border ${getPriorityBadge(task.priority)}`}>
                {task.priority?.toUpperCase()}
              </span>
              {isOverdue && (
                <span className="px-1.5 py-0.5 text-xs bg-red-50 text-red-700 rounded border border-red-200 flex items-center gap-1 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
                  <AlertCircle className="w-2 h-2" />
                  Overdue
                </span>
              )}
            </div>
          </div>
          <button 
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <MoreHorizontal className="w-3 h-3" />
          </button>
        </div>
        
        {/* Description */}
        {task.description && (
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Progress Bar */}
        {task.progress > 0 && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
              <span>Progress</span>
              <span className="font-medium text-cyan-600 dark:text-cyan-400">
                {task.progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <div
                className="h-1 rounded-full bg-cyan-500"
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Tags */}
        {task.tags && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.tags.split(',').map((tag: string, index: number) => (
              <span
                key={index}
                className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded"
              >
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <img
              src={getEmployeeAvatar(task.assigned_to)}
              alt="avatar"
              className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-700"
            />
            <span className="text-xs">{getEmployeeName(task.assigned_to)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {task.due_date && (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
                <Calendar className="w-2 h-2" />
                <span className="text-xs">{new Date(task.due_date).toLocaleDateString()}</span>
              </div>
            )}
            {task.comments?.length > 0 && (
              <div className="flex items-center gap-1">
                <MessageCircle className="w-2 h-2" />
                <span className="text-xs">{task.comments.length}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-cyan-500 mx-auto mb-3"></div>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-cyan-500 rounded-md flex items-center justify-center">
                <Layers className="w-3 h-3 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  My Task Board
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {filteredTasks.length} tasks • {projects.length} projects
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-full flex items-center gap-1">
                <Activity className="w-2 h-2" />
                {navigator.onLine ? 'Live' : 'Offline'}
              </span>
              <span className="px-2 py-1 text-xs bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 rounded-full">
                {Math.round((columns.find(c => c.id === "completed")?.count || 0) / Math.max(filteredTasks.length, 1) * 100)}% Complete
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 w-40"
              />
            </div>

            {/* Filter */}
            <div className="relative filter-dropdown">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-1 px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Filter className="w-3 h-3" />
                Filters
                <ChevronDown className="w-3 h-3" />
              </button>

              {filterOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg z-50 p-3 shadow-lg">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Filter Tasks</h3>
                  
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Priority
                        </label>
                        <select
                          value={selectedPriority}
                          onChange={(e) => setSelectedPriority(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        >
                          <option value="">All</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Project
                      </label>
                      <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        <option value="">All Projects</option>
                        {projects.map((project: any) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          setSelectedDate("");
                          setSelectedProject("");
                          setSelectedPriority("");
                          setSelectedAssignee("");
                          setFilterOpen(false);
                        }}
                        className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => setFilterOpen(false)}
                        className="px-2 py-1 text-xs bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowNewTaskModal(true)}
              className="flex items-center gap-1 px-2 py-1.5 text-xs bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors"
            >
              <Plus className="w-3 h-3" />
              New Task
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          {columns.map((column) => (
            <div key={column.id} className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {column.count}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {column.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 min-h-0 p-4">
        <div className="flex gap-4 h-full overflow-x-auto">
          {columns.map((column) => (
            <motion.div 
              key={column.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col w-80 flex-shrink-0 h-full"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="bg-white dark:bg-gray-900 rounded-t-lg p-3 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                      column.color === 'gray' ? 'bg-gray-100 dark:bg-gray-800' :
                      column.color === 'cyan' ? 'bg-cyan-100 dark:bg-cyan-900/30' :
                      'bg-green-100 dark:bg-green-900/30'
                    }`}>
                      <column.icon className={`w-3 h-3 ${
                        column.color === 'gray' ? 'text-gray-600 dark:text-gray-400' :
                        column.color === 'cyan' ? 'text-cyan-600 dark:text-cyan-400' :
                        'text-green-600 dark:text-green-400'
                      }`} />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {column.title}
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {column.count} tasks
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress indicator */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full ${
                      column.color === 'gray' ? 'bg-gray-400' :
                      column.color === 'cyan' ? 'bg-cyan-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((column.count / Math.max(filteredTasks.length, 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Column Content */}
              <div className="flex-1 bg-white dark:bg-gray-900 rounded-b-lg border-x border-b border-gray-200 dark:border-gray-800 p-3 overflow-y-auto">
                <AnimatePresence>
                  {filteredTasks.filter((t: any) => t.status === column.id).map((task: any) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </AnimatePresence>
                
                {/* Empty State */}
                {filteredTasks.filter((t: any) => t.status === column.id).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-3">
                      <column.icon className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium mb-1">No tasks yet</p>
                    <p className="text-xs text-center">
                      {column.id === "pending" && "Tasks start here"}
                      {column.id === "in_progress" && "Active work happens here"}
                      {column.id === "completed" && "Completed tasks celebrate here"}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {showTaskDetailModal && selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowTaskDetailModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowTaskDetailModal(false)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      Task Details
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowTaskDetailModal(false)}
                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Task Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex-1">
                      {selectedTask.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded border ${getPriorityBadge(selectedTask.priority)}`}>
                      {selectedTask.priority?.toUpperCase()} PRIORITY
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>Assigned to: {getEmployeeName(selectedTask.assigned_to)}</span>
                    </div>
                    {selectedTask.due_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Due: {new Date(selectedTask.due_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Flag className="w-4 h-4" />
                      <span>Status: {selectedTask.status}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedTask.description && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {selectedTask.description}
                    </p>
                  </div>
                )}

                {/* Progress */}
                {selectedTask.progress > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Progress</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Completion</span>
                        <span className="font-medium text-cyan-600 dark:text-cyan-400">
                          {selectedTask.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-cyan-500"
                          style={{ width: `${selectedTask.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {selectedTask.tags && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.tags.split(',').map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded border"
                        >
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Created</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedTask.created_at?.seconds 
                        ? new Date(selectedTask.created_at.seconds * 1000).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>
                  {selectedTask.progress_updated_at && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Last Updated</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedTask.progress_updated_at?.seconds 
                          ? new Date(selectedTask.progress_updated_at.seconds * 1000).toLocaleString()
                          : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Task Modal */}
      <AnimatePresence>
        {showNewTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowNewTaskModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Create New Task
                  </h2>
                  <button
                    onClick={() => setShowNewTaskModal(false)}
                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={newTaskForm.title}
                    onChange={(e) => setNewTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Enter task title..."
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={newTaskForm.priority}
                      onChange={(e) => setNewTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={newTaskForm.due_date}
                      onChange={(e) => setNewTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={newTaskForm.tags}
                    onChange={(e) => setNewTaskForm(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    placeholder="frontend, api, urgent..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newTaskForm.description}
                    onChange={(e) => setNewTaskForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                    placeholder="Describe the task..."
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    onClick={() => setShowNewTaskModal(false)}
                    className="flex-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTask}
                    disabled={!newTaskForm.title.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    Create Task
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KanbanPage;
