import type { Metadata } from "next";
import "./globals.css";
import "./floating-study-window-overrides.css";

const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "LUCID DREAM",
  description: "Your calm route to English, work, and life abroad.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: `${publicBasePath}/favicon.svg`,
    shortcut: `${publicBasePath}/favicon.svg`,
    apple: `${publicBasePath}/brand/logo-concept-a.svg`,
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
