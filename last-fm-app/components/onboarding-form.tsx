"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type OnboardingFormProps = {
  suggestedUsername: string;
};

export function OnboardingForm({ suggestedUsername }: OnboardingFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState<string>(suggestedUsername);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username.trim()) {
      setError("Please choose a username to continue.");
      return;
    }

    startTransition(async () => {
      setError(null);

      const response = await fetch("/api/user/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        setError(json?.error ?? "Unable to save username. Please try again.");
        return;
      }

      router.replace("/");
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="username">Choose your display username</Label>
        <Input
          id="username"
          name="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="e.g. cosmicbeats"
          autoComplete="off"
          maxLength={24}
          required
        />
        <p className="text-xs text-muted-foreground">
          This username keeps you anonymous on next.fm. Your Last.fm handle
          remains private.
        </p>
      </div>
      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" size="lg" disabled={isPending}>
        {isPending ? "Creating profile…" : "Continue"}
      </Button>
    </form>
  );
}


