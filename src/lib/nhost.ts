import { NhostClient } from "@nhost/nhost-js";

const subdomain = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN;
const region = process.env.NEXT_PUBLIC_NHOST_REGION;

/**
 * Purpose: Check that Nhost env vars are set before calling the API.
 * Inputs: none (reads process.env).
 * Output: error message string, or null if config looks valid.
 */
export function getNhostConfigError(): string | null {
  if (!subdomain || !region) {
    return "Missing Nhost config. Copy .env.example to .env.local and add your subdomain + region.";
  }
  if (subdomain === "local-dev") {
    return "Nhost subdomain is still the default placeholder. Update .env.local with your real subdomain.";
  }
  return null;
}

// Shared Nhost client. Session is stored in the browser automatically.
export const nhost = new NhostClient({
  subdomain: subdomain ?? "local-dev",
  region: region ?? "us-east-1",
});

/**
 * Purpose: Turn Nhost/network failures into a readable message.
 * Inputs: error object from Nhost.
 * Output: user-friendly error string.
 */
function formatAuthError(
  error: { message?: string } | null,
  fallback: string
): string {
  const configError = getNhostConfigError();
  if (configError) return configError;

  const message = error?.message ?? fallback;
  if (message.toLowerCase().includes("network error")) {
    return "Cannot reach Nhost. Check NEXT_PUBLIC_NHOST_SUBDOMAIN and NEXT_PUBLIC_NHOST_REGION in .env.local, then restart npm run dev.";
  }
  return message;
}

/**
 * Purpose: Log in with email and password.
 * Inputs: email and password strings.
 * Output: null on success, or an error message string.
 */
export async function login(
  email: string,
  password: string
): Promise<string | null> {
  const { error } = await nhost.auth.signIn({ email, password });
  if (error) {
    return formatAuthError(error, "Login failed. Check your email and password.");
  }
  return null;
}

/**
 * Purpose: Create a new account with email and password.
 * Inputs: email and password strings.
 * Output: null on success, or an error message string.
 */
export async function signup(
  email: string,
  password: string
): Promise<string | null> {
  const { error } = await nhost.auth.signUp({ email, password });
  if (error) {
    return formatAuthError(error, "Signup failed. Please try again.");
  }
  return null;
}

/**
 * Purpose: End the current session.
 * Inputs: none.
 * Output: none (session is cleared in the browser).
 */
export async function logout(): Promise<void> {
  await nhost.auth.signOut();
}

/**
 * Purpose: Read the signed-in user's email from the stored session.
 * Inputs: none.
 * Output: email string if logged in, otherwise null.
 */
export function getUserEmail(): string | null {
  return nhost.auth.getUser()?.email ?? null;
}

/**
 * Purpose: Check whether a user session exists right now.
 * Inputs: none.
 * Output: true if logged in, false if not.
 */
export function isLoggedIn(): boolean {
  return nhost.auth.getSession() !== null;
}
