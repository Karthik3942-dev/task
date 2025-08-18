import React, { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Moon, Sun, Lock, User } from "lucide-react";
import { useThemeStore } from "../store/themeStore";

const taskQuotations = [
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The way to get started is to quit talking and begin doing.",
  "Don't be afraid to give up the good to go for the great.",
  "Innovation distinguishes between a leader and a follower.",
  "The only impossible journey is the one you never begin.",
  "It does not matter how slowly you go as long as you do not stop.",
  "Everything you've ever wanted is on the other side of fear.",
  "Believe you can and you're halfway there.",
  "The future depends on what you do today.",
  "A goal without a plan is just a wish.",
  "Quality is not an act, it is a habit.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Progress, not perfection.",
  "Focus on being productive instead of busy.",
  "Don't watch the clock; do what it does. Keep going.",
];

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [currentQuote, setCurrentQuote] = useState("");
  const { signIn } = useAuthStore();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    const randomQuote = taskQuotations[Math.floor(Math.random() * taskQuotations.length)];
    setCurrentQuote(randomQuote);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Check internet connection first
    if (!navigator.onLine) {
      toast.error("No internet connection. Please check your network and try again.");
      setIsLoading(false);
      return;
    }

    try {
      await signIn(email, password);
      toast.success("Successfully logged in!");

      // Generate new quote for next login
      const randomQuote = taskQuotations[Math.floor(Math.random() * taskQuotations.length)];
      setCurrentQuote(randomQuote);

      navigate("/");
    } catch (err: any) {
      // Enhanced error handling with network-specific messages
      if (err.message?.includes('timeout') || err.message?.includes('network')) {
        toast.error("Connection timeout. Please check your internet connection and try again.");
      } else if (err.code === 'auth/network-request-failed') {
        toast.error("Network connection failed. Please check your internet connection and try again.");
      } else if (err.code === 'auth/user-not-found') {
        toast.error("No account found with this email. Please contact your administrator.");
      } else if (err.code === 'auth/wrong-password') {
        toast.error("Incorrect password. Please try again.");
      } else if (err.code === 'auth/invalid-email') {
        toast.error("Please enter a valid email address.");
      } else if (err.code === 'auth/user-disabled') {
        toast.error("This account has been disabled. Please contact your administrator.");
      } else if (err.code === 'auth/too-many-requests') {
        toast.error("Too many failed attempts. Please try again later or reset your password.");
      } else if (err.code === 'auth/invalid-credential') {
        toast.error("Invalid credentials. Please check your email and password.");
      } else {
        toast.error(err.message || "Login failed. Please try again.");
      }
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setResetLoading(true);
    try {
      // Import Firebase Auth
      const { sendPasswordResetEmail } = await import("firebase/auth");
      const { auth } = await import("../lib/firebase");

      // Send password reset email
      await sendPasswordResetEmail(auth, forgotEmail);
      toast.success("Password reset link sent to your email! Check your inbox.");
      setShowForgotPassword(false);
      setForgotEmail("");
    } catch (err: any) {
      console.error('Password reset error:', err);
      // Handle different error types
      if (err.code === 'auth/user-not-found') {
        toast.error("No account found with this email address.");
      } else if (err.code === 'auth/invalid-email') {
        toast.error("Please enter a valid email address.");
      } else if (err.code === 'auth/too-many-requests') {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else {
        toast.error("Failed to send reset email. Please try again.");
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className={cn("min-h-screen relative overflow-hidden flex items-center justify-center", className)} {...props}>
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-black">
        {/* Enhanced Floating Background Elements */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-cyan-400/30 to-blue-500/30 dark:from-cyan-600/40 dark:to-blue-700/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-10 right-10 w-80 h-80 bg-gradient-to-r from-blue-400/25 to-cyan-500/25 dark:from-blue-600/35 dark:to-cyan-700/35 rounded-full mix-blend-multiply filter blur-2xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-10 left-32 w-72 h-72 bg-gradient-to-r from-cyan-500/20 to-blue-400/20 dark:from-cyan-700/30 dark:to-blue-600/30 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-20 right-32 w-64 h-64 bg-gradient-to-r from-purple-400/15 to-pink-400/15 dark:from-purple-600/25 dark:to-pink-600/25 rounded-full mix-blend-multiply filter blur-2xl animate-blob animation-delay-6000"></div>

        {/* Enhanced Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08]">
          <div className="h-full w-full bg-grid-pattern dark:bg-grid-pattern"></div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400/60 dark:bg-cyan-300/80 rounded-full animate-gentle-drift"></div>
          <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-blue-400/50 dark:bg-blue-300/70 rounded-full animate-parallax-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-purple-400/70 dark:bg-purple-300/90 rounded-full animate-glow-pulse" style={{animationDelay: '2.5s'}}></div>
          <div className="absolute bottom-1/4 left-1/2 w-2.5 h-2.5 bg-pink-400/40 dark:bg-pink-300/60 rounded-full animate-orbit" style={{animationDelay: '3s'}}></div>
        </div>
      </div>
      
      <div className="relative z-10 w-full max-w-7xl mx-auto p-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
          {/* Left Side - Login Form */}
          <div className="relative z-20 flex flex-col items-center lg:items-start">
            <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 lg:p-10 moving-border border border-white/20 dark:border-gray-700/30">
              {/* Theme Toggle */}
              <div className="flex justify-end mb-6">
                <button
                  onClick={toggleTheme}
                  className="p-3 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-slate-800 dark:to-cyan-900/50 border border-cyan-200/50 dark:border-cyan-500/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group backdrop-blur-sm"
                  title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                  {theme === 'light' ? (
                    <Moon className="w-5 h-5 text-cyan-600 group-hover:text-cyan-700 transition-colors" />
                  ) : (
                    <Sun className="w-5 h-5 text-yellow-500 group-hover:text-yellow-600 transition-colors" />
                  )}
                </button>
              </div>

              {/* Logo */}
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg animate-gentle-drift">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                  ENKONIX TAS
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                      USERNAME
                    </Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-14 pl-12 pr-4 rounded-2xl border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-slate-800/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-cyan-500/20 backdrop-blur-sm transition-all duration-300 shadow-sm focus:shadow-lg"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                      PASSWORD
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-14 pl-12 pr-4 rounded-2xl border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-slate-800/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-cyan-500/20 backdrop-blur-sm transition-all duration-300 shadow-sm focus:shadow-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 text-cyan-600 focus:ring-cyan-500/20" />
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 text-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    "LOGIN"
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Right Side - Welcome Section */}
          <div className="relative flex flex-col items-center lg:items-start lg:pl-16">
            {/* Large Welcome Text */}
            <div className="relative z-10 text-center lg:text-left">
              <h1 className="text-5xl lg:text-8xl xl:text-9xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-400 bg-clip-text text-transparent mb-8 leading-tight animate-fade-in">
                WELCOME
              </h1>
              
              <div className="space-y-6 max-w-lg mx-auto lg:mx-0">
                <p className="text-lg lg:text-xl text-gray-700 dark:text-gray-300 leading-relaxed animate-slide-up">
                  Step into your productivity workspace where every task moves you closer to success.
                </p>

                {/* Quote Section */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg rotating-border border border-white/30 dark:border-gray-600/30 animate-scale-in" style={{animationDelay: '0.5s'}}>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1 animate-gentle-drift">
                      <span className="text-white text-lg font-bold">"</span>
                    </div>
                    <div>
                      <p className="text-gray-800 dark:text-gray-200 font-medium italic leading-relaxed text-sm lg:text-base">
                        {currentQuote}
                      </p>
                      <p className="text-sm text-cyan-600 dark:text-cyan-400 mt-4 font-semibold">
                        — ENKONIX
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enhanced Decorative Elements - better positioned */}
            <div className="hidden lg:block">
              <div className="absolute -top-12 -right-12 w-16 h-16 bg-gradient-to-br from-cyan-300/60 to-blue-400/70 dark:from-cyan-700/70 dark:to-blue-600/80 rounded-full opacity-75 animate-floating-circle shadow-lg"></div>
              <div className="absolute top-20 -right-16 w-8 h-8 bg-gradient-to-br from-blue-300/70 to-cyan-400/80 dark:from-blue-600/80 dark:to-cyan-500/90 rounded-full opacity-60 animate-orbit shadow-md" style={{animationDelay: '1s'}}></div>
              <div className="absolute bottom-20 -right-14 w-12 h-12 bg-gradient-to-br from-cyan-300/60 to-blue-400/70 dark:from-cyan-600/70 dark:to-blue-500/80 rounded-full opacity-65 animate-scale-pulse shadow-lg" style={{animationDelay: '2s'}}></div>

              {/* Additional animated particles */}
              <div className="absolute top-40 -right-20 w-5 h-5 bg-cyan-400/70 dark:bg-cyan-300/85 rounded-full animate-gentle-drift shadow-sm" style={{animationDelay: '0.5s'}}></div>
              <div className="absolute top-60 -right-8 w-6 h-6 bg-blue-400/50 dark:bg-blue-300/65 rounded-full animate-parallax-float shadow-md" style={{animationDelay: '3s'}}></div>
              <div className="absolute bottom-40 -right-18 w-4 h-4 bg-cyan-400/80 dark:bg-cyan-300/90 rounded-full animate-glow-pulse shadow-sm" style={{animationDelay: '4.5s'}}></div>

              {/* Floating geometric shapes */}
              <div className="absolute top-32 -right-24 w-6 h-6 bg-gradient-to-br from-cyan-400/40 to-blue-500/60 dark:from-cyan-500/60 dark:to-blue-400/80 rounded-sm rotate-45 animate-orbit-reverse shadow-md" style={{animationDelay: '2.2s'}}></div>
              <div className="absolute bottom-32 -right-22 w-10 h-3 bg-gradient-to-r from-blue-400/60 to-cyan-500/70 dark:from-blue-500/70 dark:to-cyan-400/80 animate-ripple shadow-sm" style={{animationDelay: '3.8s'}}></div>

              {/* Left side decorative elements */}
              <div className="absolute top-16 -left-8 w-5 h-5 bg-gradient-to-br from-cyan-300/50 to-blue-400/60 dark:from-cyan-600/70 dark:to-blue-500/80 rounded-full animate-gentle-drift shadow-md" style={{animationDelay: '1.5s'}}></div>
              <div className="absolute bottom-16 -left-12 w-8 h-8 bg-gradient-to-br from-cyan-300/40 to-blue-400/50 dark:from-cyan-600/60 dark:to-blue-500/70 rounded-full animate-parallax-float shadow-lg" style={{animationDelay: '2.8s'}}></div>
            </div>
          </div>
        </div>
        
        {/* Bottom Text */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center text-sm text-gray-600 dark:text-gray-300 animate-fade-in" style={{animationDelay: '1s'}}>
          By continuing, you agree to our{" "}
          <a href="#" className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 underline underline-offset-2 transition-colors">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 underline underline-offset-2 transition-colors">
            Privacy Policy
          </a>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Reset Password
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Label htmlFor="forgot-email" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                  Email Address
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="Enter your email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="pl-10 pr-4 h-12 rounded-xl border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-slate-800/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotEmail("");
                  }}
                  className="flex-1 h-12 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 h-12 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl transition-all duration-300"
                >
                  {resetLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
