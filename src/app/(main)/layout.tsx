import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { CoachButton } from "@/components/coach/CoachButton";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getProfile(user.id) : null;

  return (
    <div className="flex h-screen">
      <DesktopSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <AppHeader />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
        <BottomNav />
      </div>
      {user && (
        <CoachButton
          userId={user.id}
          userName={profile?.name ?? null}
        />
      )}
    </div>
  );
}
