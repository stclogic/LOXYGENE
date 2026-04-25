const DAILY_API_URL = process.env.DAILY_API_URL || "https://api.daily.co/v1";
const DAILY_API_KEY = process.env.DAILY_API_KEY ?? "";

// ── 단방향 방송 전용 ────────────────────────────────────────────────────────

/**
 * 고정 방 이름으로 Daily 방을 확인 후 없으면 생성 (멱등성 보장).
 * 게스트가 입장할 때마다 새 방이 생기지 않는다.
 */
export async function ensureBroadcastRoom(roomName: string) {
  if (!DAILY_API_KEY) throw new Error("DAILY_API_KEY not configured");

  // 이미 존재하는지 확인
  const existing = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
    headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
  });
  if (existing.ok) return existing.json();

  // 없으면 생성
  const res = await fetch(`${DAILY_API_URL}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${DAILY_API_KEY}` },
    body: JSON.stringify({
      name: roomName,
      privacy: "private",          // 토큰 없이 입장 불가
      properties: {
        max_participants: 500,
        enable_chat: false,
        enable_screenshare: false,
        enable_recording: false,
        owner_only_broadcast: true,
        eject_at_room_exp: false, // 방 만료 시 자동 퇴장 방지 → 미팅 유지
      },
    }),
  });
  if (!res.ok) throw new Error(`Daily room create failed: ${res.statusText}`);
  return res.json();
}

/**
 * 단방향 방송용 토큰 생성.
 * - 호스트: is_owner=true, can_send_audio/video=true
 * - 게스트: can_send_audio=false, can_send_video=false (시청 전용)
 */
export async function createBroadcastToken(
  roomName: string,
  userId: string,
  userName: string,
  isHost: boolean,
) {
  if (!DAILY_API_KEY) throw new Error("DAILY_API_KEY not configured");

  const res = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${DAILY_API_KEY}` },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_id: userId,
        user_name: userName,
        is_owner: isHost,
        can_send_audio: isHost,
        can_send_video: isHost,
        start_audio_off: !isHost,  // 게스트는 마이크 꺼진 채로 시작
        start_video_off: !isHost,
        enable_recording: false,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
      },
    }),
  });
  if (!res.ok) throw new Error(`Daily broadcast token failed: ${res.statusText}`);
  return res.json() as Promise<{ token: string }>;
}

export async function createDailyRoom(roomId: string, maxParticipants = 50) {
  if (!DAILY_API_KEY) throw new Error("DAILY_API_KEY not configured");
  const res = await fetch(`${DAILY_API_URL}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: roomId,
      privacy: "public",
      properties: {
        max_participants: maxParticipants,
        enable_chat: false,
        enable_screenshare: false,
        enable_recording: false,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
      },
    }),
  });
  if (!res.ok) throw new Error(`Daily room creation failed: ${res.statusText}`);
  return res.json() as Promise<{ id: string; name: string; url: string }>;
}

export async function createDailyToken(
  roomName: string,
  userId: string,
  userName: string,
  isOwner: boolean
) {
  if (!DAILY_API_KEY) throw new Error("DAILY_API_KEY not configured");
  const res = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_id: userId,
        user_name: userName,
        is_owner: isOwner,
        enable_recording: false,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
      },
    }),
  });
  if (!res.ok) throw new Error(`Daily token creation failed: ${res.statusText}`);
  return res.json() as Promise<{ token: string }>;
}
