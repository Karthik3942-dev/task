import React, { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { useThemeStore } from "./store/themeStore";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import UserManagement from "./pages/UserManagement";
import { Toaster } from "react-hot-toast";
import MyTasks from "./pages/MyTasks";
import TeamManager from "./pages/TeamManager";
import { NetworkStatus, ErrorBoundary } from "./components/NetworkStatus";
import { ConnectionStatus } from "./components/ConnectionStatus";
//import AddUsers from "./pages/AddUsers";
import RaiseProjectTicket from "./pages/RaiseProjectTicket";
//import RaiseProjectTicket from "./pages/RaiseProjectTicket";
import ViewTasks from "./pages/ViewTasks";
import CreateTask from "./pages/CreateTask";
import TeamMatrix from "./pages/TeamMatrix";
import Performance from "./pages/Performance";
import ProjectDocCreator from "./pages/ProjectDocCreator";
import LoaderDemo from "./components/LoaderDemo";

function App() {
  const { user, loading } = useAuthStore();
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      }
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, [theme]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <NetworkStatus />
      <ConnectionStatus />
      <Toaster position="top-right" />
      <Routes>
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" />}
        />
        <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="TeamManager" element={<TeamManager />} />
          <Route path="TeamMatrix" element={<TeamMatrix />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="projects" element={<Projects />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="ViewTasks" element={<ViewTasks />} />
          <Route path="CreateTask" element={<CreateTask />} />
          <Route path="Performance" element={<Performance />} />
          <Route path="mytasks" element={<MyTasks />} />
          <Route path="RaiseProjectTicket" element={<RaiseProjectTicket />} />
          <Route path="ProjectDocCreator" element={<ProjectDocCreator />} />
          <Route path="loader-demo" element={<LoaderDemo />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
