import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { format } from "date-fns";

const ViewTicket = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [projectMap, setProjectMap] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  // Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch project names
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectSnap = await getDocs(collection(db, "projects"));
        const map: { [key: string]: string } = {};
        projectSnap.forEach((docSnap) => {
          const data = docSnap.data();
          map[docSnap.id] = data.name || "Unnamed Project";
        });
        setProjectMap(map);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchProjects();
  }, []);

  // Fetch and filter tickets
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const ticketSnap = await getDocs(collection(db, "raiseTickets"));
        const allTickets: any[] = [];
        ticketSnap.forEach((docSnap) => {
          const ticketData = { id: docSnap.id, ...docSnap.data() };
          allTickets.push(ticketData);
        });

        if (userId) {
          const filtered = allTickets.filter(
            (ticket) => ticket.teamLeadId === userId
          );
          setTickets(filtered);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching tickets:", error);
        setLoading(false);
      }
    };

    if (userId) {
      fetchTickets();
    }
  }, [userId]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const ticketRef = doc(db, "raiseTickets", id);
      await updateDoc(ticketRef, {
        status: newStatus,
      });
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === id ? { ...ticket, status: newStatus } : ticket
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  if (loading || userId === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-orange-50 to-cyan-100 dark:bg-gradient-to-br dark:from-purple-900/20 dark:via-purple-800/30 dark:to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-200 dark:border-purple-400 border-t-cyan-600 dark:border-t-purple-300 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-cyan-600 dark:bg-purple-500 rounded-full"></div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-orange-50 to-cyan-100 dark:bg-gradient-to-br dark:from-purple-900/20 dark:via-purple-800/30 dark:to-purple-900/20 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-orange-500 dark:from-purple-500 dark:to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            🎫 No Tickets Found
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            No tickets are currently assigned to you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-orange-50 to-cyan-100 dark:bg-gradient-to-br dark:from-purple-900/20 dark:via-purple-800/30 dark:to-purple-900/20 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 via-orange-500 to-cyan-600 dark:from-purple-400 dark:via-purple-500 dark:to-purple-600 bg-clip-text text-transparent mb-2">
            🎫 View & Manage Tickets
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and update tickets assigned to your team
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="px-3 py-1 bg-cyan-100 dark:bg-purple-600/30 text-cyan-700 dark:text-purple-300 rounded-full font-medium">
              {tickets.length} tickets assigned
            </span>
          </div>
        </div>

        {/* Enhanced Table */}
        <div className="liquid-glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-cyan-100 to-orange-100 dark:from-purple-800/50 dark:to-purple-700/50 text-sm text-left">
                  <th className="p-4 font-semibold text-gray-700 dark:text-purple-200">🆔 Ticket ID</th>
                  <th className="p-4 font-semibold text-gray-700 dark:text-purple-200">📝 Title</th>
                  <th className="p-4 font-semibold text-gray-700 dark:text-purple-200">📄 Description</th>
                  <th className="p-4 font-semibold text-gray-700 dark:text-purple-200">⚡ Priority</th>
                  <th className="p-4 font-semibold text-gray-700 dark:text-purple-200">📅 Due Date</th>
                  <th className="p-4 font-semibold text-gray-700 dark:text-purple-200">📊 Status</th>
                  <th className="p-4 font-semibold text-gray-700 dark:text-purple-200">📋 Review</th>
                  <th className="p-4 font-semibold text-gray-700 dark:text-purple-200">🏢 Project</th>
                  <th className="p-4 font-semibold text-gray-700 dark:text-purple-200">👤 Created By</th>
                  <th className="p-4 font-semibold text-gray-700 dark:text-purple-200">🕒 Created At</th>
                  <th className="p-4 font-semibold text-gray-700 dark:text-purple-200">⚙️ Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket, index) => {
                  const getPriorityColor = (priority: string) => {
                    switch(priority?.toLowerCase()) {
                      case 'high': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
                      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
                      case 'low': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
                      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
                    }
                  };

                  const getStatusColor = (status: string) => {
                    switch(status?.toLowerCase()) {
                      case 'done': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
                      case 'in progress': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
                      case 'pending': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
                      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
                    }
                  };

                  return (
                    <tr key={ticket.id} className={`border-t border-gray-200 dark:border-purple-500/30 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                      index % 2 === 0 ? 'bg-white/50 dark:bg-gray-800/30' : 'bg-gray-50/50 dark:bg-gray-900/30'
                    }`}>
                      <td className="p-4">
                        <span className="font-mono text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                          {ticket.projectTicketId}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {ticket.title}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-600 dark:text-gray-300 max-w-xs truncate" title={ticket.description}>
                          {ticket.description}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-300">{ticket.dueDate}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-300">{ticket.review || "—"}</td>
                      <td className="p-4">
                        <span className="text-cyan-600 dark:text-purple-300 font-medium">
                          {projectMap[ticket.projectId] || "Loading..."}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-300">{ticket.createdByName}</td>
                      <td className="p-4 text-gray-600 dark:text-gray-300">
                        {ticket.createdAt?.seconds
                          ? format(
                              new Date(ticket.createdAt.seconds * 1000),
                              "dd MMM yyyy, hh:mm a"
                            )
                          : "N/A"}
                      </td>
                      <td className="p-4">
                        <select
                          className="border border-gray-200 dark:border-purple-500/30 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-purple-500 focus:border-transparent transition-all"
                          value={ticket.status}
                          onChange={(e) =>
                            handleStatusChange(ticket.id, e.target.value)
                          }
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewTicket;
