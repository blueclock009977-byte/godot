import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Idle Dungeon",
  description: "見下ろし型2D放置ハクスラRPG",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
