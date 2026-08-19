import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LUCID DREAM",
  description: "Your calm route to English, work, and life abroad.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
