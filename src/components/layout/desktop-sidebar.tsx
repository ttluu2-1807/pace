"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  Apple,
  HeartPulse,
  User,
  BarChart3,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Daily Brief", icon: LayoutDashboard },
  { href: "/training", label: "Training", icon: Dumbbell },
  { href: "/nutrition", label: "Nutrition", icon: Apple },
  { href: "/injury", label: "Recovery", icon: HeartPulse },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: User },
];

function SidebarItemContent({
  label,
  Icon,
  isActive,
}: {
  label: string;
  Icon: LucideIcon;
  isActive: boolean;
}) {
  const { pending } = useLinkStatus();
  const showActive = isActive || pending;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
        showActive
          ? "bg-primary text-primary-foreground font-medium"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </div>
  );
}

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r bg-background">
      <div className="flex items-center gap-2 h-16 px-6 border-b">
        <Zap className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold tracking-tight">PACE</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} prefetch>
              <SidebarItemContent
                label={item.label}
                Icon={item.icon}
                isActive={isActive}
              />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
