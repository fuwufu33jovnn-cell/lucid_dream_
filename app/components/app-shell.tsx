"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "./auth-provider";
import { getAuthErrorMessage } from "../lib/auth-state";

type NavId = "today" | "ielts" | "language" | "career" | "route" | "progress" | "life";

const NAV_ITEMS: Array<{ id: NavId; href: string; label: string; mark: string }> = [
  { id: "today", href: "/", label: "Today", mark: "01" },
  { id: "ielts", href: "/ielts", label: "IELTS Exam", mark: "02" },
  { id: "language", href: "/language-lab", label: "Language Lab", mark: "03" },
  { id: "career", href: "/career", label: "Career Studio", mark: "04" },
  { id: "route", href: "/route-map", label: "Route Map", mark: "05" },
  { id: "progress", href: "/progress", label: "Progress", mark: "06" },
  { id: "life", href: "/life-abroad", label: "Life Abroad", mark: "07" },
];

export function AppShell({ active, children }: {
  active: NavId;
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutMessage, setSignOutMessage] = useState<string | null>(null);
  const displayName = typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : user?.email?.split("@")[0] || "Learner";
  const initials = displayName.slice(0, 2).toUpperCase();

  async function handleSignOut() {
    setSigningOut(true);
    setSignOutMessage(null);
    try {
      await signOut();
    } catch (error) {
      setSignOutMessage(getAuthErrorMessage(error));
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="app-frame">
      <aside className="side-rail">
        <Link className="brand" href="/" aria-label="LUCID DREAM home">
          <span className="brand-orbit" aria-hidden="true">◎</span>
          <span><strong>LUCID</strong><strong>DREAM</strong></span>
        </Link>
        <nav className="main-nav" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <Link aria-current={active === item.id ? "page" : undefined}
              className={active === item.id ? "nav-link is-active" : "nav-link"}
              href={item.href} key={item.id}>
              <span className="nav-mark">{item.mark}</span><span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="account-card">
          <span className="avatar" aria-hidden="true">{user ? initials : "LD"}</span>
          <span className="account-copy">
            <strong>{loading ? "Checking account" : user ? displayName : "Guest"}</strong>
            <small>{loading ? "" : user?.email || "Sign in to sync your practice"}</small>
          </span>
          {user ? (
            <button className="sign-out" type="button" onClick={handleSignOut} disabled={signingOut}>
              {signingOut ? "…" : "Sign out"}
            </button>
          ) : !loading && <Link className="sign-in" href="/login">Sign in</Link>}
          {signOutMessage && <p className="account-message" role="status">{signOutMessage}</p>}
        </div>
      </aside>
      <main className="main-canvas">{children}</main>
    </div>
  );
}
