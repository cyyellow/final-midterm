export interface Post {
  _id: string;
  userId: string;
  username: string;
  userImage?: string;
  track: {
    name: string;
    artist: string;
    album?: string;
    image?: string;
    url?: string;
  };
  thoughts: string;
  createdAt: Date;
  likes?: number;
}

export interface CreatePostInput {
  track: {
    name: string;
    artist: string;
    album?: string;
    image?: string;
    url?: string;
  };
  thoughts: string;
}

