import { Logo } from "@/components/logo";
import { LeftNav } from "@/components/left-nav";
import { RightStatus } from "@/components/right-status";
import { getFriendStatuses } from "@/lib/friends";
import { getAuthSession } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();
  const statuses = session?.user?.id
    ? await getFriendStatuses(session.user.id)
    : [];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden h-screen w-72 flex-col border-r border-sidebar-border bg-sidebar p-6 lg:flex">
        <Logo className="-ml-3 mb-6" />
        <LeftNav />
      </aside>
      <main className="flex min-h-screen flex-1 flex-col">{children}</main>
      <aside className="hidden w-80 border-l border-sidebar-border bg-sidebar/60 p-6 xl:block">
        <RightStatus statuses={statuses} />
      </aside>
    </div>
  );
}


