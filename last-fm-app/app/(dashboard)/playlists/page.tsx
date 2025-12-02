import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { getUserPlaylists } from "@/lib/playlist";
import { PlaylistsPageClient } from "./playlists-client";

export default async function PlaylistsPage() {
  const session = await getAuthSession();
  
  if (!session?.user) {
    redirect("/signin");
  }

  const playlists = await getUserPlaylists(session.user.id);

  return <PlaylistsPageClient initialPlaylists={playlists} />;
}

