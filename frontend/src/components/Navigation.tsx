import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Upload, User, Settings, LogIn } from "lucide-react";

interface NavigationProps {
  isLoggedIn: boolean;
  loading: boolean;
}

const Navigation = ({ isLoggedIn, loading }: NavigationProps) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  if (loading) {
    return (
      <nav className="sticky top-0 z-50 glass-card-strong border-b border-glass-border/50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="p-2 rounded-lg bg-primary/10 backdrop-blur-sm">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-semibold text-foreground">
                MedTest AI
              </span>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 glass-card-strong border-b border-glass-border/50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="p-2 rounded-lg bg-primary/10 backdrop-blur-sm">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-semibold text-foreground">
              MedTest AI
            </span>
          </Link>

          {/* Navigation Links - Only show if logged in */}
          {isLoggedIn && (
            <div className="hidden md:flex items-center space-x-1">
              <Link to="/upload">
                <Button
                  variant={isActive("/upload") ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </Button>
              </Link>

              <Link to="/profile">
                <Button
                  variant={isActive("/profile") ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Button>
              </Link>

            {/* <Link to="/settings">
                <Button
                  variant={isActive("/settings") ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Button>
              </Link>*/}
			  
			  <Link to="/logout">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 glass-button"
              >
                <LogIn className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </Link>
            </div>
          )}

          {/* Auth Button - Only show if NOT logged in */}
          {!isLoggedIn && (
            <Link to="/auth">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 glass-button"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
