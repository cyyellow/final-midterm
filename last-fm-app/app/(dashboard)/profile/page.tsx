import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getUserById } from "@/lib/users";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  const user = await getUserById(session.user.id);

  return (
    <div className="flex flex-1 flex-col gap-6 bg-gradient-to-b from-background via-background to-secondary/10 p-6 lg:px-10">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">My profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
              Username
            </p>
            <p className="text-base font-medium text-foreground">
              {user?.username ?? "Set a username in onboarding"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
              Last.fm account
            </p>
            <p className="text-base font-medium text-foreground">
              {user?.lastfmUsername ?? session.user.lastfmUsername}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
              Bio
            </p>
            <p>
              {user?.bio ??
                "Add a bio soon. This section will highlight your music journey and achievements."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


