import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/onboarding-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthSession } from "@/lib/auth";

function createSuggestedUsername(lastfmUsername: string | null) {
  const base =
    lastfmUsername?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() ?? "listener";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base.slice(0, 10)}${suffix}`;
}

export default async function OnboardingPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/signin");
  }

  if (session.user.username) {
    redirect("/");
  }

  const suggestedUsername = createSuggestedUsername(
    session.user.lastfmUsername,
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/20 px-4 py-16">
      <Card className="w-full max-w-lg border border-border/60 bg-card/70 backdrop-blur">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold text-foreground">
            Create your next.fm identity
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            You&apos;re connected with Last.fm. Choose a username to keep your
            profile anonymous while sharing your listening story.
          </p>
        </CardHeader>
        <CardContent>
          <OnboardingForm suggestedUsername={suggestedUsername} />
        </CardContent>
      </Card>
    </div>
  );
}


