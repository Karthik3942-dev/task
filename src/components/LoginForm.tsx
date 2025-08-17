import React, { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuthStore } from "../store/authStore";
import { ROLES } from "../lib/firebase";
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

    try {
      await signIn(email, password);
      toast.success("Successfully logged in!");

      // Generate new quote for next login
      const randomQuote = taskQuotations[Math.floor(Math.random() * taskQuotations.length)];
      setCurrentQuote(randomQuote);

      navigate("/");
    } catch (err: any) {
      // Handle different error types for better user experience
      if (err.code === 'auth/user-not-found') {
        toast.error("No account found with this email. Please contact admin.");
      } else if (err.code === 'auth/wrong-password') {
        toast.error("Incorrect password. Please try again.");
      } else if (err.code === 'auth/invalid-email') {
        toast.error("Please enter a valid email address.");
      } else if (err.code === 'auth/too-many-requests') {
        toast.error("Too many failed attempts. Please try again later.");
      } else {
        toast.error("Login failed. Please check your credentials.");
      }
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-black flex items-center justify-center p-4", className)} {...props}>
      <div className="w-full max-w-md mx-auto">
        {/* Centered Login Form */}
        <div className="relative z-20">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-xl p-6 lg:p-8 moving-border border border-gray-200/50 dark:border-gray-700/50">
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
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                  ENKONIX TAS
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Employee & Team Lead Portal
                </div>
              </div>
            </div>

            {/* User Types Info */}
            <div className="mb-4 p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-sm font-medium text-cyan-700 dark:text-cyan-300">Access Levels</span>
              </div>
              <div className="text-xs text-cyan-600 dark:text-cyan-400 space-y-1">
                <div>• <strong>Team Lead:</strong> Manage team, assign tasks, view reports</div>
                <div>• <strong>Employee:</strong> View projects, manage assigned tasks</div>
                <div>• <strong>Admin:</strong> Full system access and user management</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                    EMAIL ADDRESS
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your work email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 pl-11 pr-4 rounded-xl border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-slate-800/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-cyan-500/20 backdrop-blur-sm transition-all duration-300 shadow-sm focus:shadow-lg"
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
                      className="h-12 pl-11 pr-4 rounded-xl border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-slate-800/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-cyan-500/20 backdrop-blur-sm transition-all duration-300 shadow-sm focus:shadow-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 text-cyan-600 focus:ring-cyan-500/20" />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Remember me</span>
                </label>
                <a href="#" className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium">
                  Forgot your password?
                </a>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 text-base"
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

        {/* Quote Section - below the form */}
        <div className="mt-6">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-4 shadow-lg rotating-border border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-xs font-bold">"</span>
              </div>
              <div>
                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium italic leading-relaxed">
                  {currentQuote}
                </p>
                <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-2 font-semibold">
                  — ENKONIX Team
                </p>
              </div>
            </div>
          </div>

          {/* Role-based welcome message */}
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Welcome back! Sign in to access your role-based dashboard
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-6 -right-6 w-8 h-8 bg-gradient-to-br from-cyan-300/60 to-blue-400/70 dark:from-cyan-700/70 dark:to-blue-600/80 rounded-full opacity-70 animate-floating-circle shadow-lg"></div>
        <div className="absolute top-12 -right-8 w-4 h-4 bg-gradient-to-br from-blue-300/70 to-cyan-400/80 dark:from-blue-600/80 dark:to-cyan-500/90 rounded-full opacity-50 animate-orbit shadow-md" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-12 -left-4 w-3 h-3 bg-gradient-to-br from-cyan-300/50 to-blue-400/60 dark:from-cyan-600/70 dark:to-blue-500/80 rounded-full animate-gentle-drift shadow-md" style={{animationDelay: '1.5s'}}></div>

        {/* Bottom Text */}
        <div className="text-center mt-6 text-xs text-gray-600 dark:text-gray-300">
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
    </div>
  );
}
