import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { getPlaylistById } from "@/lib/playlist";
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
  const playlist = await getPlaylistById(session.user.id, id);

  if (!playlist) {
    redirect("/playlists");
  }

  return (
    <PlaylistDetailClient 
      initialPlaylist={playlist}
      username={session.user.lastfmUsername || ""}
    />
  );
}

