import React from "react";
import { cn } from "@/lib/utils";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "dots" | "pulse";
}

const Loader = React.forwardRef<HTMLDivElement, LoaderProps>(
  ({ className, size = "md", variant = "default", children, ...props }, ref) => {
    const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-6 h-6", 
      lg: "w-8 h-8"
    };

    const renderSpinner = () => (
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-gray-300 border-t-cyan-600 dark:border-gray-600 dark:border-t-cyan-400",
          sizeClasses[size]
        )}
      />
    );

    const renderDots = () => (
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "animate-bounce rounded-full bg-cyan-600 dark:bg-cyan-400",
              size === "sm" ? "w-1 h-1" : size === "md" ? "w-1.5 h-1.5" : "w-2 h-2"
            )}
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    );

    const renderPulse = () => (
      <div
        className={cn(
          "animate-pulse rounded-full bg-cyan-600 dark:bg-cyan-400",
          sizeClasses[size]
        )}
      />
    );

    const getLoader = () => {
      switch (variant) {
        case "dots":
          return renderDots();
        case "pulse":
          return renderPulse();
        default:
          return renderSpinner();
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-3 p-4",
          className
        )}
        {...props}
      >
        {getLoader()}
        {children && (
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {children}
          </div>
        )}
      </div>
    );
  }
);

Loader.displayName = "Loader";

export { Loader };
