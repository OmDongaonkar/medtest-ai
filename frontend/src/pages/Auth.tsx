import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Mail, Lock, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

// Only import auth and signInWithPopup - we'll import GoogleAuthProvider dynamically
import { auth } from "@/lib/firebase";
import { signInWithPopup, signOut } from "firebase/auth";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, logout, isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // Logout handler
  const handleLogout = async () => {
    setIsLoading(true);
    
    try {
      // Step 1: Call backend logout endpoint
      try {
        const response = await fetch(`${import.meta.env.VITE_REQUEST_URL}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
      } catch (backendError) {
        console.warn("⚠️ Backend logout request failed:", backendError);
      }

      // Step 2: Sign out from Firebase (if using Google auth)
      try {
        await signOut(auth);
      } catch (firebaseError) {
        console.warn("⚠️ Firebase signout failed:", firebaseError);
      }

      // Step 3: Clear local auth context
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
        
      } catch (storageError) {
        console.warn("⚠️ Failed to clear storage:", storageError);
      }

      // Step 5: Show success message
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account.",
      });

      // Step 6: Navigate to login page or home
      navigate("/", { replace: true });

    } catch (error) {
      console.error("💥 Logout error:", error);
      
      // Handle specific error types
      if (error?.code) {
        // Firebase auth errors
        switch (error.code) {
          case 'auth/network-request-failed':
            toast({
              title: "Network error",
              description: "Please check your internet connection and try again.",
              variant: "destructive",
            });
            break;
          default:
            toast({
              title: "Logout Failed",
              description: error.message || "Something went wrong during logout.",
              variant: "destructive",
            });
        }
      } else {
        // Network or other errors
        toast({
          title: "Logout Error",
          description: error.message || "An unexpected error occurred during logout.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Google Auth handler with dynamic imports
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    
    try {
      const { GoogleAuthProvider } = await import("firebase/auth");

      // Create and configure provider
      const provider = new GoogleAuthProvider();
      
      // Add scopes
      provider.addScope('email');
      provider.addScope('profile');
      provider.addScope('openid');
      
      // Set custom parameters
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Step 1: Firebase Authentication
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check for email in user object or providerData
      let emailToUse = user.email;
      
      if (!emailToUse) {
        const googleProvider = user.providerData?.find(p => p.providerId === 'google.com');
        emailToUse = googleProvider?.email;
      }

      if (!emailToUse) {
        throw new Error(
          "Unable to get email from Google account. Please ensure your Google account has a verified email address or try signing up with email/password."
        );
      }

      // Step 2: Prepare data for backend
      const requestBody = {
        uid: user.uid,
        name: user.displayName || emailToUse.split('@')[0],
        email: emailToUse,
        photoURL: user.photoURL || null,
      };

      // Step 3: Send to backend
      const endpoint = activeTab === "login" 
        ? `${import.meta.env.VITE_REQUEST_URL}/auth/google-login`
        : `${import.meta.env.VITE_REQUEST_URL}/auth/google-signup`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const responseData = await response.json();

      // Step 4: Update local auth state
      login(responseData.user);

      toast({
        title: activeTab === "login" ? "Signed in with Google" : "Account created with Google",
        description: `Welcome ${responseData.user.name || user.displayName}!`,
      });

      navigate("/", { replace: true });

    } catch (error) {
      // Handle specific error types
      if (error?.code) {
        // Firebase auth errors
        switch (error.code) {
          case 'auth/popup-closed-by-user':
            toast({
              title: "Sign-in cancelled",
              description: "You closed the sign-in popup.",
              variant: "destructive",
            });
            break;
          case 'auth/popup-blocked':
            toast({
              title: "Popup blocked",
              description: "Please allow popups for this site and try again.",
              variant: "destructive",
            });
            break;
          default:
            toast({
              title: "Authentication Failed",
              description: error.message || "Something went wrong with Google authentication.",
              variant: "destructive",
            });
        }
      } else {
        // Network or other errors
        toast({
          title: "Authentication Error",
          description: error.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    type: "login" | "signup"
  ) => {
    e.preventDefault();
    setIsLoading(true);

    const url =
      type === "login"
       // ? `http://localhost:3000/auth/login`
        ? `${import.meta.env.VITE_REQUEST_URL}/auth/login`
        //: `http://localhost:3000/auth/signup`;
        : `${import.meta.env.VITE_REQUEST_URL}/auth/signup`;

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // Form validation
    if (type === "signup" && (!data.name || data.name.toString().trim() === "")) {
      toast({
        title: "Name is required",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!data.email || data.email.toString().trim() === "") {
      toast({
        title: "Email is required",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.toString())) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!data.password || data.password.toString().trim() === "") {
      toast({
        title: "Password is required",
        description: "Please enter your password.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (type === "signup" && data.password.toString().length < 6) {
      toast({
        title: "Weak password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Request failed");
      }

      const result = await response.json();
      login(result.user);

      toast({
        title: type === "login" ? "Login successful" : "Account created",
        description:
          type === "login"
            ? "Welcome back!"
            : "Your account has been created successfully.",
      });

      navigate("/", { replace: true });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="p-3 rounded-xl bg-primary/10 backdrop-blur-sm">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <span className="text-2xl font-bold text-foreground">MedTest AI</span>
          </Link>
          <p className="text-muted-foreground mt-2">
            Healthcare compliance made simple
          </p>
        </div>

        <Card className="glass-card animate-fade-in">
          <Tabs
            defaultValue="login"
            className="w-full"
            onValueChange={(value) =>
              setActiveTab(value as "login" | "signup")
            }
          >
            <CardHeader className="space-y-1">
              <TabsList className="grid w-full grid-cols-2 glass-input">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>

            {/* LOGIN FORM */}
            <TabsContent value="login">
              <form onSubmit={(e) => handleSubmit(e, "login")}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@company.com"
                        className="pl-10 glass-input"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 glass-input"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleGoogleAuth}
                    variant="outline"
                    className="w-full glass-input"
                    disabled={isLoading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M21.35 11.1h-9.18v2.98h5.62c-.24 1.43-1.42 4.2-5.62 4.2-3.38 0-6.15-2.79-6.15-6.23s2.77-6.23 6.15-6.23c1.93 0 3.23.82 3.97 1.53l2.71-2.62C17.34 3.46 15.06 2.5 12 2.5 6.76 2.5 2.5 6.76 2.5 12s4.26 9.5 9.5 9.5c5.48 0 9.1-3.84 9.1-9.25 0-.62-.07-1.09-.15-1.62z"
                      />
                    </svg>
                    {isLoading ? "Signing in..." : "Continue with Google"}
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    Forgot your password?{" "}
                    <Link
                      to="/forgot-password"
                      className="text-primary hover:underline"
                    >
                      Reset it here
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </TabsContent>

            {/* SIGNUP FORM */}
            <TabsContent value="signup">
              <form onSubmit={(e) => handleSubmit(e, "signup")}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        className="pl-10 glass-input"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="you@company.com"
                        className="pl-10 glass-input"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 glass-input"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleGoogleAuth}
                    variant="outline"
                    className="w-full glass-input"
                    disabled={isLoading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M21.35 11.1h-9.18v2.98h5.62c-.24 1.43-1.42 4.2-5.62 4.2-3.38 0-6.15-2.79-6.15-6.23s2.77-6.23 6.15-6.23c1.93 0 3.23.82 3.97 1.53l2.71-2.62C17.34 3.46 15.06 2.5 12 2.5 6.76 2.5 2.5 6.76 2.5 12s4.26 9.5 9.5 9.5c5.48 0 9.1-3.84 9.1-9.25 0-.62-.07-1.09-.15-1.62z"
                      />
                    </svg>
                    {isLoading ? "Creating account..." : "Continue with Google"}
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    By signing up, you agree to our{" "}
                    <a href="#" className="text-primary hover:underline">
                      Terms of Service
                    </a>
                  </p>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;