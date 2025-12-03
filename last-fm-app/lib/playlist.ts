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
  allowPublicEdit?: boolean;
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
  const playlist = await collection.findOne({ 
    _id: new ObjectId(playlistId), 
    userId 
  });
  
  if (!playlist) return null;
  
  return {
    ...playlist,
    _id: playlist._id.toString(),
  } as Playlist;
}

// Public access: fetch playlist by id without requiring ownership.
// Use this for read-only views where we still want to restrict edits
// based on ownership/collaborator permissions on the caller side.
export async function getPlaylistByIdPublic(playlistId: string): Promise<Playlist | null> {
  const collection = await getPlaylistCollection();
  const playlist = await collection.findOne({
    _id: new ObjectId(playlistId),
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
    isPublic: false,
    allowPublicEdit: false,
    collaborators: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(playlist as any);
  return { ...playlist, _id: result.insertedId.toString() };
}

export async function copyPlaylist(userId: string, sourcePlaylist: Playlist, newName?: string): Promise<Playlist> {
  const collection = await getPlaylistCollection();
  
  // Generate name: "Copy of [original name]" or use provided name
  const playlistName = newName || `Copy of ${sourcePlaylist.name}`;
  
  const newPlaylist: Omit<Playlist, "_id"> = {
    userId,
    name: playlistName,
    description: sourcePlaylist.description,
    image: sourcePlaylist.image,
    tracks: [...sourcePlaylist.tracks], // Copy all tracks
    isPinned: false,
    isPublic: false,
    allowPublicEdit: false,
    collaborators: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(newPlaylist as any);
  return { ...newPlaylist, _id: result.insertedId.toString() };
}

export async function checkPlaylistEditPermission(
  userId: string,
  playlistId: string
): Promise<{ canEdit: boolean; isOwner: boolean }> {
  const collection = await getPlaylistCollection();
  const playlist = await collection.findOne({ _id: new ObjectId(playlistId) });
  
  if (!playlist) {
    return { canEdit: false, isOwner: false };
  }
  
  const isOwner = playlist.userId === userId;
  const hasEditPermission =
    playlist.collaborators?.some(
      (collab: any) => collab.userId === userId && collab.permission === "edit"
    ) ?? false;
  
  const canEditPublic = playlist.isPublic && playlist.allowPublicEdit;
  
  return {
    canEdit: isOwner || hasEditPermission || canEditPublic,
    isOwner,
  };
}

export async function updatePlaylist(userId: string, playlistId: string, updates: Partial<Playlist>) {
  const collection = await getPlaylistCollection();
  
  // Check permissions
  const { canEdit, isOwner } = await checkPlaylistEditPermission(userId, playlistId);
  if (!canEdit) {
    throw new Error("No permission to edit this playlist");
  }
  
  // Only owner can change isPinned, isPublic, allowPublicEdit
  if (!isOwner && (updates.isPinned !== undefined || updates.isPublic !== undefined || updates.allowPublicEdit !== undefined)) {
    throw new Error("Only owner can change these settings");
  }
  
  if (updates.isPinned && isOwner) {
    // Unpin others if this one is being pinned
    await collection.updateMany(
      { userId, _id: { $ne: new ObjectId(playlistId) } },
      { $set: { isPinned: false } }
    );
  }

  await collection.updateOne(
    { _id: new ObjectId(playlistId) },
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

export async function addTrackToPlaylist(userId: string, playlistId: string, track: Omit<PlaylistTrack, "addedAt">) {
  const collection = await getPlaylistCollection();
  
  // Check permissions
  const { canEdit } = await checkPlaylistEditPermission(userId, playlistId);
  if (!canEdit) {
    return { success: false, reason: "no_permission" };
  }
  
  // Check for duplicates
  const playlist = await collection.findOne({ _id: new ObjectId(playlistId) });
  if (playlist && playlist.tracks.some((t: any) => t.url === track.url)) {
    return { success: false, reason: "duplicate" };
  }
  
  await collection.updateOne(
    { _id: new ObjectId(playlistId) },
    {
      $push: { 
        tracks: { 
          ...track, 
          addedAt: new Date() 
        } 
      },
      $set: { updatedAt: new Date() }
    }
  );
  
  return { success: true };
}

export async function removeTrackFromPlaylist(userId: string, playlistId: string, url: string) {
  const collection = await getPlaylistCollection();
  
  // Check permissions
  const { canEdit } = await checkPlaylistEditPermission(userId, playlistId);
  if (!canEdit) {
    throw new Error("No permission to edit this playlist");
  }
  
  await collection.updateOne(
    { _id: new ObjectId(playlistId) },
    {
      $pull: { tracks: { url } },
      $set: { updatedAt: new Date() }
    }
  );
  
  return { success: true };
}
