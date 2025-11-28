"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OnboardingForm() {
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username.trim()) {
      setError("Please choose a username to continue.");
      return;
    }

    if (!displayName.trim()) {
      setError("Please enter a nickname to continue.");
      return;
    }

    startTransition(async () => {
      setError(null);

      const response = await fetch("/api/user/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, displayName }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        setError(json?.error ?? "Unable to save profile. Please try again.");
        return;
      }

      router.replace("/");
      router.refresh();
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
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
          Your unique username for login and profile URL. Letters, numbers, and underscores only.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Nickname (Display Name)</Label>
        <Input
          id="displayName"
          name="displayName"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="e.g. Cosmic Beats"
          autoComplete="off"
          maxLength={50}
          required
        />
        <p className="text-xs text-muted-foreground">
          Your display name shown to others. Can include spaces and special characters.
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


