import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Proxy file (Next.js 16+ convention replacing middleware.ts).
// Admin role is verified client-side in app/admin/page.tsx using localStorage.
// This proxy handles basic path matching and can be extended for
// cookie-based session tokens in a production environment.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes: allow through — client-side guard in the page component
  // will redirect non-admins to "/" using localStorage role check.
  if (pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Payments routes: pass through
  if (pathname.startsWith("/payments")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/payments/:path*"],
};
