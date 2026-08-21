import type { User } from "@supabase/supabase-js";

export type AuthClient = {
  auth: {
    getSession: () => Promise<{ data: { session: { user: User } | null } }>;
    onAuthStateChange: (
      listener: (event: string, session: { user: User } | null) => void,
    ) => { data: { subscription: { unsubscribe: () => void } } };
    signOut: () => Promise<{ error: unknown | null }>;
  };
};

export type AuthState = {
  user: User | null;
  loading: boolean;
  configured: boolean;
};

export type PasswordRecoveryState = {
  configured: boolean;
  loading: boolean;
  canUpdatePassword: boolean;
};

export function isValidEmail(email: string): boolean {
  return /^\S+@\S+\.\S+$/.test(email.trim());
}

export function validateCredentials({ email, password }: { email: string; password: string }): string | null {
  if (!isValidEmail(email)) return "Enter a valid email address.";
  if (password.length < 8) return "Use a password with at least 8 characters.";
  return null;
}

export function validatePasswordReset({ password, confirmation }: { password: string; confirmation: string }): string | null {
  if (password.length < 8) return "Use a password with at least 8 characters.";
  if (password !== confirmation) return "The passwords do not match.";
  return null;
}

export function getAuthErrorMessage(error: unknown): string {
  const message = error instanceof Error
    ? error.message.toLowerCase()
    : typeof error === "object" && error !== null && "message" in error && typeof error.message === "string"
      ? error.message.toLowerCase()
      : "";

  if (message.includes("email not confirmed") || message.includes("email_not_confirmed")) {
    return "Check your inbox and verify your email before signing in.";
  }
  if (message.includes("rate") || message.includes("too many") || message.includes("over_email_send_rate_limit")) {
    return "Please wait a moment before trying again.";
  }
  if (message.includes("invalid login") || message.includes("invalid credentials")) {
    return "Check your email and password, then try again.";
  }
  return "We could not complete that request. Please try again.";
}

export function getAppBasePath(location: string): string {
  const url = new URL(location);
  const githubPagesBasePath = "/lucid_dream_";
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
  const isGitHubPages = url.hostname.endsWith(".github.io");
  const hasGitHubPagesBasePath = url.pathname === githubPagesBasePath
    || url.pathname.startsWith(`${githubPagesBasePath}/`);

  return !isLocal && (isGitHubPages || hasGitHubPagesBasePath) ? githubPagesBasePath : "";
}

export function getRecoveryRedirectUrl(location: string): string {
  const url = new URL(location);
  const basePath = getAppBasePath(location);
  return new URL(`${basePath}/recover/`, url.origin).toString();
}

export function createAuthStateController(
  client: AuthClient | null,
  notify: () => void,
) {
  let state: AuthState = { user: null, loading: true, configured: client !== null };
  let unsubscribe: (() => void) | undefined;
  let generation = 0;

  const update = (next: Partial<AuthState>) => {
    state = { ...state, ...next };
    notify();
  };

  return {
    getState: () => state,
    async start() {
      unsubscribe?.();
      unsubscribe = undefined;
      const currentGeneration = ++generation;
      if (!client) {
        update({ loading: false });
        return;
      }

      const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
        if (currentGeneration !== generation) return;
        update({ user: session?.user ?? null, loading: false });
      });
      unsubscribe = () => listener.subscription.unsubscribe();
      const { data } = await client.auth.getSession();
      if (currentGeneration !== generation) return;
      update({ user: data.session?.user ?? null, loading: false });
    },
    async signOut() {
      if (!client) return;
      const { error } = await client.auth.signOut();
      if (error) throw error;
      update({ user: null, loading: false });
    },
    stop() {
      generation += 1;
      unsubscribe?.();
      unsubscribe = undefined;
    },
  };
}

type PasswordRecoveryClient = {
  auth: Pick<AuthClient["auth"], "getSession" | "onAuthStateChange"> & {
    updateUser: (attributes: { password: string }) => Promise<{ error: unknown | null }>;
  };
};

export function createPasswordRecoveryController(
  client: PasswordRecoveryClient | null,
  notify: () => void,
) {
  let state: PasswordRecoveryState = {
    configured: client !== null,
    loading: true,
    canUpdatePassword: false,
  };
  let unsubscribe: (() => void) | undefined;
  let generation = 0;

  const update = (next: Partial<PasswordRecoveryState>) => {
    state = { ...state, ...next };
    notify();
  };

  return {
    getState: () => state,
    async start() {
      unsubscribe?.();
      unsubscribe = undefined;
      const currentGeneration = ++generation;
      if (!client) {
        update({ loading: false });
        return;
      }

      const { data: listener } = client.auth.onAuthStateChange((event, session) => {
        if (currentGeneration !== generation || event !== "PASSWORD_RECOVERY" || !session) return;
        update({ canUpdatePassword: true, loading: false });
      });
      unsubscribe = () => listener.subscription.unsubscribe();
      await client.auth.getSession();
      if (currentGeneration !== generation) return;
      update({ loading: false });
    },
    async updatePassword(password: string) {
      if (!client || !state.canUpdatePassword) {
        throw new Error("Password recovery is not active.");
      }
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      update({ canUpdatePassword: false });
    },
    stop() {
      generation += 1;
      unsubscribe?.();
      unsubscribe = undefined;
    },
  };
}
