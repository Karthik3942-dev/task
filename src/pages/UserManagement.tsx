import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export default function ProjectTasksViewer() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [employeesMap, setEmployeesMap] = useState({});
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchProjects = async () => {
      const snap = await getDocs(collection(db, "projects"));
      const projectData = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(projectData);
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      const snap = await getDocs(collection(db, "employees"));
      const empMap = {};
      snap.docs.forEach((doc) => {
        const { name } = doc.data();
        empMap[doc.id] = name;
      });
      setEmployeesMap(empMap);
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    const fetchTasks = async () => {
      const q = query(
        collection(db, "tasks"),
        where("project_id", "==", selectedProjectId)
      );
      const snap = await getDocs(q);
      const taskList = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(taskList);
    };
    fetchTasks();
  }, [selectedProjectId]);

  const getStatusColor = (status, dueDate) => {
    if (status === "completed") return "text-green-600 font-semibold";
    const due = new Date(dueDate);
    const now = new Date();
    if (due < now) return "text-red-600 font-semibold";
    return "text-gray-800";
  };

  const calculatePerformance = (createdAt, dueDate, updatedAt) => {
    if (!updatedAt || !createdAt || !dueDate) return "-";
    const start = new Date(createdAt.seconds * 1000);
    const end = new Date(dueDate);
    const done = new Date(updatedAt.seconds * 1000);
    const totalTime = end.getTime() - start.getTime();
    const usedTime = done.getTime() - start.getTime();
    if (totalTime <= 0 || usedTime <= 0) return "0%";
    const percent = ((1 - usedTime / totalTime) * 100).toFixed(1);
    return `${percent}%`;
  };

  const filteredTasks =
    statusFilter === "all"
      ? tasks
      : tasks.filter((task) => task.status === statusFilter);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">User Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Select a project to view user tasks</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm mb-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Select Project</h2>
          <div className="flex flex-wrap gap-2">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className={`px-3 py-2 rounded-md shadow-sm transition-all text-xs ${
                  selectedProjectId === project.id
                    ? "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-medium border border-cyan-200 dark:border-cyan-800"
                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                }`}
              >
                {project.name}
              </button>
            ))}
          </div>
        </div>

        {selectedProjectId && (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tasks for: {projects.find((proj) => proj.id === selectedProjectId)?.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage and review user assignments
                </p>
              </div>
              <select
                className="px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      {[
                        "#",
                        "Title",
                        "Description",
                        "Status",
                        "Assigned To",
                        "Created By",
                        "Created At",
                        "Due Date",
                        "Progress",
                        "Progress Description",
                        "Link",
                        "Updated At",
                        "Performance %",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wider"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredTasks.map((task, idx) => (
                      <tr
                        key={task.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                      >
                        <td className="px-4 py-3 text-xs text-gray-900 dark:text-white">{idx + 1}</td>
                        <td className="px-4 py-3 text-xs font-medium text-gray-900 dark:text-white">{task.title}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{task.description}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              task.status === "completed"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                            }`}
                          >
                            {task.status}
                            {task.status === "completed" && (
                              <span className="ml-1 text-green-600">✔</span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-900 dark:text-white">
                          {employeesMap[task.assigned_to] || task.assigned_to}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-900 dark:text-white">
                          {employeesMap[task.created_by] || task.created_by}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {task.created_at
                            ? new Date(
                                task.created_at.seconds * 1000
                              ).toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{task.due_date}</td>
                        <td className="px-4 py-3">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                task.progress_status === "completed"
                                  ? "bg-green-500"
                                  : "bg-cyan-500"
                              }`}
                              style={{
                                width:
                                  task.progress_status === "completed"
                                    ? "100%"
                                    : task.progress_status === "in progress"
                                    ? "50%"
                                    : "10%",
                              }}
                            ></div>
                          </div>
                          <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                            {task.progress_status}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {task.progress_description || "-"}
                        </td>
                        <td className="px-4 py-3">
                          {task.progress_link ? (
                            <a
                              href={task.progress_link}
                              className="text-xs text-cyan-600 hover:text-cyan-800 underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {task.progress_updated_at
                            ? new Date(
                                task.progress_updated_at.seconds * 1000
                              ).toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-gray-900 dark:text-white">
                          {task.status === "completed"
                            ? calculatePerformance(
                                task.created_at,
                                task.due_date,
                                task.progress_updated_at
                              )
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
