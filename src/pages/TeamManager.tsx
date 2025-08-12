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
import { Pencil, Trash2, Users, Search, UserPlus, Shield, Activity, Target } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { motion, AnimatePresence } from "framer-motion";

// Enhanced UI Components with theme
const Input = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`px-4 py-3 border border-gray-300 dark:border-purple-500/30 rounded-xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 dark:focus:ring-purple-500 focus:border-transparent transition-all ${className}`}
  />
);

const Textarea = ({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={`px-4 py-3 border border-gray-300 dark:border-purple-500/30 rounded-xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 dark:focus:ring-purple-500 focus:border-transparent transition-all resize-none ${className}`}
  />
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

const Button = ({ children, className = "", variant = 'primary', ...props }: ButtonProps) => {
  const baseClasses = "px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg";
  const variants = {
    primary: "bg-gradient-to-r from-cyan-600 to-orange-600 dark:from-purple-600 dark:to-purple-700 text-white hover:shadow-xl",
    secondary: "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600",
    danger: "bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-xl"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
};

export default function TeamManager() {
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [editId, setEditId] = useState(null);
  const { user } = useAuthStore(); // ✅ Get current user

  useEffect(() => {
    const fetchData = async () => {
      const empSnap = await getDocs(collection(db, "employees"));
      setEmployees(empSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      refreshTeams();
    };
    fetchData();
  }, []);

  const refreshTeams = async () => {
    const teamSnap = await getDocs(collection(db, "teams"));
    setTeams(teamSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const handleCreateOrUpdate = async () => {
    const payload = {
      teamName,
      description: teamDescription,
      members: selectedMembers,
      created_by: user?.uid, // ✅ Save creator UID
    };

    if (editId) {
      await updateDoc(doc(db, "teams", editId), payload);
    } else {
      const teamRef = doc(collection(db, "teams"));
      await setDoc(teamRef, payload);
    }

    resetForm();
    refreshTeams();
  };

  const resetForm = () => {
    setTeamName("");
    setTeamDescription("");
    setSelectedMembers([]);
    setEditId(null);
    setSearch("");
  };

  const handleEdit = (team) => {
    setTeamName(team.teamName);
    setTeamDescription(team.description || "");
    setSelectedMembers(team.members || []);
    setEditId(team.id);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "teams", id));
    refreshTeams();
  };

  const toggleMember = (id) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(search.toLowerCase())
  );

  const getEmployeeName = (id) =>
    employees.find((e) => e.id === id)?.name || "Unknown";

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-orange-50 to-cyan-100 dark:bg-gradient-to-br dark:from-purple-900/20 dark:via-purple-800/30 dark:to-purple-900/20 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-orange-500 dark:from-purple-500 dark:to-purple-600 shadow-lg"
            >
              <Users className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 via-orange-500 to-cyan-600 dark:from-purple-400 dark:via-purple-500 dark:to-purple-600 bg-clip-text text-transparent mb-2">
                Team Manager
              </h1>
              <p className="text-gray-600 dark:text-gray-400 flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Create and manage your project teams
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center space-x-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg"
            >
              <Activity className="h-5 w-5 text-cyan-500 dark:text-purple-400" />
              <span className="font-semibold text-gray-900 dark:text-white">
                {teams.length} Teams
              </span>
            </motion.div>
          </div>
        </motion.div>

        {/* Team Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass-card"
        >
          <div className="flex items-center mb-6">
            <UserPlus className="h-6 w-6 text-cyan-500 dark:text-purple-400 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {editId ? "Edit Team" : "Create New Team"}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-300">Team Name</label>
                <Input
                  placeholder="Enter team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-300">Description</label>
                <Textarea
                  placeholder="Describe the team's purpose and goals"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Search & Select Members
              </label>
              <div className="relative mb-4">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search employees..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="border border-gray-300 dark:border-purple-500/30 rounded-xl max-h-[300px] overflow-y-auto bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <AnimatePresence>
                  {filteredEmployees.map((emp, index) => {
                    const isSelected = selectedMembers.includes(emp.id);
                    return (
                      <motion.div
                        key={emp.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => toggleMember(emp.id)}
                        className={`p-4 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-all hover:bg-cyan-50 dark:hover:bg-purple-900/30 flex justify-between items-center ${
                          isSelected ? "bg-cyan-100 dark:bg-purple-900/50 border-l-4 border-cyan-500 dark:border-purple-500" : ""
                        }`}
                      >
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{emp.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {emp.title}
                          </div>
                        </div>
                        {isSelected && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="px-3 py-1 bg-cyan-500 dark:bg-purple-500 text-white text-xs rounded-full font-medium"
                          >
                            Selected
                          </motion.span>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {filteredEmployees.length === 0 && (
                  <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No employees found.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button onClick={handleCreateOrUpdate} variant="primary">
              <Target className="w-5 h-5" />
              {editId ? "Update Team" : "Create Team"}
            </Button>
            {editId && (
              <Button onClick={resetForm} variant="secondary">
                Cancel
              </Button>
            )}
          </div>
        </motion.div>

        {/* Team List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="liquid-glass-card"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Active Teams</h3>
            <span className="px-3 py-1 bg-cyan-100 dark:bg-purple-900/30 text-cyan-700 dark:text-purple-300 rounded-full text-sm font-medium">
              {teams.length} teams
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-purple-500/30">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-cyan-100 to-orange-100 dark:from-purple-900/50 dark:to-purple-800/50">
                  <tr>
                    <th className="text-left px-6 py-4 font-bold text-gray-900 dark:text-white">Team</th>
                    <th className="text-left px-6 py-4 font-bold text-gray-900 dark:text-white">Description</th>
                    <th className="text-left px-6 py-4 font-bold text-gray-900 dark:text-white">Members</th>
                    <th className="text-left px-6 py-4 font-bold text-gray-900 dark:text-white">Created By</th>
                    <th className="text-left px-6 py-4 font-bold text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800/50">
                  <AnimatePresence>
                    {teams.map((team, index) => (
                      <motion.tr
                        key={team.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900 dark:text-white">{team.teamName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-600 dark:text-gray-300 max-w-xs truncate">{team.description}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {team.members?.slice(0, 3).map((id) => {
                              const emp = employees.find((e) => e.id === id);
                              return emp ? (
                                <span key={id} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-700 dark:text-gray-300">
                                  {emp.name}
                                </span>
                              ) : null;
                            })}
                            {team.members && team.members.length > 3 && (
                              <span className="px-2 py-1 bg-cyan-100 dark:bg-purple-900/30 text-xs rounded-full text-cyan-700 dark:text-purple-300">
                                +{team.members.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-600 dark:text-gray-300 text-sm">
                            {getEmployeeName(team.created_by)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {team.created_by === user?.uid && (
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => handleEdit(team)}
                                variant="secondary"
                                className="p-2"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => handleDelete(team.id)}
                                variant="danger"
                                className="p-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {teams.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-500 dark:text-gray-400 py-12">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <div className="font-medium mb-2">No teams created yet</div>
                        <div className="text-sm">Create your first team to get started</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
