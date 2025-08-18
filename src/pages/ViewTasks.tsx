import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import {
  collection,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import { 
  Search, 
  Calendar, 
  Users, 
  Edit2, 
  Trash2, 
  MessageCircle, 
  Clock, 
  Flag,
  Plus,
  ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function ViewTasks() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [selectedProject, setSelectedProject] = useState("");

  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Query only tasks assigned to the current user
  const { data: tasks = [], isLoading: tasksLoading, refetch } = useQuery(
    ["user-tasks", user?.uid], 
    async () => {
      if (!user?.uid) return [];
      
      // Query only tasks assigned to the current user
      const q = query(
        collection(db, "tasks"),
        where("assigned_to", "==", user.uid)
      );
      const snap = await getDocs(q);
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const aDate = a.created_at?.seconds
            ? new Date(a.created_at.seconds * 1000)
            : new Date(0);
          const bDate = b.created_at?.seconds
            ? new Date(b.created_at.seconds * 1000)
            : new Date(0);
          return bDate - aDate; // latest first
        });
    }
  );

  const { data: projects = [] } = useQuery("projects", async () => {
    const snap = await getDocs(collection(db, "projects"));
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  });

  const { data: employees = [] } = useQuery("employees", async () => {
    const snap = await getDocs(collection(db, "employees"));
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  });

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        status: newStatus,
        progress_status: newStatus,
        updated_at: serverTimestamp(),
      });
      toast.success("Task status updated");
      refetch();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, "tasks", taskId));
      toast.success("Task deleted");
      refetch();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const getEmployeeName = (id) => {
    const employee = employees.find(emp => emp.id === id);
    return employee?.name || employee?.email || "Unknown";
  };

  const getProjectName = (id) => {
    const project = projects.find(p => p.id === id);
    return project?.name || "No Project";
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800";
      case "medium": return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800";
      case "low": return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800";
      default: return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800";
      case "in_progress": return "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800";
      case "review": return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800";
      case "pending": return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800";
      default: return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800";
    }
  };

  const filteredTasks = tasks.filter(task => {
    const searchMatch = !searchTerm || 
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const dateMatch = !filterDate || task.due_date === filterDate;
    const statusMatch = !statusFilter || (task.status || task.progress_status) === statusFilter;
    const priorityMatch = !priorityFilter || task.priority === priorityFilter;
    const projectMatch = !selectedProject || task.project_id === selectedProject;
    
    return searchMatch && dateMatch && statusMatch && priorityMatch && projectMatch;
  });

  if (tasksLoading) {
    return (
      <div className="h-full bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-cyan-500 mx-auto mb-3"></div>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              My Assigned Tasks ({filteredTasks.length})
            </h1>

            {/* Create Task Button */}
            <button
              onClick={() => navigate("/CreateTask")}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Task
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search my tasks..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
            </select>

            <select
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No tasks found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm || statusFilter || priorityFilter || selectedProject || filterDate
                  ? "No tasks match your current filters."
                  : "You don't have any assigned tasks yet."}
              </p>
              <button
                onClick={() => navigate("/CreateTask")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all duration-200 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Create Your First Task
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.progress_status !== "completed";
              
              return (
                <div
                  key={task.id}
                  className={`bg-white dark:bg-gray-900 border rounded-lg p-4 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-200 ${
                    isOverdue ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {task.task_id && (
                              <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-400">
                                {task.task_id}
                              </span>
                            )}
                            {task.linked_ticket && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded text-blue-600 dark:text-blue-400">
                                #{task.linked_ticket}
                              </span>
                            )}
                            {isOverdue && (
                              <span className="text-xs bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded text-red-600 dark:text-red-400 flex items-center gap-1">
                                <Flag className="w-3 h-3" />
                                Overdue
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-sm text-gray-900 dark:text-white leading-tight mb-1">
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded border ${getPriorityColor(task.priority)}`}>
                            {task.priority?.toUpperCase() || "MEDIUM"}
                          </span>
                          
                          <select
                            value={task.status || task.progress_status || "pending"}
                            onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                            className={`px-2 py-1 text-xs rounded border cursor-pointer ${getStatusColor(task.status || task.progress_status)}`}
                          >
                            <option value="pending">PENDING</option>
                            <option value="in_progress">IN PROGRESS</option>
                            <option value="review">REVIEW</option>
                            <option value="completed">COMPLETED</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span>Project: {getProjectName(task.project_id)}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span>Created by: {getEmployeeName(task.created_by)}</span>
                        </div>

                        {task.due_date && (
                          <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                          </div>
                        )}

                        {task.progress_link && (
                          <div className="flex items-center gap-1">
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                            <a 
                              href={task.progress_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-cyan-600 dark:text-cyan-400 hover:underline"
                            >
                              Progress Link
                            </a>
                          </div>
                        )}
                      </div>

                      {task.comments && task.comments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <MessageCircle className="w-3 h-3" />
                            <span>{task.comments.length} comment(s)</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {task.created_by === user?.uid && (
                      <div className="ml-4">
                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this task?")) {
                              deleteTask(task.id);
                            }
                          }}
                          className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {filteredTasks.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">My Tasks Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {filteredTasks.length}
                </div>
                <div className="text-gray-500 dark:text-gray-400">Total Assigned</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {filteredTasks.filter(t => (t.status || t.progress_status) === "completed").length}
                </div>
                <div className="text-gray-500 dark:text-gray-400">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400">
                  {filteredTasks.filter(t => (t.status || t.progress_status) === "in_progress").length}
                </div>
                <div className="text-gray-500 dark:text-gray-400">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600 dark:text-red-400">
                  {filteredTasks.filter(t => {
                    const isOverdue = t.due_date && new Date(t.due_date) < new Date() && (t.status || t.progress_status) !== "completed";
                    return isOverdue;
                  }).length}
                </div>
                <div className="text-gray-500 dark:text-gray-400">Overdue</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewTasks;
