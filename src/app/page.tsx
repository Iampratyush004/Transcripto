"use client";

import { isLoggedIn } from "@/lib/nhost";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Purpose: Send visitors to login or dashboard based on session.
 * Inputs: none (reads Nhost session from browser storage).
 * Output: redirects to /dashboard or /login.
 */
export default function HomePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  if (isLoggedIn()) {
    redirect("/dashboard");
  }

  redirect("/login");
}
