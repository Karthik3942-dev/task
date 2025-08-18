import { create } from 'zustand';
import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth, db, withErrorHandling } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface UserData {
  uid: string;
  email: string | null;
  role: string;
  fullName: string;
  department?: string;
  permissions: string[];
}

interface AuthState {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  connectionError: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  setUserData: (userData: UserData | null) => void;
  setConnectionError: (error: boolean) => void;
  retryConnection: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userData: null,
  loading: true,
  connectionError: false,
  
  signIn: async (email: string, password: string) => {
    try {
      set({ connectionError: false });
      
      // Add timeout for sign-in to catch hanging requests
      const signInPromise = signInWithEmailAndPassword(auth, email, password);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - please check your internet connection')), 30000)
      );
      
      const userCredential = await Promise.race([signInPromise, timeoutPromise]) as any;
      set({ user: userCredential.user });
      
      // Fetch additional user data from Firestore with error handling
      await withErrorHandling(async () => {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', userCredential.user.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data() as UserData;
          set({ userData });
        } else {
          // Create basic user data if not found
          const basicUserData: UserData = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            role: 'member',
            fullName: userCredential.user.displayName || 'User',
            permissions: ['view_assigned']
          };
          set({ userData: basicUserData });
        }
      }, undefined, 'Fetching user data');
      
      toast.success('Successfully signed in!');
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Enhanced error handling for different types of errors
      if (error.message.includes('timeout') || error.message.includes('network')) {
        set({ connectionError: true });
        toast.error('Connection timeout. Please check your internet connection and try again.');
      } else if (error.code === 'auth/network-request-failed') {
        set({ connectionError: true });
        toast.error('Network connection failed. Please check your internet connection.');
      } else if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email. Please contact your administrator.');
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Please enter a valid email address.');
      } else if (error.code === 'auth/user-disabled') {
        toast.error('This account has been disabled. Please contact your administrator.');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many failed attempts. Please try again later or reset your password.');
      } else if (error.code === 'auth/invalid-credential') {
        toast.error('Invalid credentials. Please check your email and password.');
      } else {
        toast.error(error.message || 'Login failed. Please try again.');
      }
      
      throw error;
    }
  },
  
  signOut: async () => {
    try {
      await withErrorHandling(async () => {
        await firebaseSignOut(auth);
      }, undefined, 'Signing out');
      
      set({ user: null, userData: null, connectionError: false });
      toast.success('Successfully signed out!');
    } catch (error: any) {
      console.error('Sign out error:', error);
      
      // Even if sign out fails, clear local state
      set({ user: null, userData: null });
      
      if (error.message.includes('network')) {
        toast.error('Network error during sign out. You have been signed out locally.');
      } else {
        toast.error('Sign out completed.');
      }
    }
  },
  
  setUser: (user) => set({ user, loading: false }),
  setUserData: (userData) => set({ userData }),
  setConnectionError: (error) => set({ connectionError: error }),
  
  retryConnection: async () => {
    try {
      set({ connectionError: false, loading: true });
      
      // Test connection by trying to fetch user data
      const currentUser = get().user;
      if (currentUser) {
        await withErrorHandling(async () => {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('uid', '==', currentUser.uid));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data() as UserData;
            set({ userData });
          }
        }, undefined, 'Retrying connection');
      }
      
      set({ loading: false });
      toast.success('Connection restored!');
    } catch (error) {
      console.error('Retry connection failed:', error);
      set({ connectionError: true, loading: false });
      toast.error('Connection retry failed. Please check your internet connection.');
    }
  },
}));

// Enhanced auth state listener with better error handling
onAuthStateChanged(auth, async (user) => {
  const state = useAuthStore.getState();
  
  try {
    if (user) {
      // Fetch user data when auth state changes with timeout
      await withErrorHandling(async () => {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data() as UserData;
          state.setUserData(userData);
        } else {
          // Create basic user data if not found
          const basicUserData: UserData = {
            uid: user.uid,
            email: user.email,
            role: 'member',
            fullName: user.displayName || 'User',
            permissions: ['view_assigned']
          };
          state.setUserData(basicUserData);
        }
        
        state.setConnectionError(false);
      }, null, 'Loading user data on auth change');
    } else {
      state.setUserData(null);
      state.setConnectionError(false);
    }
  } catch (error) {
    console.error('Auth state change error:', error);
    state.setConnectionError(true);
  }
  
  state.setUser(user);
});

// Network status monitoring
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    const state = useAuthStore.getState();
    if (state.connectionError) {
      console.log('Network restored, retrying connection...');
      state.retryConnection();
    }
  });

  window.addEventListener('offline', () => {
    console.log('Network connection lost');
    useAuthStore.getState().setConnectionError(true);
  });
}
