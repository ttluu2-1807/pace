"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  Apple,
  HeartPulse,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Today", icon: LayoutDashboard },
  { href: "/training", label: "Training", icon: Dumbbell },
  { href: "/nutrition", label: "Nutrition", icon: Apple },
  { href: "/injury", label: "Recovery", icon: HeartPulse },
  { href: "/profile", label: "Profile", icon: User },
];

// Rendered inside each <Link>. useLinkStatus gives us instant pending state
// so the tapped tab flips to the active color the moment the user taps,
// without waiting for the server component to finish rendering.
function NavItemContent({
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
        "flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors",
        showActive
          ? "text-primary font-medium"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </div>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} prefetch>
              <NavItemContent
                label={item.label}
                Icon={item.icon}
                isActive={isActive}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
