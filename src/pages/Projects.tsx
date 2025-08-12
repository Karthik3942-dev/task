import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuthStore } from "../store/authStore";
import { PlusCircle, Edit2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  deadline: string;
  teamId: string;
  created_by: string;
  created_at: any;
}

function Projects() {
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [sortBy, setSortBy] = useState<"deadline" | "status">("deadline");
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    deadline: "",
    teamId: "",
  });
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: projects = [] } = useQuery("projects", async () => {
    const q = query(collection(db, "projects"));
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  });

  const { data: teams = [] } = useQuery("teams", async () => {
    const snap = await getDocs(collection(db, "teams"));
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  });

  const { data: employees = [] } = useQuery("employees", async () => {
    const snap = await getDocs(collection(db, "employees"));
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  });

  const getEmployeeName = (id: string) =>
    employees.find((e: any) => e.id === id)?.name || id;

  const getEmployeeNameById = (uid: string) =>
    employees.find((e: any) => e.id === uid)?.name || "Unknown";

  const createProject = useMutation(
    async (data: typeof formData) => {
      await addDoc(collection(db, "projects"), {
        ...data,
        created_by: user?.uid,
        created_at: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("projects");
        toast.success("Project created");
        setShowModal(false);
      },
    }
  );

  const updateProject = useMutation(
    async ({ id, data }: { id: string; data: Partial<Project> }) => {
      await updateDoc(doc(db, "projects", id), data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("projects");
        toast.success("Project updated");
        setShowModal(false);
      },
    }
  );

  const deleteProject = useMutation(
    async (id: string) => {
      await deleteDoc(doc(db, "projects", id));
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("projects");
        toast.success("Project deleted");
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject) {
      updateProject.mutate({ id: editingProject.id, data: formData });
    } else {
      createProject.mutate(formData);
    }
  };

  const sortedProjects = [...projects]
    .filter((p: any) => {
      const team = teams.find((t) => t.id === p.teamId);
      const isCreator = p.created_by === user?.uid;
      const isMember = team?.members?.includes(user?.uid);
      return (
        (isCreator || isMember) &&
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a: any, b: any) => {
      if (sortBy === "deadline") {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-orange-50 to-cyan-100 dark:bg-gradient-to-br dark:from-purple-900/20 dark:via-purple-800/30 dark:to-purple-900/20 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="flex flex-col md:flex-row justify-between mb-8 gap-6">
          <div className="w-full md:w-1/2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 via-orange-500 to-cyan-600 dark:from-purple-400 dark:via-purple-500 dark:to-purple-600 bg-clip-text text-transparent mb-4">
              🚀 All Projects
            </h1>
            <div className="relative">
              <input
                type="text"
                placeholder="Search projects by name..."
                className="w-full px-4 py-3 pl-10 border border-gray-200 dark:border-purple-500/30 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-purple-500 focus:border-transparent transition-all shadow-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex gap-4 items-end">
            <select
              className="px-4 py-3 border border-gray-200 dark:border-purple-500/30 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-purple-500 focus:border-transparent transition-all shadow-lg"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "deadline" | "status")}
            >
              <option value="deadline">📅 Sort by Deadline</option>
              <option value="status">🔤 Sort by Name</option>
            </select>
            <button
              className="flex items-center px-6 py-3 bg-gradient-to-r from-cyan-600 to-orange-600 dark:from-purple-600 dark:to-purple-700 text-white rounded-xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              onClick={() => {
                setEditingProject(null);
                setFormData({
                  name: "",
                  description: "",
                  startDate: "",
                  deadline: "",
                  teamId: "",
                });
                setShowModal(true);
              }}
            >
              <PlusCircle className="mr-2 w-5 h-5" /> New Project
            </button>
          </div>
        </div>

        {/* Enhanced Project Grid */}
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {sortedProjects.map((project: any) => {
            const team = teams.find((t) => t.id === project.teamId);
            const isCreator = project.created_by === user?.uid;
            const isMember = team?.members?.includes(user?.uid);
            const roleLabel = isCreator
              ? "You created this project"
              : isMember
              ? "You are a member"
              : "";

            return (
              <div
                key={project.id}
                className={`liquid-glass-card relative overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                  isCreator
                    ? "border-cyan-300 dark:border-purple-500/50 bg-gradient-to-br from-white/90 to-cyan-50/90 dark:from-gray-800/90 dark:to-purple-900/50"
                    : "border-orange-300 dark:border-purple-400/50 bg-gradient-to-br from-orange-50/90 to-white/90 dark:from-purple-800/50 dark:to-gray-800/90"
                }`}
              >
                {/* Project Status Badge */}
                <div className="absolute top-4 right-4">
                  {roleLabel && (
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium backdrop-blur-sm ${
                        isCreator
                          ? "bg-cyan-100/80 dark:bg-purple-600/40 text-cyan-800 dark:text-purple-200 border border-cyan-300 dark:border-purple-500"
                          : "bg-orange-100/80 dark:bg-purple-500/40 text-orange-800 dark:text-purple-200 border border-orange-300 dark:border-purple-400"
                      }`}
                    >
                      {isCreator ? "👑 Creator" : "👥 Member"}
                    </span>
                  )}
                </div>

                <div>
                  <div className="mb-4">
                    <h2 className="font-bold text-xl text-gray-900 dark:text-white mb-2 pr-20">
                      {project.name}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                      {project.description}
                    </p>
                  </div>

                  {/* Team Info */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-600 dark:text-purple-400">👥</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Team: {team?.teamName || "N/A"}
                      </span>
                    </div>

                    {team?.members && (
                      <div className="ml-6">
                        <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                          {team.members.slice(0, 3).map((member: string, idx: number) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg">
                              {getEmployeeName(member)}
                            </span>
                          ))}
                          {team.members.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg">
                              +{team.members.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 dark:text-green-400">🚀</span>
                      <span className="text-gray-600 dark:text-gray-400">Start:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{project.startDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-600 dark:text-red-400">⏰</span>
                      <span className="text-gray-600 dark:text-gray-400">Deadline:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{project.deadline}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      Created by: {getEmployeeNameById(project.created_by)}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                {project.created_by === user?.uid && (
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setEditingProject(project);
                        setFormData({
                          name: project.name,
                          description: project.description,
                          startDate: project.startDate,
                          deadline: project.deadline,
                          teamId: project.teamId,
                        });
                        setShowModal(true);
                      }}
                      className="p-2 rounded-lg bg-cyan-100 dark:bg-purple-600/30 text-cyan-600 dark:text-purple-300 hover:bg-cyan-200 dark:hover:bg-purple-600/50 transition-all duration-200"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteProject.mutate(project.id)}
                      className="p-2 rounded-lg bg-red-100 dark:bg-red-600/30 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-600/50 transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in border border-gray-200 dark:border-purple-500/30">
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
              {editingProject ? "Edit Project" : "Create Project"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-purple-500/30 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 dark:focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-purple-500/30 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 dark:focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-purple-500/30 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 dark:focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-purple-500/30 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 dark:focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assign to Team
                </label>
                <select
                  value={formData.teamId}
                  onChange={(e) =>
                    setFormData({ ...formData, teamId: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-purple-500/30 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 dark:focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="">Select team</option>
                  {teams.map((team: any) => (
                    <option key={team.id} value={team.id}>
                      {team.teamName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-orange-600 dark:from-purple-600 dark:to-purple-700 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  {editingProject ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;
