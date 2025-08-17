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

    if (email.trim().toLowerCase() !== "ceo@enkonix.in") {
      toast.error("Unauthorized email access");
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);
      toast.success("Successfully logged in!");
      
      // Generate new quote for next login
      const randomQuote = taskQuotations[Math.floor(Math.random() * taskQuotations.length)];
      setCurrentQuote(randomQuote);
      
      navigate("/");
    } catch (err) {
      toast.error("Invalid login credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)} {...props}>
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-0 items-center min-h-[500px]">
        {/* Left Side - Login Form */}
        <div className="relative z-20 lg:pr-8">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-xl p-6 lg:p-8 moving-border">
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
              <div className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                ENKONIX TAS
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
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

        {/* Right Side - Welcome Section */}
        <div className="relative lg:pl-8">
          {/* Large Welcome Text */}
          <div className="relative z-10">
            
            <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-400 bg-clip-text text-transparent mb-6 leading-tight mt-8">
              WELCOME
            </h1>
            
            <div className="space-y-4 max-w-sm">
              <p className="text-base lg:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                Step into your productivity workspace where every task moves you closer to success.
              </p>
              
              {/* Quote Section */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-4 shadow-lg rotating-border">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs font-bold">"</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium italic leading-relaxed">
                      {currentQuote}
                    </p>
                    <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-2 font-semibold">
                      — ENKONIX
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements - repositioned to avoid text overlap */}
          <div className="absolute -top-6 -right-6 w-8 h-8 bg-gradient-to-br from-cyan-300/60 to-blue-400/70 dark:from-cyan-700/70 dark:to-blue-600/80 rounded-full opacity-70 animate-floating-circle shadow-lg"></div>
          <div className="absolute top-12 -right-8 w-4 h-4 bg-gradient-to-br from-blue-300/70 to-cyan-400/80 dark:from-blue-600/80 dark:to-cyan-500/90 rounded-full opacity-50 animate-orbit shadow-md" style={{animationDelay: '1s'}}></div>
          
          {/* Additional animated particles - improved contrast */}
          <div className="absolute bottom-12 -right-6 w-6 h-6 bg-gradient-to-br from-cyan-300/60 to-blue-400/70 dark:from-cyan-600/70 dark:to-blue-500/80 rounded-full opacity-60 animate-scale-pulse shadow-lg" style={{animationDelay: '2s'}}></div>
          
          {/* Floating geometric shapes - enhanced visibility */}
          
          {/* Left side decorative elements */}
          <div className="absolute top-8 -left-4 w-3 h-3 bg-gradient-to-br from-cyan-300/50 to-blue-400/60 dark:from-cyan-600/70 dark:to-blue-500/80 rounded-full animate-gentle-drift shadow-md" style={{animationDelay: '1.5s'}}></div>
        </div>
      </div>
      
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
  );
}
