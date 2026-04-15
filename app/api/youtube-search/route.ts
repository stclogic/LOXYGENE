import { NextRequest, NextResponse } from "next/server";

interface SearchItem {
  id: string;
  title: string;
  thumbnail: string;
}

const MOCK_RESULTS: SearchItem[] = [
  { id: "L26jSx5TZns", title: "안동역에서 - 진성 (가라오케)",           thumbnail: "" },
  { id: "mock002",     title: "사랑했나봐 - 이창원 (가라오케)",          thumbnail: "" },
  { id: "mock003",     title: "봄날 - BTS (가라오케)",                    thumbnail: "" },
  { id: "mock004",     title: "밤편지 - IU (가라오케)",                   thumbnail: "" },
  { id: "mock005",     title: "너를 위해 - 임재범 (가라오케)",            thumbnail: "" },
  { id: "mock006",     title: "사랑은 늘 도망가 - 임영웅 (가라오케)",    thumbnail: "" },
  { id: "mock007",     title: "미워도 다시 한번 - 남진 (가라오케)",      thumbnail: "" },
  { id: "mock008",     title: "칠갑산 - 주병선 (가라오케)",              thumbnail: "" },
  { id: "mock009",     title: "사랑했지만 - 김광석 (가라오케)",          thumbnail: "" },
  { id: "mock010",     title: "첫눈처럼 너에게 가겠다 - EXO (가라오케)", thumbnail: "" },
];

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") ?? "";
  const apiKey = process.env.YOUTUBE_API_KEY ?? "";

  if (!apiKey || apiKey === "your_youtube_api_key_here") {
    // Filter mock results by query for a realistic experience
    const lower = query.toLowerCase();
    const filtered = lower.length < 2
      ? MOCK_RESULTS
      : MOCK_RESULTS.filter(
          item =>
            item.title.toLowerCase().includes(lower) ||
            item.id.toLowerCase().includes(lower)
        );

    return NextResponse.json({
      items: filtered.slice(0, 8),
      isMock: true,
    });
  }

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", `${query} 가라오케`);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "8");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`YouTube API ${res.status}`);

    const data = (await res.json()) as {
      items?: Array<{
        id: { videoId: string };
        snippet: {
          title: string;
          thumbnails?: { default?: { url: string } };
        };
      }>;
    };

    const items: SearchItem[] = (data.items ?? []).map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.default?.url ?? "",
    }));

    return NextResponse.json({ items, isMock: false });
  } catch (err) {
    console.error("[youtube-search]", err);
    return NextResponse.json({ items: MOCK_RESULTS.slice(0, 8), isMock: true });
  }
}
