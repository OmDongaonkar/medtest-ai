import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await fetch(`http://localhost:3000/auth/check`, {
        credentials: "include",
      });
      const data = await response.json();
      setUser(data.loggedIn ? data.user : null);
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      // Sign out from Firebase
      await auth.signOut();
      
      // Call backend logout
      await fetch(`http://localhost:3000/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      setUser(null);
    }
  };

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in with Firebase, check with backend
        console.log("Firebase user detected:", firebaseUser.email);
        await checkAuth();
      } else {
        // User is signed out from Firebase
        console.log("No Firebase user");
        if (!loading) {
          await checkAuth(); // Still check backend in case of session-only login
        }
      }
    });

    // Initial auth check
    checkAuth();

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    login,
    logout,
    loading,
    checkAuth,
    isLoggedIn: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};