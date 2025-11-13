"use client";

import { useTransition } from "react";
import { LogIn } from "lucide-react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";

type SignInButtonProps = {
  label?: string;
};

export function SignInButton({ label = "Sign in with Last.fm" }: SignInButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await signIn("lastfm", { callbackUrl: "/" });
    });
  };

  return (
    <Button
      className="w-full gap-2"
      size="lg"
      onClick={handleClick}
      disabled={isPending}
    >
      <LogIn className="h-4 w-4" />
      {isPending ? "Connecting…" : label}
    </Button>
  );
}


