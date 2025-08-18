import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
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
import { motion } from "framer-motion";

const CustomTooltip = ({ performanceData, children }) => {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-80 whitespace-pre-line text-xs p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
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
  const { user } = useAuthStore();

  const [tasks, setTasks] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [groupedEmployees, setGroupedEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noTeam, setNoTeam] = useState(false);
  const [teamTasks, setTeamTasks] = useState({});
  const [performanceData, setPerformanceData] = useState({});
  const [monthChartData, setMonthChartData] = useState([]);
  const [dateChartData, setDateChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.uid) {
          setLoading(false);
          return;
        }

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Firebase connection timeout')), 10000)
        );

        const teamsPromise = getDocs(
          query(collection(db, "teams"), where("created_by", "==", user.uid))
        );

        const teamsSnap = await Promise.race([teamsPromise, timeoutPromise]) as any;

        if (teamsSnap.empty) {
          setEmployees([]);
          setGroupedEmployees([]);
          setNoTeam(true);
          setLoading(false);
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
        setEmployees(allEmployees);

        const taskSnap = await getDocs(collection(db, "tasks"));
        const tasksData = taskSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTasks(tasksData);
      } catch (error: any) {
        console.error("❌ Error loading data", error);

        if (error.message?.includes('Failed to fetch') ||
            error.message?.includes('timeout') ||
            error.code === 'unavailable') {
          setGroupedEmployees([]);
          setEmployees([]);
          setTasks([]);
          setNoTeam(true);
        }
      } finally {
        setLoading(false);
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

    const empReviews = empTasks
      .map((t) => t.reviewpoints)
      .filter((p) => typeof p === "number");

    const avgReviewScore =
      empReviews.length > 0
        ? empReviews.reduce((a, b) => a + b, 0) / empReviews.length
        : 0;

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

    const fetchHRFeedbackAndCalculate = async () => {
      const empId = selectedEmployee.id;
      const today = new Date();
      const dateKey = today.toISOString().split("T")[0];
      const feedbackDocId = `${empId}_${dateKey}`;

      let hrFeedbackScore = 0;

      try {
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
        hrFeedbackScore: hrFeedbackScore.toFixed(1),
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
            className="animate-spin h-8 w-8 text-cyan-500 mx-auto mb-4"
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
          <p className="text-gray-600 dark:text-gray-300 text-sm">Loading data...</p>
        </div>
      </div>
    );
  }

  if (noTeam) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-black">
        <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="mb-4">
            <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md transition-all text-sm"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const SummaryCard = ({ label, value, color = "blue", tooltip }) => {
    return (
      <div className="relative group">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">{label}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        {tooltip && (
          <div className="absolute z-10 hidden group-hover:block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg rounded-lg p-3 text-xs text-gray-800 dark:text-gray-200 w-64 mt-2">
            {tooltip}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Team Performance
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Monitor and analyze team member performance metrics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Employee List */}
          <div className="col-span-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              👥 Team Members
            </h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {groupedEmployees.map((team) => (
                <div key={team.teamId} className="mb-6">
                  <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      🏢 {team.teamName}
                    </h3>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">
                      👤 Lead: {team.teamLead}
                    </p>
                    <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                      📋 {teamTasks[team.teamId] || 0} tasks
                    </p>
                  </div>

                  <ul className="space-y-2">
                    {team.members.map((emp) => (
                      <li
                        key={emp.id}
                        onClick={() => setSelectedEmployee(emp)}
                        className={`p-3 rounded-lg cursor-pointer border transition-all duration-200 ${
                          selectedEmployee?.id === emp.id
                            ? "bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                            selectedEmployee?.id === emp.id
                              ? "bg-cyan-500 dark:bg-cyan-600"
                              : "bg-gray-400 dark:bg-gray-600"
                          }`}>
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-xs text-gray-900 dark:text-white">
                              {emp.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{emp.department}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Main Dashboard */}
          <div className="col-span-1 md:col-span-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 shadow-sm space-y-6">
            {selectedEmployee ? (
              <>
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 bg-cyan-500 dark:bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedEmployee.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedEmployee.name}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      📍 {selectedEmployee.department}
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
                    tooltip="Total tasks marked as completed by the employee."
                  />
                  <SummaryCard
                    label="Reassigned"
                    value={performanceData.reassigned}
                    tooltip="Total times tasks were reassigned from or to this employee."
                  />
                  <SummaryCard
                    label="On-Time"
                    value={`${
                      performanceData.onTime
                    } (${performanceData.onTimeRate?.toFixed(1)}%)`}
                    tooltip="Number and percentage of tasks completed before or on the due date."
                  />
                  <CustomTooltip performanceData={performanceData}>
                    <SummaryCard
                      label="Total Performance Score"
                      value={`${performanceData.totalPerformanceScore}%`}
                    />
                  </CustomTooltip>
                </div>

                {/* Completion Bars */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-300">
                    Completion Rate
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded-full">
                    <div
                      className="bg-cyan-500 dark:bg-cyan-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${performanceData.completionRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-400">
                    {performanceData.completionRate?.toFixed(1)}%
                  </p>
                </div>

                {/* Month Wise Tasks Chart */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-sm mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                    📊 Month-wise Task Summary
                  </h3>
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={monthChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="Completed" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Reassigned" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Date Wise Chart */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-sm mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                    📈 Date-wise Performance
                  </h3>
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={dateChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="Completed"
                          stroke="#06b6d4"
                          strokeWidth={2}
                          dot={{ fill: '#06b6d4', strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5, stroke: '#06b6d4', strokeWidth: 2 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Reassigned"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5, stroke: '#f59e0b', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-gray-600 dark:text-gray-400 text-center py-32 text-lg">
                Select an employee to view performance.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
