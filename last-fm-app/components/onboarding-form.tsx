"use client";

import { useState, useTransition, useMemo } from "react";
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

  // Real-time validation for username
  const usernameValidation = useMemo(() => {
    if (!username.trim()) return null;
    
    const trimmed = username.trim();
    if (trimmed.length < 3) {
      return "Username must be at least 3 characters long.";
    }
    if (trimmed.length > 15) {
      return "Username must be at most 15 characters long.";
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return "Usernames can only include letters, numbers, and underscores.";
    }
    return null;
  }, [username]);

  // Real-time validation for display name
  const displayNameValidation = useMemo(() => {
    if (!displayName.trim()) return null;
    
    if (displayName.length > 50) {
      return "Display name must be at most 50 characters long.";
    }
    return null;
  }, [displayName]);

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
          maxLength={15}
          required
          className={usernameValidation ? "border-destructive" : ""}
        />
        {usernameValidation ? (
          <p className="text-xs text-destructive">
            {usernameValidation}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Your unique username for login and profile URL. Letters, numbers, and underscores only.
          </p>
        )}
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
          className={displayNameValidation ? "border-destructive" : ""}
        />
        {displayNameValidation ? (
          <p className="text-xs text-destructive">
            {displayNameValidation}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Your display name shown to others. Can include spaces and special characters.
          </p>
        )}
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button 
        type="submit" 
        className="w-full" 
        size="lg" 
        disabled={isPending || !!usernameValidation || !!displayNameValidation}
      >
        {isPending ? "Creating profile…" : "Continue"}
      </Button>
    </form>
  );
}


