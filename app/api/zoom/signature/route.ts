import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { sessionName, role } = (await req.json()) as {
    sessionName: string;
    role: number;
  };

  const sdkKey = process.env.NEXT_PUBLIC_ZOOM_SDK_KEY ?? "";
  const sdkSecret = process.env.ZOOM_SDK_SECRET ?? "";

  if (
    !sdkKey ||
    !sdkSecret ||
    sdkKey === "your_zoom_sdk_key_here" ||
    sdkSecret === "your_zoom_sdk_secret_here"
  ) {
    return NextResponse.json({ signature: "mock-signature", isMock: true });
  }

  const iat = Math.round(Date.now() / 1000) - 30;
  const exp = iat + 60 * 60 * 2; // 2 hours

  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    app_key: sdkKey,
    tpc: sessionName,
    role_type: role === 1 ? 1 : 0,
    version: 1,
    iat,
    exp,
  };

  const sHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const sPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sigInput = `${sHeader}.${sPayload}`;

  const signature = crypto
    .createHmac("sha256", sdkSecret)
    .update(sigInput)
    .digest("base64url");

  return NextResponse.json({
    signature: `${sigInput}.${signature}`,
    isMock: false,
  });
}
