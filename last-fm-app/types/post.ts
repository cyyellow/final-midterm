export interface Comment {
  _id: string;
  userId: string;
  username: string;
  userImage?: string;
  content: string;
  createdAt: Date;
}

export interface Post {
  _id: string;
  userId: string;
  username: string;
  displayName?: string;
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
  visibility?: "public" | "friends" | "private";
  comments?: Comment[];
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
  visibility?: "public" | "friends" | "private";
}



