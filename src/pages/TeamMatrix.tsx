import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  // ... other imports if needed
} from "firebase/firestore";

import { db } from "../lib/firebase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { useAuthStore } from "../store/authStore";
import { ConnectionStatus } from "../components/ConnectionStatus";
const CustomTooltip = ({ performanceData, children }) => {
  const [show, setShow] = useState(false);

  console.log("Tooltip performanceData:", performanceData); // Debugging

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-[320px] whitespace-pre-line text-sm p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl">
          <div className="font-semibold mb-2">
            ⭐️ Performance Score Breakdown
          </div>
          <div className="space-y-1 text-gray-800 dark:text-gray-200">
            <p>
              🟦 <strong>Productivity Score:</strong>{" "}
              {performanceData?.productivityScore ?? "0"} / 100
            </p>
            <p>
              🟩 <strong>Completion Rate:</strong>{" "}
              {performanceData?.completionRate?.toFixed(1) ?? "0.0"}% / 100%
            </p>
            <p>
              🟨 <strong>On-Time Delivery:</strong>{" "}
              {performanceData?.onTimeRate?.toFixed(1) ?? "0.0"}% / 100%
            </p>
            <p>
              🟪 <strong>Review Score:</strong>{" "}
              {performanceData?.reviewScore ?? "0"} / 100
            </p>
            <p>
              🔵 <strong>HR Score:</strong>{" "}
              {performanceData?.hrFeedbackScore !== undefined
                ? Number(performanceData.hrFeedbackScore).toFixed(1)
                : "0.0"}{" "}
              / 100
            </p>
          </div>
          <hr className="my-2" />
          <p className="font-bold text-gray-900 dark:text-white">
            🏁 Final Score: {performanceData?.totalPerformanceScore ?? "0"}% /
            100%
          </p>
        </div>
      )}
    </div>
  );
};
export default function EmployeePerformancePage() {
  const { user } = useAuthStore(); // ✅ Move this here

  const [tasks, setTasks] = useState([]);
  //const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [groupedEmployees, setGroupedEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noTeam, setNoTeam] = useState(false);
  const [teamTasks, setTeamTasks] = useState({});

  //const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [performanceData, setPerformanceData] = useState({});
  const [monthChartData, setMonthChartData] = useState([]);
  const [dateChartData, setDateChartData] = useState([]);
  console.log("👤 Current user from store:", user);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🔥 useEffect triggered");
        console.log("👤 Current user:", user);

        if (!user?.uid) {
          console.warn("⚠️ User UID not available yet");
          setLoading(false);
          return;
        }

        // Add timeout to detect connection issues
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Firebase connection timeout')), 10000)
        );

        const teamsPromise = getDocs(
          query(collection(db, "teams"), where("created_by", "==", user.uid))
        );

        const teamsSnap = await Promise.race([teamsPromise, timeoutPromise]) as any;

        if (teamsSnap.empty) {
          console.warn("❌ No teams found for this user");
          setEmployees([]);
          setGroupedEmployees([]);
          setNoTeam(true); // 👈
          setLoading(false); // 👈
          return;
        }

        const empSnap = await getDocs(collection(db, "employees"));
        const allEmployees = empSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const grouped = teamsSnap.docs.map((teamDoc) => {
          const teamData = teamDoc.data();
          const memberIds = teamData.members || [];

          const members = allEmployees.filter((emp) =>
            memberIds.includes(emp.id)
          );

          const lead = allEmployees.find(
            (emp) => emp.id === teamData.created_by
          );

          return {
            teamId: teamDoc.id,
            teamName: teamData.teamName || "Unnamed Team",
            teamLead: lead?.name || "Unknown Lead",
            members,
          };
        });

        setGroupedEmployees(grouped);
        // 🔢 Fetch task count per team
        const tasksSnap = await getDocs(collection(db, "tasks"));
        const allTasks = tasksSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const taskCounts = {};

        grouped.forEach((team) => {
          const taskCount = allTasks.filter(
            (task) => task.teamId === team.teamId
          ).length;
          taskCounts[team.teamId] = taskCount;
        });

        setTeamTasks(taskCounts);

        const flatEmployees = grouped.flatMap((g) => g.members);
        setEmployees(allEmployees); // 🔁 Use full list for lookups

        const taskSnap = await getDocs(collection(db, "tasks"));
        const tasksData = taskSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTasks(tasksData);
      } catch (error: any) {
        console.error("❌ Error loading data", error);

        // Provide fallback data for offline/connection issues
        if (error.message?.includes('Failed to fetch') ||
            error.message?.includes('timeout') ||
            error.code === 'unavailable') {
          console.warn("🔌 Firebase connection issue detected, using fallback data");

          // Set fallback empty state with message
          setGroupedEmployees([]);
          setEmployees([]);
          setTasks([]);
          setNoTeam(true);
        }
      } finally {
        setLoading(false); // 👈 Ensure it ends
      }
    };

    fetchData();
  }, [user?.uid]);

  useEffect(() => {
    if (!selectedEmployee || tasks.length === 0) return;

    const empTasks = tasks.filter(
      (task) => task.assigned_to === selectedEmployee.id
    );

    const perf = {
      total: empTasks.length,
      completed: 0,
      onTime: 0,
      reassigned: 0,
    };

    const dateMap = {};
    const monthMap = {};

    empTasks.forEach((task) => {
      const {
        progress_status,
        due_date,
        progress_updated_at,
        reassign_history = [],
      } = task;

      const completeDate = progress_updated_at?.toDate?.() || new Date();
      const dateKey = completeDate.toISOString().split("T")[0];
      const monthKey = completeDate.toISOString().slice(0, 7);

      if (!monthMap[monthKey])
        monthMap[monthKey] = { Completed: 0, Reassigned: 0 };
      if (!dateMap[dateKey]) dateMap[dateKey] = { Completed: 0, Reassigned: 0 };

      if (progress_status === "completed") {
        perf.completed++;

        const due = new Date(due_date);
        if (completeDate <= due) {
          perf.onTime++;
        }

        dateMap[dateKey].Completed++;
        monthMap[monthKey].Completed++;
      }

      if (reassign_history.length > 0) {
        const count = reassign_history.length;
        perf.reassigned += count;
        dateMap[dateKey].Reassigned += count;
        monthMap[monthKey].Reassigned += count;
      }
    });

    const completionRate = (perf.completed / perf.total) * 100 || 0;
    const onTimeRate =
      perf.completed > 0 ? (perf.onTime / perf.completed) * 100 : 0;

    const team = groupedEmployees.find((g) =>
      g.members.some((m) => m.id === selectedEmployee.id)
    );

    const peerMembers =
      team?.members?.filter((m) => m.id !== selectedEmployee.id) || [];
    const peerTasks = tasks.filter((t) =>
      peerMembers.some((m) => m.id === t.assigned_to)
    );

    const avgWorkload =
      peerMembers.length > 0 ? peerTasks.length / peerMembers.length : 0;

    let penalty = perf.reassigned * 0.5; // 🔁 Each reassigned task deducts 0.5%

    // 👇 Move reviewScore calculation here
    const empReviews = empTasks
      .map((t) => t.reviewpoints)
      .filter((p) => typeof p === "number");

    const avgReviewScore =
      empReviews.length > 0
        ? empReviews.reduce((a, b) => a + b, 0) / empReviews.length
        : 0;

    // 👇 Move productivity calculation here
    const empProductivity = empTasks
      .map((task) => {
        const assignedAt = task.created_at?.toDate?.();
        const dueAt = new Date(task.due_date);
        const completedAt = task.progress_updated_at?.toDate?.();

        if (!assignedAt || !dueAt || !completedAt) return null;

        const totalTime = dueAt.getTime() - assignedAt.getTime();
        const timeLeft = dueAt.getTime() - completedAt.getTime();
        const timeOverdue = completedAt.getTime() - dueAt.getTime();

        if (completedAt <= dueAt) {
          const leftRatio = timeLeft / totalTime;
          if (leftRatio >= 0.5) return 100;
          if (leftRatio >= 0 && leftRatio < 0.1) return 70;
          return 60;
        } else {
          const overdueRatio = timeOverdue / totalTime;
          if (overdueRatio <= 0.1) return 50;
          if (overdueRatio <= 0.5) return 30;
          return 10;
        }
      })
      .filter((s) => s !== null);

    const avgProductivityScore =
      empProductivity.length > 0
        ? empProductivity.reduce((a, b) => a + b, 0) / empProductivity.length
        : 0;

    // ✅ Now safe to use these in score calculation
    const fetchHRFeedbackAndCalculate = async () => {
      const empId = selectedEmployee.id;
      const today = new Date();
      const dateKey = today.toISOString().split("T")[0]; // YYYY-MM-DD
      const feedbackDocId = `${empId}_${dateKey}`;

      let hrFeedbackScore = 0;

      try {
        // Add timeout for HR feedback fetch
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('HR feedback fetch timeout')), 5000)
        );

        const hrDocRef = doc(db, "HR_feedback", feedbackDocId);
        const hrDocPromise = getDoc(hrDocRef);

        const hrDocSnap = await Promise.race([hrDocPromise, timeoutPromise]) as any;

        if (hrDocSnap.exists()) {
          const data = hrDocSnap.data();
          if (typeof data.score === "number") {
            hrFeedbackScore = data.score;
          }
        }
      } catch (error: any) {
        console.warn("Failed to fetch HR feedback (using default score 0):", error.message);
        // Keep hrFeedbackScore as 0 for fallback
      }

      const hrWeighted = hrFeedbackScore * 0.1;

      const totalPerformanceScore = Math.max(
        (
          avgProductivityScore * 0.2 +
          completionRate * 0.25 +
          onTimeRate * 0.25 +
          avgReviewScore * 0.2 +
          hrWeighted
        ).toFixed(2),
        0
      );

      setPerformanceData({
        ...perf,
        completionRate,
        onTimeRate,
        workloadComparison: {
          employee: perf.total,
          average: avgWorkload.toFixed(1),
        },
        reviewScore: avgReviewScore.toFixed(1),
        productivityScore: avgProductivityScore.toFixed(1),
        hrFeedbackScore: hrFeedbackScore.toFixed(1), // important for tooltip
        totalPerformanceScore,
      });

      const dateData = Object.entries(dateMap).map(([date, val]) => ({
        date,
        ...val,
      }));

      const monthData = Object.entries(monthMap).map(([month, val]) => ({
        month,
        ...val,
      }));

      setDateChartData(dateData);
      setMonthChartData(monthData);
    };

    fetchHRFeedbackAndCalculate();
  }, [selectedEmployee, tasks, groupedEmployees]);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <svg
            className="animate-spin h-10 w-10 text-blue-500 mx-auto mb-4"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading data...</p>
        </div>
      </div>
    );
  }

  if (noTeam) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-cyan-50 via-orange-50 to-cyan-100 dark:bg-gradient-to-br dark:from-purple-900/20 dark:via-purple-800/30 dark:to-purple-900/20">
        <div className="text-center p-8 bg-white/90 dark:bg-black/95 rounded-xl border-2 border-cyan-200/50 dark:border-purple-500/50 shadow-2xl backdrop-blur-sm">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg font-semibold mb-2">
            No Team Data Available
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            This could be because you are not a team leader, or there may be a connection issue. Please check your internet connection and try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 dark:from-purple-500 dark:to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
  const SummaryCard = ({ label, value, color = "blue", tooltip }) => {
    const colorMap = {
      blue: "text-blue-600",
      green: "text-green-600",
      yellow: "text-yellow-600",
    };

    return (
      <div className="relative group">
        <div className="bg-gradient-to-r from-cyan-100 to-orange-100 dark:bg-gradient-to-r dark:from-purple-900/80 dark:to-purple-800/80 rounded-xl shadow-lg p-4 border-2 border-cyan-300/50 dark:border-purple-500/50 cursor-default hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
          <p className="text-sm text-gray-700 dark:text-purple-200 font-semibold">{label}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white drop-shadow-sm">{value}</p>
        </div>
        {tooltip && (
          <div className="absolute z-10 hidden group-hover:block bg-white/95 dark:bg-purple-900/95 border-2 border-cyan-300/50 dark:border-purple-500/80 shadow-xl rounded-lg p-3 text-xs text-gray-800 dark:text-purple-100 w-64 mt-2 backdrop-blur-sm">
            {tooltip}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 min-h-screen bg-gradient-to-br from-cyan-50 via-orange-50 to-cyan-100 dark:bg-gradient-to-br dark:from-purple-900/20 dark:via-purple-800/30 dark:to-purple-900/20">
        {/* Enhanced Employee List */}
        <div className="col-span-1 bg-white/90 dark:bg-black/95 backdrop-blur-sm rounded-xl border-2 border-cyan-200/50 dark:border-purple-500/50 shadow-2xl p-6 overflow-y-auto h-[85vh]">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            👥 Team Members
          </h2>
          <div className="space-y-4">
            {groupedEmployees.map((team) => (
              <div key={team.teamId} className="mb-6">
                <div className="mb-3 p-4 bg-gradient-to-r from-cyan-100 to-orange-100 dark:bg-gradient-to-r dark:from-purple-900/90 dark:to-purple-800/90 rounded-xl border-2 border-cyan-300/50 dark:border-purple-500/60 shadow-lg backdrop-blur-sm">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2 drop-shadow-sm">
                    🏢 Team: {team.teamName}
                  </h3>
                  <p className="text-xs text-gray-700 dark:text-purple-200 mb-1 font-medium">
                    👤 Lead: {team.teamLead}
                  </p>
                  <p className="text-xs text-cyan-600 dark:text-purple-300 font-semibold">
                    📋 {teamTasks[team.teamId] || 0} tasks
                  </p>
                </div>

                <ul className="space-y-2">
                  {team.members.map((emp) => (
                    <li
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp)}
                      className={`p-3 rounded-xl cursor-pointer border-2 transition-all duration-200 ${
                        selectedEmployee?.id === emp.id
                          ? "bg-gradient-to-r from-cyan-200 to-orange-200 dark:bg-gradient-to-r dark:from-purple-800/90 dark:to-purple-700/90 border-cyan-500 dark:border-purple-400 shadow-lg transform scale-105 ring-2 ring-cyan-400/50 dark:ring-purple-400/50 backdrop-blur-sm"
                          : "bg-white/80 dark:bg-gray-900/70 border-cyan-300/50 dark:border-purple-600/50 hover:bg-cyan-100 dark:hover:bg-purple-900/60 hover:border-cyan-400 dark:hover:border-purple-500 backdrop-blur-sm"
                      }`}
                    >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                            selectedEmployee?.id === emp.id
                              ? "bg-gradient-to-r from-cyan-500 to-orange-500 dark:from-purple-500 dark:to-purple-600"
                              : "bg-gray-400 dark:bg-gray-600"
                          }`}>
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">
                              {emp.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{emp.department}</p>
                          </div>
                          {selectedEmployee?.id === emp.id && (
                            <div className="w-2 h-2 bg-cyan-500 dark:bg-purple-400 rounded-full animate-pulse"></div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
      </div>

          {/* Enhanced Main Dashboard */}
          <div className="col-span-1 md:col-span-3 bg-white/90 dark:bg-black/95 backdrop-blur-sm rounded-xl border-2 border-cyan-200/50 dark:border-purple-500/50 shadow-2xl p-6 space-y-6">
        {selectedEmployee ? (
          <>
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-cyan-100 to-orange-100 dark:bg-gradient-to-r dark:from-purple-900/80 dark:to-purple-800/80 rounded-xl border-2 border-cyan-300/50 dark:border-purple-500/50 shadow-lg backdrop-blur-sm">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-orange-500 dark:from-purple-500 dark:to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {selectedEmployee.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedEmployee.name}
                </h2>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  �� {selectedEmployee.department}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard
                label="Tasks Assigned"
                value={performanceData.total}
                tooltip="Total number of tasks assigned to this employee."
              />
              <SummaryCard
                label="Tasks Completed"
                value={performanceData.completed}
                color="green"
                tooltip="Total tasks marked as completed by the employee."
              />
              <SummaryCard
                label="Reassigned"
                value={performanceData.reassigned}
                color="yellow"
                tooltip="Total times tasks were reassigned from or to this employee."
              />
              <SummaryCard
                label="On-Time"
                value={`${
                  performanceData.onTime
                } (${performanceData.onTimeRate?.toFixed(1)}%)`}
                color="blue"
                tooltip="Number and percentage of tasks completed before or on the due date."
              />
              <CustomTooltip performanceData={performanceData}>
                <SummaryCard
                  label="Total Performance Score"
                  value={`${performanceData.totalPerformanceScore}%`}
                  color="blue"
                />
              </CustomTooltip>
            </div>

            {/* Completion Bars */}
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-300">
                Completion Rate
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-800 h-4 rounded-full shadow-inner">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 dark:from-purple-500 dark:to-purple-600 h-4 rounded-full shadow-lg transition-all duration-500"
                  style={{ width: `${performanceData.completionRate}%` }}
                />
              </div>
              <p className="text-xs text-gray-700 dark:text-purple-300">
                {performanceData.completionRate?.toFixed(1)}%
              </p>
            </div>

            {/* Month Wise Tasks Chart */}
            <div className="relative bg-gradient-to-br from-orange-50/90 via-cyan-50/80 to-orange-100/90 dark:bg-gradient-to-br dark:from-indigo-900/90 dark:via-purple-800/85 dark:to-purple-900/90 p-6 rounded-2xl border-2 border-orange-200/60 dark:border-purple-500/60 shadow-xl dark:shadow-purple-900/40 backdrop-blur-md overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-purple-400/5 dark:to-indigo-600/10 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-orange-300/20 to-cyan-300/20 dark:from-indigo-500/20 dark:to-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

              <h3 className="relative font-bold text-lg mb-6 text-gray-900 dark:text-white flex items-center gap-2 drop-shadow-sm">
                📊 Month-wise Task Summary
              </h3>
              <div className="relative bg-white/70 dark:bg-black/30 rounded-xl p-4 border border-orange-200/30 dark:border-purple-500/30 backdrop-blur-sm">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-purple-500/30" />
                    <XAxis dataKey="month" stroke="#6b7280" className="dark:stroke-purple-300" />
                    <YAxis stroke="#6b7280" className="dark:stroke-purple-300" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      className="dark:[&>div]:!bg-purple-900/95 dark:[&>div]:!border-purple-500/50 dark:[&>div]:!text-white"
                    />
                    <Legend />
                    <Bar dataKey="Completed" fill="#06b6d4" className="dark:fill-purple-500" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Reassigned" fill="#fb923c" className="dark:fill-purple-400" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Date Wise Chart */}
            <div className="relative bg-gradient-to-br from-orange-50/90 via-cyan-50/80 to-orange-100/90 dark:bg-gradient-to-br dark:from-indigo-900/90 dark:via-purple-800/85 dark:to-purple-900/90 p-6 rounded-2xl border-2 border-orange-200/60 dark:border-purple-500/60 shadow-xl dark:shadow-purple-900/40 backdrop-blur-md overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-purple-400/5 dark:to-indigo-600/10 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-orange-300/20 to-cyan-300/20 dark:from-indigo-500/20 dark:to-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

              <h3 className="relative font-bold text-lg mb-6 text-gray-900 dark:text-white flex items-center gap-2 drop-shadow-sm">
                📈 Date-wise Performance
              </h3>
              <div className="relative bg-white/70 dark:bg-black/30 rounded-xl p-4 border border-orange-200/30 dark:border-purple-500/30 backdrop-blur-sm">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dateChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-purple-500/30" />
                    <XAxis dataKey="date" stroke="#6b7280" className="dark:stroke-purple-300" />
                    <YAxis stroke="#6b7280" className="dark:stroke-purple-300" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      className="dark:[&>div]:!bg-purple-900/95 dark:[&>div]:!border-purple-500/50 dark:[&>div]:!text-white"
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Completed"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      className="dark:stroke-purple-400"
                      dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#06b6d4', strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Reassigned"
                      stroke="#fb923c"
                      strokeWidth={3}
                      className="dark:stroke-purple-300"
                      dot={{ fill: '#fb923c', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#fb923c', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Task Detail Table */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                📋 Detailed Task Information
              </h3>
              <div className="overflow-x-auto max-h-[400px] border border-cyan-200/50 dark:border-purple-500/50 rounded-xl shadow-inner bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <table className="min-w-full divide-y divide-cyan-200/50 dark:divide-purple-500/50 text-sm">
                  <thead className="bg-gradient-to-r from-cyan-200 to-orange-200 dark:bg-gradient-to-r dark:from-purple-900/90 dark:to-purple-800/90 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                        Ticket ID
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                        Title
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                        Description
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                        Due Date
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                        Created At
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                        Updated At
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                        Reassigned
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                        Completion Status
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                        Created By
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                        Review
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                        Productivity
                      </th>

                      <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                        Comments
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-200/50 dark:divide-purple-500/30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                    {tasks
                      .filter((t) => t.assigned_to === selectedEmployee.id)
                      .map((task) => (
                        <tr key={task.id} className="hover:bg-cyan-100/50 dark:hover:bg-purple-900/40 transition-colors duration-200">
                          <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                            {task.task_id}
                          </td>

                          <td className="px-4 py-2 text-gray-800 dark:text-gray-200">
                            {task.title}
                          </td>
                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                            {task.description || "-"}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                task.progress_status === "completed"
                                  ? "bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-400"
                                  : "bg-yellow-100 dark:bg-yellow-900/60 text-yellow-700 dark:text-yellow-400"
                              }`}
                            >
                              {task.progress_status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                            {task.due_date || "-"}
                          </td>
                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                            {task.created_at?.toDate?.().toLocaleString() ||
                              "-"}
                          </td>
                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                            {task.progress_updated_at
                              ?.toDate?.()
                              .toLocaleString() || "-"}
                          </td>
                          <td className="px-4 py-2 text-center text-gray-800 dark:text-gray-200">
                            {task.reassign_history?.length || 0}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium">
                            {(() => {
                              const due = new Date(task.due_date);
                              const completed =
                                task.progress_updated_at?.toDate?.();
                              if (!completed || isNaN(due)) return "-";

                              // Strip time for date-only comparison
                              const dueDate = new Date(
                                due.getFullYear(),
                                due.getMonth(),
                                due.getDate()
                              );
                              const completeDate = new Date(
                                completed.getFullYear(),
                                completed.getMonth(),
                                completed.getDate()
                              );

                              const diffTime =
                                completeDate.getTime() - dueDate.getTime();
                              const diffDays = Math.floor(
                                diffTime / (1000 * 60 * 60 * 24)
                              );

                              if (diffDays < 0) {
                                return (
                                  <span className="text-green-600 font-medium">
                                    Early by {Math.abs(diffDays)} day
                                    {Math.abs(diffDays) !== 1 ? "s" : ""}
                                  </span>
                                );
                              } else if (diffDays === 0) {
                                return (
                                  <span className="text-gray-700 font-medium">
                                    On Time
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="text-red-600 font-semibold">
                                    Delayed by {diffDays} day
                                    {diffDays !== 1 ? "s" : ""}
                                  </span>
                                );
                              }
                            })()}
                          </td>
                          <td className="px-4 py-2 text-gray-800 dark:text-gray-300 text-sm">
                            {(() => {
                              const creator = employees.find(
                                (emp) =>
                                  emp.id?.trim() === task.created_by?.trim()
                              );
                              return creator?.name || task.created_by || "-";
                            })()}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center space-x-2">
                              {/* Status badge */}
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  task.status === "completed"
                                    ? "bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-400"
                                    : "bg-yellow-100 dark:bg-yellow-900/60 text-yellow-700 dark:text-yellow-400"
                                }`}
                              >
                                {task.status}
                              </span>

                              {/* Small score beside status */}
                              <span className="text-xs text-gray-500">
                                {task.reviewpoints} / 100
                              </span>
                            </div>

                            {/* Star rating below */}
                            <div className="flex mt-1">
                              {Array.from({ length: 5 }).map((_, index) => {
                                const isFilled =
                                  task.reviewpoints >= (index + 1) * 20;
                                return (
                                  <svg
                                    key={index}
                                    className={`w-4 h-4 ${
                                      isFilled
                                        ? "text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.948a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.36 2.443a1 1 0 00-.364 1.118l1.287 3.948c.3.921-.755 1.688-1.538 1.118l-3.36-2.443a1 1 0 00-1.175 0l-3.36 2.443c-.783.57-1.838-.197-1.538-1.118l1.287-3.948a1 1 0 00-.364-1.118L2.075 9.375c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.948z" />
                                  </svg>
                                );
                              })}
                            </div>
                          </td>

                          <td className="px-4 py-2 text-sm font-semibold">
                            {(() => {
                              const assignedAt = task.created_at?.toDate?.();
                              const dueAt = new Date(task.due_date);
                              const completedAt =
                                task.progress_updated_at?.toDate?.();

                              if (!assignedAt || !dueAt || !completedAt)
                                return "-";

                              const totalTime =
                                dueAt.getTime() - assignedAt.getTime();
                              const timeLeft =
                                dueAt.getTime() - completedAt.getTime();
                              const timeOverdue =
                                completedAt.getTime() - dueAt.getTime();

                              let score = "-";
                              let explanation = "";

                              if (completedAt <= dueAt) {
                                const leftRatio = timeLeft / totalTime;
                                if (leftRatio >= 0.5) {
                                  score = 100;
                                  explanation = `Task completed early — approximately ${(
                                    timeLeft /
                                    (1000 * 60 * 60)
                                  ).toFixed(
                                    1
                                  )} hours ahead of schedule.\nMore than 50% of the time was left unused, reflecting excellent time management.`;
                                } else if (leftRatio >= 0 && leftRatio < 0.1) {
                                  score = 70;
                                  explanation = `Task was completed just before the deadline with ~${(
                                    leftRatio * 100
                                  ).toFixed(
                                    1
                                  )}% of time remaining.\nThis shows timely execution with minimal buffer.`;
                                } else {
                                  explanation = `Task completed on time but with less than 10% of the total time remaining.\nNo penalty, but little margin left — consider earlier completion next time.`;
                                }
                              } else {
                                const overdueRatio = timeOverdue / totalTime;
                                if (overdueRatio <= 0.1) {
                                  score = 50;
                                  explanation = `Task completed slightly late — by ${(
                                    timeOverdue /
                                    (1000 * 60 * 60)
                                  ).toFixed(1)} hours (~${(
                                    overdueRatio * 100
                                  ).toFixed(
                                    1
                                  )}% past deadline).\nMinor delay, but still acceptable.`;
                                } else if (overdueRatio <= 0.5) {
                                  score = 30;
                                  explanation = `Task moderately late by ${(
                                    timeOverdue /
                                    (1000 * 60 * 60)
                                  ).toFixed(1)} hours (~${(
                                    overdueRatio * 100
                                  ).toFixed(
                                    1
                                  )}% overdue).\nShows room for improvement in time handling.`;
                                } else {
                                  score = 10;
                                  explanation = `Task completed severely late by ${(
                                    timeOverdue /
                                    (1000 * 60 * 60)
                                  ).toFixed(1)} hours (~${(
                                    overdueRatio * 100
                                  ).toFixed(
                                    1
                                  )}% beyond deadline).\nSignificant delay — strongly affects productivity score.`;
                                }
                              }

                              const colorClass =
                                score === 100
                                  ? "text-green-600"
                                  : score === 70
                                  ? "text-yellow-600"
                                  : score === 50
                                  ? "text-orange-500"
                                  : score === 30
                                  ? "text-yellow-800"
                                  : score === 10
                                  ? "text-red-600"
                                  : "text-gray-600";

                              return (
                                <div className="relative group cursor-pointer inline-block">
                                  <span className={`${colorClass}`}>
                                    {score}
                                  </span>
                                  <div className="absolute z-50 hidden group-hover:block bg-white/95 dark:bg-gray-800/95 border-2 border-cyan-300/50 dark:border-gray-600 shadow-lg rounded-lg px-4 py-2 text-xs max-w-xs w-fit min-w-[200px] whitespace-pre-wrap left-1/2 -translate-x-1/2 top-full mt-2 transition-all duration-200">
                                    {explanation}
                                  </div>
                                </div>
                              );
                            })()}
                          </td>

                          <td className="px-4 py-2 text-gray-700 dark:text-gray-400">
                            {task.comments?.length > 0 ? (
                              <div className="relative group cursor-pointer">
                                <span className="underline text-blue-500">
                                  {task.comments.length} comment(s)
                                </span>
                                <div className="absolute z-20 hidden group-hover:block bg-white/95 dark:bg-gray-800/95 border-2 border-cyan-300/50 dark:border-gray-600 rounded shadow-lg p-2 text-xs w-64 mt-1">
                                  {task.comments.map((c, i) => (
                                    <div key={i} className="mb-1">
                                      <p className="text-gray-800 dark:text-gray-200">
                                        • {c.text}
                                      </p>
                                      <p className="text-gray-600 dark:text-gray-400 text-[10px]">
                                        {new Date(c.timestamp).toLocaleString()}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="text-gray-600 dark:text-gray-400 text-center py-32 text-lg font-medium">
            Select an employee to view performance.
          </div>
        )}
      </div>
    </div>
  );
}

const SummaryCard = ({ label, value, color = "blue" }) => {
  const colorMap = {
    blue: "text-blue-600",
    green: "text-green-600",
    yellow: "text-yellow-600",
  };

  return (
    <div className="bg-gray-50 rounded-md shadow-inner p-4 border">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-xl font-bold ${colorMap[color]}`}>{value}</p>
    </div>
  );
};
