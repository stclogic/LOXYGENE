import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./Providers";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "L'Oxygène | High-End Digital Nightlife",
  description: "하이엔드 가상 소셜 라운지. 가라오케, 파티, VVIP 룸.",
  keywords: "가라오케, 온라인 파티, 화상채팅, 노래방, 하이엔드 클럽",
  openGraph: {
    title: "L'Oxygène",
    description: "하이엔드 가상 소셜 라운지",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${outfit.className} h-full`}>
      <body className="min-h-full bg-[#070707] text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
