import Link from "next/link";
import { redirect } from "next/navigation";

import { SignInButton } from "@/components/sign-in-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthSession } from "@/lib/auth";

export default async function SignInPage() {
  const session = await getAuthSession();

  if (session?.user?.username) {
    redirect("/");
  }

  if (session?.user && !session.user.username) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/20 px-4 py-16">
      <Card className="w-full max-w-md border border-border/60 bg-card/70 backdrop-blur">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold text-foreground">
            Welcome to next.fm
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Connect your Last.fm account to unlock a social listening feed
            tailored just for you.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <SignInButton />
          <p className="text-xs text-muted-foreground">
            By signing in, you agree to our{" "}
            <Link href="#" className="text-primary hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


