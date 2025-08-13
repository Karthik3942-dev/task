import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Plus, Edit2, Trash2, Users, Search, UserPlus, X, Save } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

function TeamManager() {
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    teamName: "",
    description: "",
    members: [],
  });

  const { user } = useAuthStore();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teamsSnapshot, employeesSnapshot] = await Promise.all([
        getDocs(collection(db, "teams")),
        getDocs(collection(db, "employees"))
      ]);

      const teamsData = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const employeesData = employeesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setTeams(teamsData);
      setEmployees(employeesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    
    if (!formData.teamName.trim()) {
      toast.error("Team name is required");
      return;
    }

    try {
      const teamData = {
        ...formData,
        createdBy: user?.uid,
        createdAt: new Date().toISOString(),
      };

      if (editingTeam) {
        await updateDoc(doc(db, "teams", editingTeam.id), teamData);
        toast.success("Team updated successfully");
      } else {
        const teamId = `team_${Date.now()}`;
        await setDoc(doc(db, "teams", teamId), teamData);
        toast.success("Team created successfully");
      }

      setShowCreateModal(false);
      setEditingTeam(null);
      setFormData({ teamName: "", description: "", members: [] });
      fetchData();
    } catch (error) {
      console.error("Error saving team:", error);
      toast.error("Failed to save team");
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm("Are you sure you want to delete this team?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "teams", teamId));
      toast.success("Team deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting team:", error);
      toast.error("Failed to delete team");
    }
  };

  const handleEditTeam = (team) => {
    setEditingTeam(team);
    setFormData({
      teamName: team.teamName || "",
      description: team.description || "",
      members: team.members || [],
    });
    setShowCreateModal(true);
  };

  const handleMemberToggle = (employeeId) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(employeeId)
        ? prev.members.filter(id => id !== employeeId)
        : [...prev.members, employeeId]
    }));
  };

  const getEmployeeName = (id) => {
    const employee = employees.find(emp => emp.id === id);
    return employee?.name || employee?.email || "Unknown";
  };

  const filteredTeams = teams.filter(team =>
    team.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-cyan-500 mx-auto mb-3"></div>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Loading teams...</p>
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
              Team Management
            </h1>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search teams..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <button
            className="flex items-center px-3 py-2 text-sm bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors"
            onClick={() => {
              setEditingTeam(null);
              setFormData({ teamName: "", description: "", members: [] });
              setShowCreateModal(true);
            }}
          >
            <Plus className="mr-1 w-4 h-4" /> Create Team
          </button>
        </div>

        {/* Teams Grid */}
        {filteredTeams.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No teams found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm ? "No teams match your search." : "Create your first team to get started."}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 text-sm bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors"
                >
                  Create Team
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTeams.map((team) => (
              <div
                key={team.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white leading-tight">
                    {team.teamName}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditTeam(team)}
                      className="p-1.5 rounded hover:bg-cyan-100 dark:hover:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {team.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {team.description}
                  </p>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {team.members?.length || 0} members
                    </span>
                  </div>

                  {team.members && team.members.length > 0 && (
                    <div>
                      <div className="flex flex-wrap gap-1">
                        {team.members.slice(0, 3).map((memberId, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded"
                          >
                            {getEmployeeName(memberId)}
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

                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Created: {team.createdAt ? new Date(team.createdAt).toLocaleDateString() : "Unknown"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingTeam ? "Edit Team" : "Create Team"}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTeam(null);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={formData.teamName}
                  onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Team Members
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-2">
                  {employees.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                      No employees available
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {employees.map((employee) => (
                        <label
                          key={employee.id}
                          className="flex items-center gap-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.members.includes(employee.id)}
                            onChange={() => handleMemberToggle(employee.id)}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {employee.name || employee.email}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTeam(null);
                  }}
                  className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors"
                >
                  <Save className="w-3 h-3" />
                  {editingTeam ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamManager;
