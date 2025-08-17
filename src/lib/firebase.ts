import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  limit,
  Timestamp,
  updateDoc,
  enableNetwork,
  disableNetwork,
  connectFirestoreEmulator,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC3LYpiaTwsM6VzPNjhq1972Gcki7Utd7s",
  authDomain: "examportal-39e89.firebaseapp.com",
  projectId: "examportal-39e89",
  storageBucket: "examportal-39e89.firebasestorage.app",
  messagingSenderId: "45780204594",
  appId: "1:45780204594:web:24c9b2ffaf6b0ad05f102b",
  measurementId: "G-KR98Y1EEK3",
};

// Initialize Firebase with error handling
let app: any;
let analytics: any;
let auth: any;
let db: any;

try {
  app = initializeApp(firebaseConfig);

  // Initialize analytics with error handling
  try {
    analytics = getAnalytics(app);
  } catch (analyticsError) {
    console.warn("Analytics initialization failed:", analyticsError);
    analytics = null;
  }

  auth = getAuth(app);
  db = getFirestore(app);

  // Enable offline persistence
  try {
    // This is automatically enabled in modern Firebase
    console.log("Firebase initialized successfully");
  } catch (persistenceError) {
    console.warn("Offline persistence failed:", persistenceError);
  }

} catch (error) {
  console.error("Firebase initialization failed:", error);
  throw new Error("Failed to initialize Firebase. Please check your internet connection.");
}

export { analytics, auth, db };

// Network status tracking
let isOnline = navigator.onLine;
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Listen for online/offline events
window.addEventListener('online', () => {
  isOnline = true;
  retryCount = 0;
  if (db) {
    enableNetwork(db).catch(console.warn);
  }
});

window.addEventListener('offline', () => {
  isOnline = false;
  if (db) {
    disableNetwork(db).catch(console.warn);
  }
});

// Enhanced error handling wrapper
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  fallbackValue?: T,
  operationName = 'Firebase operation'
): Promise<T> => {
  if (!isOnline && !fallbackValue) {
    throw new Error('No internet connection. Please check your network and try again.');
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      console.error(`${operationName} failed (attempt ${attempt + 1}):`, error);

      // If it's a network error and we have retries left
      if (attempt < MAX_RETRIES && isNetworkError(error)) {
        await delay(RETRY_DELAY * Math.pow(2, attempt)); // Exponential backoff
        continue;
      }

      // If we have a fallback value, use it
      if (fallbackValue !== undefined) {
        console.warn(`Using fallback value for ${operationName}`);
        return fallbackValue;
      }

      // Transform Firebase errors to user-friendly messages
      const friendlyMessage = getFriendlyErrorMessage(error);
      throw new Error(friendlyMessage);
    }
  }

  throw new Error(`${operationName} failed after ${MAX_RETRIES + 1} attempts`);
};

// Check if error is network related
const isNetworkError = (error: any): boolean => {
  const networkErrors = [
    'Failed to fetch',
    'NetworkError',
    'TypeError: Failed to fetch',
    'fetch failed',
    'network error',
    'unavailable',
    'deadline-exceeded'
  ];

  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code?.toLowerCase() || '';

  return networkErrors.some(networkError =>
    errorMessage.includes(networkError) || errorCode.includes(networkError)
  );
};

// Convert Firebase errors to user-friendly messages
const getFriendlyErrorMessage = (error: any): string => {
  const code = error?.code || '';
  const message = error?.message || '';

  // Network related errors
  if (isNetworkError(error)) {
    return 'Connection failed. Please check your internet connection and try again.';
  }

  // Firebase specific errors
  switch (code) {
    case 'permission-denied':
      return 'You do not have permission to perform this action.';
    case 'unavailable':
      return 'Service is temporarily unavailable. Please try again later.';
    case 'deadline-exceeded':
      return 'Request timed out. Please try again.';
    case 'resource-exhausted':
      return 'Too many requests. Please wait a moment and try again.';
    case 'unauthenticated':
      return 'Please log in to continue.';
    case 'not-found':
      return 'The requested data was not found.';
    case 'already-exists':
      return 'This item already exists.';
    case 'invalid-argument':
      return 'Invalid input provided. Please check your data and try again.';
    default:
      // If it's a known Firebase error but not specifically handled
      if (code.includes('firebase') || code.includes('firestore')) {
        return 'A server error occurred. Please try again later.';
      }

      // Return original message for unknown errors
      return message || 'An unexpected error occurred. Please try again.';
  }
};

// Delay utility for retries
const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  PROJECT_MANAGER: "project_manager",
  TEAM_LEAD: "team_lead",
  DEVELOPER: "developer",
  DESIGNER: "designer",
  QA: "qa",
  MARKETING: "marketing",
  SALES: "sales",
  HR: "hr",
  MEMBER: "member",
} as const;

export const DEPARTMENTS = {
  ENGINEERING: "Engineering",
  DESIGN: "Design",
  PRODUCT: "Product",
  MARKETING: "Marketing",
  SALES: "Sales",
  HR: "Human Resources",
  OPERATIONS: "Operations",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
export type Department = (typeof DEPARTMENTS)[keyof typeof DEPARTMENTS];

// Helper function to safely convert Firestore date to JS Date
const getDateFromFirestore = (date: any): Date | null => {
  if (!date) return null;
  if (date instanceof Timestamp) return date.toDate();
  if (typeof date === "string") return new Date(date);
  return null;
};

// Interfaces for dashboard data
export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  delayed: number;
}

export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export interface TeamStats {
  totalMembers: number;
  activeProjects: number;
  departmentDistribution: Record<string, number>;
  roleDistribution: Record<string, number>;
}

// User management functions
export const createNewUser = async (userData: {
  email: string;
  password: string;
  fullName: string;
  role: Role;
  department?: Department;
  permissions?: string[];
}) => {
  return withErrorHandling(async () => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    const uid = userCredential.user.uid;

    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      uid: uid,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
      department: userData.department || "",
      permissions:
        userData.permissions || getRoleDefaultPermissions(userData.role),
      createdAt: serverTimestamp(),
      status: "active",
    });

    return {
      id: uid,
      uid: uid,
      ...userData,
      status: "active",
    };
  }, undefined, 'Creating user');
};

export const updateUser = async (
  userId: string,
  userData: {
    fullName?: string;
    role?: Role;
    department?: Department;
    permissions?: string[];
    status?: string;
  }
) => {
  try {
    const userRef = doc(db, "users", userId);
    const updateData = {
      ...userData,
      updatedAt: serverTimestamp(),
    };

    if (userData.role && !userData.permissions) {
      updateData.permissions = getRoleDefaultPermissions(userData.role);
    }

    await updateDoc(userRef, updateData);
    return { id: userId, ...updateData };
  } catch (error: any) {
    console.error("Error updating user:", error);
    throw new Error(error.message || "Failed to update user");
  }
};

export const deleteUser = async (userId: string) => {
  try {
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
    return true;
  } catch (error: any) {
    console.error("Error deleting user:", error);
    throw new Error(error.message || "Failed to delete user");
  }
};

export const getUsers = async () => {
  return withErrorHandling(async () => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
    }));
  }, [], 'Fetching users');
};

export const getUsersByRole = async (role: Role) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("role", "==", role),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
    }));
  } catch (error: any) {
    console.error("Error fetching users by role:", error);
    throw new Error(error.message || "Failed to fetch users");
  }
};

// Dashboard data functions
export const getProjectStats = async (): Promise<ProjectStats> => {
  const fallbackStats = { total: 0, active: 0, completed: 0, delayed: 0 };

  return withErrorHandling(async () => {
    const projectsRef = collection(db, "projects");
    const [totalQ, activeQ, completedQ, delayedQ] = await Promise.all([
      getDocs(query(projectsRef)),
      getDocs(query(projectsRef, where("status", "==", "active"))),
      getDocs(query(projectsRef, where("status", "==", "completed"))),
      getDocs(query(projectsRef, where("status", "==", "delayed"))),
    ]);

    return {
      total: totalQ.size,
      active: activeQ.size,
      completed: completedQ.size,
      delayed: delayedQ.size,
    };
  }, fallbackStats, 'Fetching project statistics');
};

export const getTaskStats = async (): Promise<TaskStats> => {
  const fallbackStats = { total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 };

  return withErrorHandling(async () => {
    const tasksRef = collection(db, "tasks");
    const now = new Date();

    const allTasksSnapshot = await getDocs(tasksRef);
    const allTasks = allTasksSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const stats = {
      total: allTasks.length,
      pending: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
    };

    allTasks.forEach((task) => {
      switch (task.status) {
        case "pending":
          stats.pending++;
          break;
        case "in_progress":
          stats.inProgress++;
          break;
        case "completed":
          stats.completed++;
          break;
      }

      const dueDate = getDateFromFirestore(task.due_date);
      if (dueDate && dueDate < now && task.status !== "completed") {
        stats.overdue++;
      }
    });

    return stats;
  }, fallbackStats, 'Fetching task statistics');
};

export const getTeamStats = async (): Promise<TeamStats> => {
  try {
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);

    const departmentDistribution: Record<string, number> = {};
    const roleDistribution: Record<string, number> = {};
    let activeProjectsCount = 0;

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.department) {
        departmentDistribution[userData.department] =
          (departmentDistribution[userData.department] || 0) + 1;
      }
      if (userData.role) {
        roleDistribution[userData.role] =
          (roleDistribution[userData.role] || 0) + 1;
      }
      if (userData.activeProjects) {
        activeProjectsCount += userData.activeProjects;
      }
    });

    return {
      totalMembers: usersSnapshot.size,
      activeProjects: activeProjectsCount,
      departmentDistribution,
      roleDistribution,
    };
  } catch (error) {
    console.error("Error fetching team stats:", error);
    throw error;
  }
};

export const getRecentActivity = async () => {
  try {
    const logsRef = collection(db, "activity_logs");
    const q = query(logsRef, orderBy("created_at", "desc"), limit(10));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.()?.toISOString() || null,
    }));
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    throw error;
  }
};

// Helper function for default permissions
function getRoleDefaultPermissions(role: Role): string[] {
  switch (role) {
    case ROLES.SUPER_ADMIN:
      return ["all"];
    case ROLES.ADMIN:
      return [
        "manage_users",
        "manage_projects",
        "manage_settings",
        "view_reports",
      ];
    case ROLES.PROJECT_MANAGER:
      return ["manage_projects", "assign_tasks", "view_reports"];
    case ROLES.TEAM_LEAD:
      return ["manage_team", "assign_tasks", "view_team_reports"];
    case ROLES.DEVELOPER:
    case ROLES.DESIGNER:
    case ROLES.QA:
      return ["view_projects", "manage_tasks"];
    case ROLES.MARKETING:
    case ROLES.SALES:
      return ["view_projects", "manage_campaigns"];
    case ROLES.HR:
      return ["view_users", "manage_profiles"];
    default:
      return ["view_assigned"];
  }
}
