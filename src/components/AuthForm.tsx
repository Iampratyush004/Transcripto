"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type AuthFormProps = {
  mode: "login" | "signup";
  onSubmit: (email: string, password: string) => Promise<string | null>;
};

/**
 * Purpose: Shared email/password form for login and signup pages.
 * Inputs: mode ("login" | "signup") and onSubmit handler.
 * Output: Renders a centered card with form fields and error message.
 */
export default function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  /**
   * Purpose: Validate and submit the form.
   * Inputs: form submit event.
   * Output: calls onSubmit; shows error message if it fails.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const message = await onSubmit(email, password);
    if (message) {
      setError(message);
    }

    setLoading(false);
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="mb-6 text-center text-2xl font-semibold">
        {isLogin ? "Log in" : "Sign up"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Please wait..." : isLogin ? "Log in" : "Sign up"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <Link href={isLogin ? "/signup" : "/login"} className="text-blue-600">
          {isLogin ? "Sign up" : "Log in"}
        </Link>
      </p>
    </div>
  );
}
