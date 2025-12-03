import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { getPlaylistByIdPublic, type Playlist } from "@/lib/playlist";
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
  
  // Allow editing if: owner, collaborator with edit permission, or public playlist with allowPublicEdit
  const canEdit = isOwner || hasEditPermission || (playlist.isPublic && playlist.allowPublicEdit);

  return (
    <PlaylistDetailClient
      initialPlaylist={playlist as Playlist}
      username={session.user.lastfmUsername || ""}
      canEdit={canEdit}
      isOwner={isOwner}
    />
  );
}

