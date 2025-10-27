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
      const apiUrl = import.meta.env.VITE_REQUEST_URL;
      
      // Debug logging
      console.log("Checking auth with URL:", `${apiUrl}/auth/check`);
      
      if (!apiUrl) {
        console.error("VITE_REQUEST_URL is not defined!");
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await fetch(`${apiUrl}/auth/check`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Auth check response status:", response.status);

      // Check if response is actually JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Response is not JSON:", contentType);
        const text = await response.text();
        console.error("Response body:", text.substring(0, 200));
        setUser(null);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log("Auth check data:", data);
      
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
      const apiUrl = import.meta.env.VITE_REQUEST_URL;
      
      // Sign out from Firebase
      await auth.signOut();
      
      // Call backend logout
      if (apiUrl) {
        await fetch(`${apiUrl}/auth/logout`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
      
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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