/**
 * Get the best music link for a track
 * Priority: Custom URL (YouTube/Spotify) > YouTube Search > Last.fm URL
 */
export function getMusicLink(track: {
  name: string;
  artist: string;
  url?: string | null;
}): string {
  // If there's a custom URL and it's YouTube or Spotify, use it
  if (track.url) {
    const url = track.url.toLowerCase();
    if (
      url.includes("youtube.com") ||
      url.includes("youtu.be") ||
      url.includes("spotify.com") ||
      url.includes("apple.com/music") ||
      url.includes("music.apple.com")
    ) {
      return track.url;
    }
  }

  // Otherwise, generate YouTube search link
  const query = encodeURIComponent(`${track.name} ${track.artist}`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

