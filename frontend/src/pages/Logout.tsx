import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

const Logout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout, isLoggedIn } = useAuth();

  useEffect(() => {
    const performLogout = async () => {
      try {
        console.log("🚪 Starting logout process...");
        
        // Step 1: Call backend logout endpoint
        try {
          console.log("📤 Calling backend logout endpoint...");
          const response = await fetch("http://localhost:3000/auth/logout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // Important: include cookies for session handling
          });

          if (!response.ok) {
            console.warn("⚠️ Backend logout failed:", response.status);
            // Continue with client-side logout even if backend fails
          } else {
            console.log("✅ Backend logout successful");
          }
        } catch (backendError) {
          console.warn("⚠️ Backend logout request failed:", backendError);
          // Continue with client-side logout even if backend fails
        }

        // Step 2: Sign out from Firebase (if using Google auth)
        try {
          console.log("🔥 Signing out from Firebase...");
          await signOut(auth);
          console.log("✅ Firebase signout successful");
        } catch (firebaseError) {
          console.warn("⚠️ Firebase signout failed:", firebaseError);
          // Continue with context logout even if Firebase fails
        }

        // Step 3: Clear local auth context
        console.log("🧹 Clearing local auth context...");
        logout();
        
        // Step 4: Clear any local storage items (if any)
        try {
          // Clear common auth-related localStorage items
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('refreshToken');
          
          // Clear sessionStorage as well
          sessionStorage.removeItem('authToken');
          sessionStorage.removeItem('user');
          
          console.log("✅ Local storage cleared");
        } catch (storageError) {
          console.warn("⚠️ Failed to clear storage:", storageError);
        }

        // Step 5: Show success message
        toast({
          title: "Logged out successfully",
          description: "You have been signed out of your account.",
        });

        // Step 6: Navigate to home page
        navigate("/", { replace: true });

      } catch (error) {
        console.error("💥 Logout error:", error);
        
        toast({
          title: "Logout Error",
          description: error.message || "An unexpected error occurred during logout.",
          variant: "destructive",
        });
        
        // Even if there's an error, try to navigate to home
        navigate("/", { replace: true });
      }
    };

    // Only perform logout if user is actually logged in
    if (isLoggedIn) {
      performLogout();
    } else {
      // If not logged in, just redirect to home
      navigate("/", { replace: true });
    }
  }, [isLoggedIn, logout, navigate, toast]);

  // Show a loading state while logout is processing
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Signing you out...</p>
      </div>
    </div>
  );
};

export default Logout;