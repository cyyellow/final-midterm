import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { getPlaylistById } from "@/lib/playlist";
import { getUserById } from "@/lib/users";
import { PlaylistDetailClient } from "./playlist-detail-client";

export default async function PlaylistDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getAuthSession();
  
  if (!session?.user) {
    redirect("/signin");
  }

  const { id } = await params;
  const playlist = await getPlaylistById(session.user.id, id);

  if (!playlist) {
    redirect("/playlists");
  }

  const isOwner = playlist.userId === session.user.id;
  
  // Get owner info if not the owner (to display who shared it)
  let ownerUsername = "";
  if (!isOwner) {
    const owner = await getUserById(playlist.userId);
    ownerUsername = owner?.username || owner?.displayName || "Unknown";
  }

  return (
    <PlaylistDetailClient 
      initialPlaylist={playlist}
      username={session.user.lastfmUsername || ""}
      isOwner={isOwner}
      ownerUsername={!isOwner ? ownerUsername : undefined}
    />
  );
}

