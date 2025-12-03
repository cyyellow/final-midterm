import { ObjectId } from "mongodb";
import { clientPromise } from "./mongodb";

export type PlaylistTrack = {
  name: string;
  artist: string;
  album?: string;
  image?: string;
  url?: string;
  addedAt: Date;
};

export type PlaylistPermission = "view" | "edit";

export type PlaylistCollaborator = {
  userId: string;
  permission: PlaylistPermission;
  addedAt: Date;
};

export type Playlist = {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  image?: string;
  tracks: PlaylistTrack[];
  isPinned?: boolean;
  isPublic?: boolean;
  collaborators?: PlaylistCollaborator[];
  createdAt: Date;
  updatedAt: Date;
};

export async function getPlaylistCollection() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB).collection<Playlist>("playlists");
}

export async function getUserPlaylists(userId: string): Promise<Playlist[]> {
  const collection = await getPlaylistCollection();
  const playlists = await collection.find({ userId }).sort({ createdAt: -1 }).toArray();
  
  return playlists.map(p => ({
    ...p,
    _id: p._id.toString(),
  })) as Playlist[];
}

export async function getPlaylistById(userId: string, playlistId: string): Promise<Playlist | null> {
  const collection = await getPlaylistCollection();
  // Allow fetching if user owns it OR if it's public
  const playlist = await collection.findOne({ 
    _id: new ObjectId(playlistId),
    $or: [
      { userId },
      { isPublic: true }
    ]
  });
  
  if (!playlist) return null;
  
  return {
    ...playlist,
    _id: playlist._id.toString(),
  } as Playlist;
}

// Get playlist by ID without userId check (for public access)
export async function getPlaylistByIdPublic(playlistId: string): Promise<Playlist | null> {
  const collection = await getPlaylistCollection();
  const playlist = await collection.findOne({ 
    _id: new ObjectId(playlistId),
    isPublic: true
  });
  
  if (!playlist) return null;
  
  return {
    ...playlist,
    _id: playlist._id.toString(),
  } as Playlist;
}

export async function getHomepagePlaylist(userId: string): Promise<Playlist | null> {
  const collection = await getPlaylistCollection();
  
  // 1. Try to find pinned playlist
  const pinned = await collection.findOne({ userId, isPinned: true });
  if (pinned) {
    return { ...pinned, _id: pinned._id.toString() } as Playlist;
  }

  // 2. If no pinned, return a random one (or the first one/latest one)
  // For "Daily Random", we could seed a random selection based on date, 
  // but for simplicity, let's just pick one randomly or the latest for now if no playlists.
  const playlists = await collection.find({ userId }).toArray();
  
  if (playlists.length === 0) return null;

  // Simple random for now
  const random = playlists[Math.floor(Math.random() * playlists.length)];
  return { ...random, _id: random._id.toString() } as Playlist;
}

export async function createPlaylist(userId: string, name: string, description?: string, image?: string) {
  const collection = await getPlaylistCollection();
  
  const playlist: Omit<Playlist, "_id"> = {
    userId,
    name,
    description,
    image,
    tracks: [],
    isPinned: false,
    collaborators: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(playlist as any);
  return { ...playlist, _id: result.insertedId.toString() };
}

export async function updatePlaylist(userId: string, playlistId: string, updates: Partial<Playlist>) {
  const collection = await getPlaylistCollection();
  
  // Verify user owns the playlist
  const playlist = await collection.findOne({ _id: new ObjectId(playlistId), userId });
  if (!playlist) {
    throw new Error("Playlist not found or you don't have permission to modify it");
  }
  
  if (updates.isPinned) {
    // Unpin others if this one is being pinned
    await collection.updateMany(
      { userId, _id: { $ne: new ObjectId(playlistId) } },
      { $set: { isPinned: false } }
    );
  }

  await collection.updateOne(
    { _id: new ObjectId(playlistId), userId },
    { 
      $set: { 
        ...updates, 
        updatedAt: new Date() 
      } 
    }
  );
  
  return { success: true };
}

export async function deletePlaylist(userId: string, playlistId: string) {
  const collection = await getPlaylistCollection();
  await collection.deleteOne({ _id: new ObjectId(playlistId), userId });
  return { success: true };
}

export async function addTrackToPlaylist(
  userId: string,
  playlistId: string,
  track: Omit<PlaylistTrack, "addedAt">
) {
  const collection = await getPlaylistCollection();

  // Verify user owns the playlist
  const playlist = await collection.findOne({ _id: new ObjectId(playlistId), userId });
  if (!playlist) {
    throw new Error("Playlist not found or you don't have permission to modify it");
  }

  // Prevent duplicate tracks by URL (if provided)
  if (track.url && playlist.tracks?.some((t) => t.url === track.url)) {
    return { success: false, reason: "duplicate" as const };
  }

  await collection.updateOne(
    { _id: new ObjectId(playlistId), userId },
    {
      $push: {
        tracks: {
          ...track,
          addedAt: new Date(),
        },
      },
      $set: { updatedAt: new Date() },
    }
  );

  return { success: true as const };
}

export async function removeTrackFromPlaylist(userId: string, playlistId: string, trackUrl: string) {
  const collection = await getPlaylistCollection();
  
  // Verify user owns the playlist
  const playlist = await collection.findOne({ _id: new ObjectId(playlistId), userId });
  if (!playlist) {
    throw new Error("Playlist not found or you don't have permission to modify it");
  }
  
  await collection.updateOne(
    { _id: new ObjectId(playlistId), userId },
    {
      $pull: { tracks: { url: trackUrl } },
      $set: { updatedAt: new Date() }
    }
  );

  return { success: true };
}
