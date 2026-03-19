import * as React from "react";
import { cn } from "../lib/utils";

export interface AuthLayoutProps {
  children: React.ReactNode;
  minimal?: boolean;
}

export function AuthLayout({ children, minimal }: AuthLayoutProps) {
  return (
    <div
      className={cn(
        "min-h-screen w-full flex items-center justify-center",
        "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
        minimal && "bg-background"
      )}
    >
      {/* Animated background elements */}
      {!minimal && (
        <>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
            <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
          </div>
        </>
      )}

      {/* Content container */}
      <div className="relative z-10 w-full px-4 py-8">
        {children}
      </div>
    </div>
  );
}
