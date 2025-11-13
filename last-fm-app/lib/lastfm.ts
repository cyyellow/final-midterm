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

