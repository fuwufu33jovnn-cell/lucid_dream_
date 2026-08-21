"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  createPasswordRecoveryController,
  getAuthErrorMessage,
  getRecoveryRedirectUrl,
  isValidEmail,
  validateCredentials,
  validatePasswordReset,
} from "../lib/auth-state";
import { getSupabaseBrowserClient } from "../lib/supabase";

type AuthMode = "login" | "signup" | "recover";

const copy: Record<AuthMode, { title: string; intro: string; submit: string }> = {
  login: { title: "Welcome back", intro: "Sign in to keep your practice connected.", submit: "Sign in" },
  signup: { title: "Create your account", intro: "Use an email address you can verify.", submit: "Create account" },
  recover: { title: "Reset your password", intro: "We’ll send a reset link to your email address.", submit: "Send reset link" },
};

const passwordUpdateCopy = {
  title: "Choose a new password",
  intro: "Use a password with at least 8 characters.",
  submit: "Update password",
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const [activeMode, setActiveMode] = useState(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [, rerender] = useState(0);
  const client = getSupabaseBrowserClient();
  const recoveryController = useMemo(
    () => createPasswordRecoveryController(client, () => rerender((count) => count + 1)),
    [client],
  );
  const recoveryState = recoveryController.getState();
  const isPasswordUpdate = activeMode === "recover" && recoveryState.canUpdatePassword;
  const isRecoveryRequest = activeMode === "recover" && !isPasswordUpdate;
  const currentCopy = isPasswordUpdate ? passwordUpdateCopy : copy[activeMode];

  useEffect(() => {
    if (mode !== "recover") return;
    void recoveryController.start();
    return () => recoveryController.stop();
  }, [mode, recoveryController]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = isPasswordUpdate
      ? validatePasswordReset({ password, confirmation })
      : isRecoveryRequest
      ? (isValidEmail(email) ? null : "Enter a valid email address.")
      : validateCredentials({ email, password });
    if (validation) {
      setStatus(validation);
      return;
    }

    if (!client) {
      setStatus("Sign-in is not set up yet. Add the public Supabase configuration and try again.");
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      if (isPasswordUpdate) {
        await recoveryController.updatePassword(password);
        setPassword("");
        setConfirmation("");
        setResetComplete(true);
        setStatus("Your password has been updated. You can sign in now.");
      } else if (activeMode === "login") {
        const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        setStatus("You’re signed in. You can return to your practice.");
      } else if (activeMode === "signup") {
        const { error } = await client.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        setStatus("Check your inbox to verify your email, then sign in.");
      } else {
        const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: getRecoveryRedirectUrl(window.location.origin),
        });
        if (error) throw error;
        setStatus("If that address is registered, a reset link is on its way.");
      }
    } catch (error) {
      setStatus(getAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-panel" aria-labelledby="auth-title">
      <p className="eyebrow">LUCID DREAM ACCOUNT</p>
      <h1 id="auth-title">{currentCopy.title}</h1>
      <p className="auth-intro">{currentCopy.intro}</p>
      {!client && <p className="auth-status" role="status">Sign-in is not set up yet. Add the public Supabase configuration to enable it.</p>}
      {activeMode === "recover" && recoveryState.loading && client && <p className="auth-status" role="status">Checking your reset link…</p>}
      {resetComplete ? (
        <div className="auth-form">
          {status && <p className="auth-status" role="status">{status}</p>}
          <Link className="primary-action auth-action-link" href="/login">Sign in</Link>
        </div>
      ) : <form className="auth-form" onSubmit={submit} noValidate>
        {!isPasswordUpdate && <label>
          <span>Email address</span>
          <input type="email" name="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>}
        {!isRecoveryRequest && <label>
          <span>{isPasswordUpdate ? "New password" : "Password"}</span>
          <input type="password" name="password" autoComplete={activeMode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
        </label>}
        {isPasswordUpdate && <label>
          <span>Confirm new password</span>
          <input type="password" name="confirmation" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} required />
        </label>}
        {status && <p className="auth-status" role="status">{status}</p>}
        <button className="primary-action" type="submit" disabled={submitting || (activeMode === "recover" && recoveryState.loading)}>{submitting ? "Please wait…" : currentCopy.submit}</button>
      </form>}
      <nav className="auth-links" aria-label="Account options">
        {activeMode === "login" && <><Link href="/recover">Forgot your password?</Link><button type="button" onClick={() => { setActiveMode("signup"); setStatus(null); }}>Create an account</button></>}
        {activeMode === "signup" && <button type="button" onClick={() => { setActiveMode("login"); setStatus(null); }}>Already have an account? Sign in</button>}
        {activeMode === "recover" && !resetComplete && <Link href="/login">Back to sign in</Link>}
      </nav>
    </section>
  );
}
