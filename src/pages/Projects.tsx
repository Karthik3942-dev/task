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
import { Plus, Edit2, Trash2, Search, Calendar, Users, User, X } from "lucide-react";
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

  const { data: projects = [], isLoading: projectsLoading } = useQuery("projects", async () => {
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
        setFormData({
          name: "",
          description: "",
          startDate: "",
          deadline: "",
          teamId: "",
        });
      },
      onError: () => {
        toast.error("Failed to create project");
      }
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
        setEditingProject(null);
      },
      onError: () => {
        toast.error("Failed to update project");
      }
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
      onError: () => {
        toast.error("Failed to delete project");
      }
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

  if (projectsLoading) {
    return (
      <div className="h-full bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-cyan-500 mx-auto mb-3"></div>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              All Projects
            </h1>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3 items-end">
            <select
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "deadline" | "status")}
            >
              <option value="deadline">Sort by Deadline</option>
              <option value="status">Sort by Name</option>
            </select>
            <button
              className="flex items-center px-3 py-2 text-sm bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors"
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
              <Plus className="mr-1 w-4 h-4" /> New Project
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {sortedProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No projects found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {searchQuery ? "No projects match your search." : "Create your first project to get started."}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 text-sm bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors"
                >
                  Create Project
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {sortedProjects.map((project: any) => {
              const team = teams.find((t) => t.id === project.teamId);
              const isCreator = project.created_by === user?.uid;
              const isMember = team?.members?.includes(user?.uid);

              return (
                <div
                  key={project.id}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-200"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="font-semibold text-lg text-gray-900 dark:text-white leading-tight">
                      {project.name}
                    </h2>
                    {isCreator && (
                      <span className="px-2 py-0.5 text-xs bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 rounded-full">
                        Creator
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  {/* Team Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Team: {team?.teamName || "No team assigned"}
                      </span>
                    </div>

                    {team?.members && team.members.length > 0 && (
                      <div className="ml-6">
                        <div className="flex flex-wrap gap-1">
                          {team.members.slice(0, 3).map((member: string, idx: number) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded">
                              {getEmployeeName(member)}
                            </span>
                          ))}
                          {team.members.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
                              +{team.members.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600 dark:text-gray-400">Start:</span>
                      <span className="text-gray-900 dark:text-white">{project.startDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-red-500" />
                      <span className="text-gray-600 dark:text-gray-400">Deadline:</span>
                      <span className="text-gray-900 dark:text-white">{project.deadline}</span>
                    </div>
                  </div>

                  {/* Creator Info */}
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Created by: {getEmployeeNameById(project.created_by)}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      {project.created_by === user?.uid && (
                        <div className="flex gap-2">
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
                            className="p-1.5 rounded hover:bg-cyan-100 dark:hover:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this project?")) {
                                deleteProject.mutate(project.id);
                              }
                            }}
                            className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingProject ? "Edit Project" : "Create Project"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingProject(null);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all resize-none"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assign to Team
                </label>
                <select
                  value={formData.teamId}
                  onChange={(e) =>
                    setFormData({ ...formData, teamId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
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

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProject(null);
                  }}
                  className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProject.isLoading || updateProject.isLoading}
                  className="flex-1 px-4 py-2 text-sm bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createProject.isLoading || updateProject.isLoading
                    ? "Saving..."
                    : editingProject
                    ? "Update"
                    : "Create"}
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
