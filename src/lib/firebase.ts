import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, createUserWithEmailAndPassword, connectAuthEmulator } from "firebase/auth";
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

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC3LYpiaTwsM6VzPNjhq1972Gcki7Utd7s",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "examportal-39e89.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "examportal-39e89",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "examportal-39e89.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "45780204594",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:45780204594:web:24c9b2ffaf6b0ad05f102b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-KR98Y1EEK3",
};

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing Firebase configuration: ${missingFields.join(', ')}`);
  }
};

// Initialize Firebase with enhanced error handling
let app: any;
let analytics: any;
let auth: any;
let db: any;

try {
  // Validate configuration first
  validateFirebaseConfig();
  
  // Initialize Firebase app
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');

  // Initialize auth with enhanced error handling
  auth = getAuth(app);
  
  // Set custom settings for better connectivity
  auth.settings = {
    appVerificationDisabledForTesting: false,
  };

  // Initialize Firestore
  db = getFirestore(app);

  // Initialize analytics with error handling (optional)
  try {
    if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
      analytics = getAnalytics(app);
      console.log('Analytics initialized successfully');
    }
  } catch (analyticsError) {
    console.warn("Analytics initialization failed:", analyticsError);
    analytics = null;
  }

  console.log('Firebase services initialized successfully');

} catch (error) {
  console.error("Firebase initialization failed:", error);
  
  // Create fallback objects to prevent app crashes
  auth = {
    currentUser: null,
    onAuthStateChanged: () => () => {},
    signInWithEmailAndPassword: () => Promise.reject(new Error('Firebase not initialized')),
    signOut: () => Promise.reject(new Error('Firebase not initialized')),
  };
  
  db = {
    collection: () => Promise.reject(new Error('Firebase not initialized')),
  };
  
  // Show user-friendly error
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      alert('Firebase connection failed. Please check your internet connection and refresh the page.');
    }, 1000);
  }
}

export { analytics, auth, db };

// Network status tracking with enhanced reliability
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Network connection restored');
    isOnline = true;
    retryCount = 0;
    if (db && typeof enableNetwork === 'function') {
      enableNetwork(db).catch(console.warn);
    }
  });

  window.addEventListener('offline', () => {
    console.log('Network connection lost');
    isOnline = false;
    if (db && typeof disableNetwork === 'function') {
      disableNetwork(db).catch(console.warn);
    }
  });
}

// Enhanced error handling wrapper with network detection
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  fallbackValue?: T,
  operationName = 'Firebase operation'
): Promise<T> => {
  // Check network connectivity first
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
        console.log(`Retrying ${operationName} in ${RETRY_DELAY * Math.pow(2, attempt)}ms...`);
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

// Enhanced network error detection
const isNetworkError = (error: any): boolean => {
  const networkErrors = [
    'failed to fetch',
    'networkerror',
    'fetch failed',
    'network error',
    'unavailable',
    'deadline-exceeded',
    'auth/network-request-failed',
    'connection failed',
    'timeout',
    'cors',
    'enetunreach',
    'enotfound',
    'econnreset',
    'econnrefused'
  ];

  const errorMessage = (error?.message || '').toLowerCase();
  const errorCode = (error?.code || '').toLowerCase();
  
  return networkErrors.some(networkError =>
    errorMessage.includes(networkError) || errorCode.includes(networkError)
  );
};

// Enhanced user-friendly error messages
const getFriendlyErrorMessage = (error: any): string => {
  const code = (error?.code || '').toLowerCase();
  const message = (error?.message || '').toLowerCase();

  // Network related errors
  if (isNetworkError(error)) {
    return 'Connection failed. Please check your internet connection and try again. If the problem persists, contact support.';
  }

  // Firebase Auth specific errors
  switch (code) {
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection and try again.';
    case 'auth/user-not-found':
      return 'No account found with this email address. Please contact your administrator.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again or reset your password.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact your administrator.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later or reset your password.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled. Please contact your administrator.';
    case 'auth/invalid-credential':
      return 'Invalid credentials provided. Please check your login details.';
    
    // Firestore errors
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
    case 'cancelled':
      return 'Operation was cancelled. Please try again.';
    case 'data-loss':
      return 'Data corruption detected. Please try again or contact support.';
    case 'internal':
      return 'Internal server error. Please try again later.';
    case 'out-of-range':
      return 'Request is out of range. Please check your input.';
    case 'unimplemented':
      return 'This feature is not available. Please contact support.';
    
    default:
      // Handle unknown errors gracefully
      if (code.includes('firebase') || code.includes('firestore') || code.includes('auth')) {
        return 'A server error occurred. Please try again later or contact support if the problem persists.';
      }

      // Return a generic message for completely unknown errors
      return message || 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }
};

// Delay utility for retries
const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

// Connection test function
export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    // Try a simple read operation to test connectivity
    if (db) {
      await getDocs(query(collection(db, 'connection-test'), limit(1)));
      console.log('Firebase connection test successful');
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Firebase connection test failed:', error);
    return false;
  }
};

// Initialize connection test on load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    testFirebaseConnection().then(isConnected => {
      if (!isConnected) {
        console.warn('Firebase connection issue detected');
      }
    });
  }, 2000);
}

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

// Enhanced user management functions with better error handling
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
  return withErrorHandling(async () => {
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
  }, undefined, 'Updating user');
};

export const deleteUser = async (userId: string) => {
  return withErrorHandling(async () => {
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
    return true;
  }, false, 'Deleting user');
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
  return withErrorHandling(async () => {
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
  }, [], 'Fetching users by role');
};

// Dashboard data functions with enhanced error handling
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
  const fallbackStats = {
    totalMembers: 0,
    activeProjects: 0,
    departmentDistribution: {},
    roleDistribution: {},
  };

  return withErrorHandling(async () => {
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
  }, fallbackStats, 'Fetching team statistics');
};

export const getRecentActivity = async () => {
  return withErrorHandling(async () => {
    const logsRef = collection(db, "activity_logs");
    const q = query(logsRef, orderBy("created_at", "desc"), limit(10));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.()?.toISOString() || null,
    }));
  }, [], 'Fetching recent activity');
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
