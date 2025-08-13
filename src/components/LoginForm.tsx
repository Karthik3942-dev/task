import React, { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Moon, Sun, Mail, Lock, Eye, EyeOff } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuthStore();
  const navigate = useNavigate();
  const { theme, setTheme } = useThemeStore();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      toast.success("Successfully logged in!");
      navigate("/");
    } catch (err) {
      toast.error("Invalid login credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("min-h-screen relative", className)} {...props}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-emerald-900 to-cyan-900 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
        {/* Geometric pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(45deg, transparent 35%, rgba(255,255,255,0.1) 35%, rgba(255,255,255,0.1) 65%, transparent 65%),
              linear-gradient(-45deg, transparent 35%, rgba(255,255,255,0.05) 35%, rgba(255,255,255,0.05) 65%, transparent 65%)
            `,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        
        {/* Subtle geometric shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 border border-white/5 rounded-2xl rotate-12 animate-pulse"></div>
        <div className="absolute bottom-32 right-32 w-24 h-24 border border-white/5 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 border border-white/5 rounded-lg rotate-45 animate-pulse" style={{animationDelay: '4s'}}></div>
        
        {/* Light theme background overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:opacity-0 opacity-100 transition-opacity duration-500"></div>
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-8 right-8 z-50">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-xl bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/30 transition-all duration-300 group"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 text-slate-700 group-hover:text-slate-900 transition-colors" />
          ) : (
            <Sun className="w-5 h-5 text-yellow-300 group-hover:text-yellow-200 transition-colors" />
          )}
        </button>
      </div>

      {/* Company Logo/Name */}
      <div className="absolute top-8 left-8 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm"></div>
          </div>
          <span className="text-white dark:text-white text-lg font-semibold">
            TAS ENKONIX
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side - Hero Text */}
          <div className="text-center lg:text-left space-y-8">
           
            
            {/* Decorative elements */}
            <div className="flex justify-center lg:justify-start gap-4 mt-12">
              <div className="w-2 h-16 bg-cyan-400/50 rounded-full"></div>
              <div className="w-2 h-12 bg-cyan-400/30 rounded-full mt-4"></div>
              <div className="w-2 h-8 bg-cyan-400/20 rounded-full mt-8"></div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md bg-black/80 dark:bg-slate-900/90 backdrop-blur-xl border border-white/10 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
              <CardContent className="p-8 space-y-6">
                
                {/* Form Header */}
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-white">Welcome Back</h3>
                  <p className="text-gray-400 text-sm">Login to your account to continue</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  
                  {/* Username/Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300 text-sm font-medium">
                      Username
                    </Label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                        <Mail className="w-4 h-4 text-gray-500" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-300 text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                        <Lock className="w-4 h-4 text-gray-500" />
                      </div>
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12 pl-12 pr-12 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password */}
                  <div className="text-right">
                    <a 
                      href="#" 
                      className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors duration-300"
                    >
                      Forgot password?
                    </a>
                  </div>

                  {/* Login Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-[1.02] focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-black/80"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Signing In...</span>
                      </div>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <p className="text-gray-400 dark:text-gray-500 text-xs text-center">
          ©2024 TAS ENKONIX. All rights reserved.
        </p>
      </div>

      {/* Light theme overlay adjustments */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/95 via-blue-50/90 to-cyan-50/95 dark:opacity-0 opacity-100 transition-opacity duration-500 pointer-events-none">
        {/* Light theme hero text adjustments */}
        <style>{`
          .light-theme-text {
            color: #1e293b !important;
          }
          .light-theme-accent {
            color: #0891b2 !important;
          }
          .light-theme-card {
            background: rgba(255, 255, 255, 0.95) !important;
            border-color: rgba(148, 163, 184, 0.2) !important;
          }
          .light-theme-input {
            background: rgba(248, 250, 252, 0.8) !important;
            border-color: rgba(148, 163, 184, 0.3) !important;
            color: #1e293b !important;
          }
          .light-theme-input::placeholder {
            color: #64748b !important;
          }
          .light-theme-text-secondary {
            color: #475569 !important;
          }
        `}</style>
      </div>

      {/* Light theme specific styling */}
      {theme === 'light' && (
        <style>{`
          .text-white { color: #1e293b !important; }
          .text-white\\/90 { color: #1e293b !important; }
          .text-white\\/80 { color: #334155 !important; }
          .text-cyan-400 { color: #0891b2 !important; }
          .text-gray-400 { color: #64748b !important; }
          .text-gray-300 { color: #475569 !important; }
          .text-gray-500 { color: #64748b !important; }
          .bg-black\\/80 { background-color: rgba(255, 255, 255, 0.95) !important; }
          .border-white\\/10 { border-color: rgba(148, 163, 184, 0.2) !important; }
          .bg-white\\/5 { background-color: rgba(248, 250, 252, 0.8) !important; }
          .placeholder\\:text-gray-500::placeholder { color: #64748b !important; }
        `}</style>
      )}
    </div>
  );
}
