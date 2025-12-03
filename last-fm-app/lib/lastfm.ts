import crypto from "crypto";

const BASE_URL = "https://ws.audioscrobbler.com/2.0/";

export type LastfmTrack = {
  name: string;
  url: string;
  artist: {
    "#text": string;
    mbid?: string;
  };
  album?: {
    "#text": string;
    mbid?: string;
  };
  date?: {
    uts: string;
    "#text": string;
  };
  image?: Array<{
    size: "small" | "medium" | "large" | "extralarge" | "mega";
    "#text": string;
  }>;
  "@attr"?: {
    nowplaying?: "true";
  };
};

export type LastfmArtist = {
  name: string;
  playcount: string;
  mbid?: string;
  url: string;
  image?: Array<{
    size: string;
    "#text": string;
  }>;
};

export type LastfmUser = {
  name: string;
  realname?: string;
  url: string;
  country?: string;
  image?: Array<{
    size: string;
    "#text": string;
  }>;
  playcount?: string;
  registered?: {
    unixtime: string;
  };
};

function getApiKey() {
  const key = process.env.LASTFM_API_KEY;
  if (!key) {
    throw new Error("Missing LASTFM_API_KEY environment variable");
  }
  return key;
}

function getApiSecret() {
  const secret = process.env.LASTFM_API_SECRET;
  if (!secret) {
    throw new Error("Missing LASTFM_API_SECRET environment variable");
  }
  return secret;
}

function buildUrl(params: Record<string, string>) {
  const searchParams = new URLSearchParams({
    api_key: getApiKey(),
    format: "json",
    ...params,
  });

  return `${BASE_URL}?${searchParams.toString()}`;
}

async function fetchLastfm<T>(
  params: Record<string, string>,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(buildUrl(params), {
    ...options,
    headers: {
      ...(options?.headers ?? {}),
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Last.fm request failed: ${res.status} ${res.statusText} - ${body}`,
    );
  }

  return res.json() as Promise<T>;
}

export async function getRecentTracks(username: string, limit = 20) {
  const data = await fetchLastfm<{
    recenttracks?: {
      track?: LastfmTrack[];
    };
  }>({
    method: "user.getRecentTracks",
    user: username,
    limit: limit.toString(),
  });

  return data.recenttracks?.track ?? [];
}

export async function getNowPlaying(username: string) {
  const tracks = await getRecentTracks(username, 1);
  const [track] = tracks;
  return track && track["@attr"]?.nowplaying === "true" ? track : null;
}

export async function getTopArtists(username: string, limit = 5, period = "7day") {
  const data = await fetchLastfm<{
    topartists?: {
      artist?: LastfmArtist[];
    };
  }>({
    method: "user.getTopArtists",
    user: username,
    limit: limit.toString(),
    period,
  });

  return data.topartists?.artist ?? [];
}

export async function getWeeklyTopArtists(username: string) {
  const data = await fetchLastfm<{
    weeklyartistchart?: {
      artist?: LastfmArtist[];
    };
  }>({
    method: "user.getweeklyartistchart",
    user: username,
  });

  return data.weeklyartistchart?.artist ?? [];
}

export async function searchTracks(query: string, limit = 20) {
  const data = await fetchLastfm<{
    results?: {
      trackmatches?: {
        track?: Array<{
          name: string;
          artist: string;
          url: string;
          image?: Array<{
            size: string;
            "#text": string;
          }>;
        }>;
      };
    };
  }>({
    method: "track.search",
    track: query,
    limit: limit.toString(),
  });

  // Normalize the search results to match LastfmTrack structure approximately
  return (data.results?.trackmatches?.track ?? []).map((track) => ({
    name: track.name,
    url: track.url,
    artist: {
      "#text": track.artist,
    },
    image: track.image,
  }));
}

export async function requestSession(token: string) {
  const method = "auth.getSession";
  const apiKey = getApiKey();
  const secret = getApiSecret();

  const params = {
    api_key: apiKey,
    method,
    token,
  };

  const signatureBase =
    Object.keys(params)
      .sort()
      .map((key) => `${key}${params[key as keyof typeof params]}`)
      .join("") + secret;

  const apiSig = crypto
    .createHash("md5")
    .update(signatureBase, "utf8")
    .digest("hex");

  const data = await fetchLastfm<{
    session?: {
      name: string;
      key: string;
      subscriber: number;
    };
  }>({
    method,
    token,
    api_sig: apiSig,
  });

  if (!data.session?.key) {
    throw new Error("Failed to exchange Last.fm token for a session");
  }

  return data.session;
}

export async function getUserInfo(sessionKey: string) {
  const data = await fetchLastfm<{
    user?: LastfmUser;
  }>({
    method: "user.getInfo",
    sk: sessionKey,
  });

  if (!data.user?.name) {
    throw new Error("Failed to load Last.fm user profile");
  }

  return data.user;
}

export async function getAuthToken(token: string) {
  const session = await requestSession(token);
  return session.key;
}

export type LastfmAlbum = {
  name: string;
  artist: string;
  playcount?: string;
  url: string;
  image?: Array<{
    size: "small" | "medium" | "large" | "extralarge" | "mega";
    "#text": string;
  }>;
};

export async function getTopAlbums(artist: string, limit = 1) {
  const data = await fetchLastfm<{
    topalbums?: {
      album?: LastfmAlbum[];
    };
  }>({
    method: "artist.getTopAlbums",
    artist: artist,
    limit: limit.toString(),
  });

  return data.topalbums?.album ?? [];
}

export async function getUserListeningStats(username: string, from?: number, to?: number) {
  // Get all recent tracks for the period
  const limit = 1000; // Last.fm API max limit per request
  const data = await fetchLastfm<{
    recenttracks?: {
      track?: LastfmTrack[];
      "@attr"?: {
        totalPages?: string;
        page?: string;
        total?: string;
        perPage?: string;
      };
    };
  }>({
    method: "user.getRecentTracks",
    user: username,
    limit: limit.toString(),
    ...(from && { from: from.toString() }),
    ...(to && { to: to.toString() }),
  });

  const tracks = data.recenttracks?.track ?? [];
  const totalPages = parseInt(data.recenttracks?.["@attr"]?.totalPages || "1");
  
  // If there are more pages, we'd need to fetch them (for now, we'll use the first page)
  // For a full recap, you'd want to paginate through all pages
  
  return {
    tracks,
    totalScrobbles: parseInt(data.recenttracks?.["@attr"]?.total || "0"),
    totalPages,
  };
}

export async function getTopTracks(username: string, limit = 50, period: "7day" | "1month" | "3month" | "6month" | "12month" | "overall" = "overall") {
  const data = await fetchLastfm<{
    toptracks?: {
      track?: Array<{
        name: string;
        artist: {
          "#text": string;
          mbid?: string;
        };
        playcount: string;
        url: string;
        image?: Array<{
          size: string;
          "#text": string;
        }>;
      }>;
    };
  }>({
    method: "user.getTopTracks",
    user: username,
    limit: limit.toString(),
    period,
  });

  return data.toptracks?.track ?? [];
}

