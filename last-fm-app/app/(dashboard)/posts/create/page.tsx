export default function CreatePostPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 bg-gradient-to-b from-background via-background to-secondary/10 p-6 lg:px-10">
      <div className="glass-card rounded-xl border border-dashed border-primary/30 p-10 text-center">
        <h2 className="text-xl font-semibold text-foreground">Create a post</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Soon you&apos;ll be able to share your favourite tracks, tag friends,
          and highlight listening milestones. For now, brainstorm your first post!
        </p>
      </div>
    </div>
  );
}


