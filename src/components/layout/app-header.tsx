"use client";

import { Zap } from "lucide-react";

export function AppHeader() {
  return (
    <header className="flex items-center h-16 px-4 border-b bg-background md:hidden">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary" />
        <span className="text-lg font-bold tracking-tight">PACE</span>
      </div>
    </header>
  );
}
