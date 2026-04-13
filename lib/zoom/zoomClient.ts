import ZoomVideo from "@zoom/videosdk";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ZoomParticipant {
  userId: number;
  displayName: string;
  isHost: boolean;
  isAudioMuted: boolean;
  isVideoOn: boolean;
  bVideoOn: boolean;
  sharerOn?: boolean;
}

export interface ZoomSession {
  sessionName: string;
  sessionPassword?: string;
  userName: string;
  role: 0 | 1; // 0 = attendee, 1 = host
}

export type ZoomClientType = ReturnType<typeof ZoomVideo.createClient>;
export type ZoomStreamType = ReturnType<ZoomClientType["getMediaStream"]>;

// ── Singleton client ──────────────────────────────────────────────────────────

let _client: ZoomClientType | null = null;

export function getZoomClient(): ZoomClientType {
  if (!_client) {
    _client = ZoomVideo.createClient();
  }
  return _client;
}

export function resetZoomClient(): void {
  _client = null;
}

// ── Signature generation (mock) ───────────────────────────────────────────────
// In production, this should be called from a secure server endpoint.
// Never expose SDK_SECRET in client-side code outside of development.

export async function generateSignature(
  sessionName: string,
  role: 0 | 1
): Promise<string> {
  const sdkKey = process.env.NEXT_PUBLIC_ZOOM_SDK_KEY ?? "";
  const sdkSecret = process.env.NEXT_PUBLIC_ZOOM_SDK_SECRET ?? "";

  if (!sdkKey || sdkKey === "your_zoom_sdk_key_here") {
    // Return a mock signature for development/demo mode
    console.warn("[ZoomClient] SDK credentials not configured — using mock signature.");
    return "mock_signature_for_development";
  }

  // Production: call your own API route that signs with HMAC-SHA256
  try {
    const res = await fetch("/api/zoom/signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionName, role, sdkKey }),
    });
    if (!res.ok) throw new Error("Signature endpoint returned " + res.status);
    const data = await res.json() as { signature: string };
    return data.signature;
  } catch (err) {
    console.error("[ZoomClient] Signature generation failed:", err);
    return "mock_signature_fallback";
  }
}

export default ZoomVideo;
