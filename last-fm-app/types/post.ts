export interface Post {
  _id: string;
  userId: string;
  username: string;
  userImage?: string;
  track?: {
    name: string;
    artist: string;
    album?: string;
    image?: string;
    url?: string;
  };
  playlistId?: string;
  playlistName?: string;
  playlistImage?: string;
  playlistTrackCount?: number;
  thoughts: string;
  createdAt: Date;
  likes?: number;
  isPublic?: boolean;
}

export interface CreatePostInput {
  track?: {
    name: string;
    artist: string;
    album?: string;
    image?: string;
    url?: string;
  };
  playlistId?: string;
  playlistName?: string;
  playlistImage?: string;
  playlistTrackCount?: number;
  thoughts: string;
  isPublic?: boolean;
}



