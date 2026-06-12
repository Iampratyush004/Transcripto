"use client";

import AuthForm from "@/components/AuthForm";
import Logo from "@/components/TempLogo";
import { isLoggedIn, signup } from "@/lib/nhost";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SignupPage() {
  const router = useRouter();
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

  async function handleSignup(email: string, password: string) {
    const error = await signup(email, password);

    if (!error) {
      router.replace("/dashboard");
    }

    return error;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-4">
          <Logo />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <AuthForm mode="signup" onSubmit={handleSignup} />
      </main>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 text-center text-sm text-gray-500">
          Transcripto • Real-Time Speech Transcription Platform
        </div>
      </footer>
    </div>
  );
}