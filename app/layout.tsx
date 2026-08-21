import type { Metadata } from "next";
import { AuthProvider } from "./components/auth-provider";
import "./globals.css";

const favicon =
  process.env.GITHUB_ACTIONS === "true"
    ? "/lucid_dream_/favicon.svg"
    : "/favicon.svg";

export const metadata: Metadata = {
  title: "LUCID DREAM",
  description: "Your calm route to English, work, and life abroad.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: favicon,
    shortcut: favicon,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
