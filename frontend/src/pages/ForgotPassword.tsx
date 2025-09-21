import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Mail, KeyRound, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsEmailSent(true);
    }, 2000);
  };

  const handleSubmitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Handle success
    }, 2000);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="p-3 rounded-xl bg-primary/10 backdrop-blur-sm">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <span className="text-2xl font-bold text-foreground">MedTest AI</span>
          </Link>
          <p className="text-muted-foreground mt-2">
            Reset your password
          </p>
        </div>

        <Card className="glass-card animate-fade-in">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-center">
              Forgot Password
            </CardTitle>
            <CardDescription className="text-center">
              {isEmailSent 
                ? "Enter the OTP sent to your email"
                : "Enter your email to receive a reset code"
              }
            </CardDescription>
          </CardHeader>

          <form onSubmit={isEmailSent ? handleSubmitOtp : handleSendOtp}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    className="pl-10 glass-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isEmailSent}
                    required
                  />
                </div>
              </div>

              {isEmailSent && (
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="000000"
                      className="pl-10 glass-input"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      required
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the code?{" "}
                    <button 
                      type="button" 
                      className="text-primary hover:underline"
                      onClick={() => setIsEmailSent(false)}
                    >
                      Try again
                    </button>
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading 
                  ? (isEmailSent ? "Verifying..." : "Sending OTP...") 
                  : (isEmailSent ? "Reset Password" : "Send OTP")
                }
              </Button>
              
              <Link 
                to="/auth" 
                className="inline-flex items-center justify-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Login</span>
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;