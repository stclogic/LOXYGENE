const DAILY_API_URL = process.env.DAILY_API_URL || "https://api.daily.co/v1";
const DAILY_API_KEY = process.env.DAILY_API_KEY ?? "";

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
