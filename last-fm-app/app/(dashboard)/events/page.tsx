export default function EventsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 bg-gradient-to-b from-background via-background to-secondary/10 p-6 lg:px-10">
      <div className="glass-card rounded-xl border border-dashed border-primary/30 p-10 text-center">
        <h2 className="text-xl font-semibold text-foreground">Join event</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You&apos;ll see real-time listening events, album release parties,
          and IRL meetups here. We&apos;re building the experience—check back soon!
        </p>
      </div>
    </div>
  );
}


