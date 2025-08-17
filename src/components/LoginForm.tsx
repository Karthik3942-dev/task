import React, { useState } from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Moon,
  Sun
} from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      toast.error("Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-teal-100 dark:from-gray-900 dark:via-gray-800 dark:to-black flex items-center justify-center p-8", className)} {...props}>
      <div className="w-full max-w-5xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 z-20 p-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <Sun className="w-5 h-5 text-yellow-500" />
          )}
        </button>

        <div className="flex min-h-[500px]">
          {/* Left Side - Login Form */}
          <div className="w-full lg:w-1/2 p-10 flex flex-col justify-center">
            {/* Header */}
            <div className="mb-6">
              {/* Logo */}
              <div className="flex items-center mb-10">
                
                <span className="text-xl font-bold text-gray-900 dark:text-white">Enkonix</span>
              </div>

              {/* Back Arrow */}
              <button className="mb-6 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              {/* Welcome Text */}
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Wellcome Back!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Please enter log in details below
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:bg-white dark:focus:bg-gray-700 transition-all"
                />
              </div>

              {/* Password Field */}
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-12 px-4 pr-12 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:bg-white dark:focus:bg-gray-700 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <a
                  href="#"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Forget password?
                </a>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-black font-medium rounded-xl transition-all duration-200 text-base"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
                <a href="#" className="text-gray-900 dark:text-white font-medium hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  Sign Up
                </a>
              </p>
            </div>
          </div>

          {/* Right Side - Animation and Content */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-black dark:from-gray-100 dark:via-gray-200 dark:to-gray-300 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 dark:opacity-20">
              <div className="absolute top-10 left-10 w-20 h-20 border border-gray-600 dark:border-gray-400 rotate-45"></div>
              <div className="absolute top-32 right-20 w-16 h-16 border border-gray-600 dark:border-gray-400 rotate-12"></div>
              <div className="absolute bottom-32 left-16 w-12 h-12 border border-gray-600 dark:border-gray-400 rotate-45"></div>
              <div className="absolute bottom-20 right-32 w-8 h-8 bg-green-400 rounded-full"></div>
              <div className="absolute top-1/2 right-10 w-6 h-6 bg-yellow-400 rotate-45"></div>
              <div className="absolute top-20 left-1/2 w-10 h-10 border border-purple-400 rounded-full"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-center items-center text-center px-10 w-full">
              {/* Lottie Animation */}
              <div className="w-64 h-64 mb-6">
                <DotLottieReact
                  src="https://lottie.host/acd8a01f-1c2b-4b4e-ba57-3f667f0d6af5/jyL6hp2hBS.lottie"
                  loop
                  autoplay
                  className="w-full h-full"
                />
              </div>

              {/* Text Content */}
              <div className="text-white dark:text-gray-800 mb-6">
                <h2 className="text-xl font-bold mb-3">
                  Manage your Money Anywhere
                </h2>
                <p className="text-gray-300 dark:text-gray-600 text-sm leading-relaxed max-w-sm mx-auto">
                  you can Manage your Money on the go with Quicken on the web
                </p>
              </div>

              {/* Pagination Dots */}
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-white dark:bg-gray-800 rounded-full"></div>
                <div className="w-2 h-2 bg-white/30 dark:bg-gray-800/30 rounded-full"></div>
                <div className="w-2 h-2 bg-white/30 dark:bg-gray-800/30 rounded-full"></div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-20 right-20 w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl opacity-20 rotate-12"></div>
            <div className="absolute bottom-20 left-20 w-12 h-12 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-30"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
