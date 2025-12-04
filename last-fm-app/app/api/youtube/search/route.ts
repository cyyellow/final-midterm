import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 },
    );
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error("YOUTUBE_API_KEY is not configured");
    return NextResponse.json(
      { error: "YouTube API key not configured" },
      { status: 500 },
    );
  }

  try {
    const searchQuery = encodeURIComponent(query);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${searchQuery}&key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error("YouTube API error:", response.status, response.statusText);
      return NextResponse.json(
        { error: "YouTube API request failed" },
        { status: 502 },
      );
    }

    const data = await response.json();

    if (data.items && data.items.length > 0 && data.items[0].id?.videoId) {
      const videoId: string = data.items[0].id.videoId;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

      return NextResponse.json({ videoId, videoUrl });
    }

    return NextResponse.json(
      { error: "No video found for query" },
      { status: 404 },
    );
  } catch (error) {
    console.error("YouTube search error:", error);
    return NextResponse.json(
      { error: "Failed to search YouTube" },
      { status: 500 },
    );
  }
}


