import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { getPlaylistByIdPublic, type Playlist } from "@/lib/playlist";
import { getUserById } from "@/lib/users";
import { PlaylistDetailClient } from "./playlist-detail-client";

export default async function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/signin");
  }

  const { id } = await params;

  const playlist = await getPlaylistByIdPublic(id);

  if (!playlist) {
    redirect("/playlists");
  }

  const currentUserId = session.user.id;

  const isOwner = playlist.userId === currentUserId;
  const hasEditPermission =
    playlist.collaborators?.some(
      (collab) => collab.userId === currentUserId && collab.permission === "edit"
    ) ?? false;

  const canEdit = isOwner || hasEditPermission;

  // Get owner info if not the owner (to display who shared it)
  let ownerUsername: string | undefined;
  if (!isOwner) {
    const owner = await getUserById(playlist.userId);
    ownerUsername = owner?.username || owner?.displayName || "Unknown";
  }

  return (
    <PlaylistDetailClient
      initialPlaylist={playlist as Playlist}
      username={session.user.lastfmUsername || ""}
      isOwner={isOwner}
      canEdit={canEdit}
      ownerUsername={ownerUsername}
    />
  );
}

