"use client";

import {
  startDeepgramSession,
  type DeepgramSession,
  type RecordingStatus,
} from "@/lib/deepgram";
import { getUserEmail, isLoggedIn, logout } from "@/lib/nhost";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Logo from "../../components/TempLogo";

export default function DashboardPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const sessionRef = useRef<DeepgramSession | null>(null);

  useEffect(() => {
    setReady(true);

    return () => {
      sessionRef.current?.stop();
    };
  }, []);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  if (!isLoggedIn()) {
    redirect("/login");
  }

  const email = getUserEmail() ?? "user";

  const displayedTranscript = [finalTranscript, interimTranscript]
    .filter(Boolean)
    .join(" ");

  function handleTranscript(text: string, isFinal: boolean) {
    if (isFinal) {
      setFinalTranscript((prev) => (prev ? `${prev} ${text}` : text));
      setInterimTranscript("");
    } else {
      setInterimTranscript(text);
    }
  }

  function handleDeepgramError(message: string) {
    setErrorMessage(message);
    setStatus("error");
    sessionRef.current?.stop();
    sessionRef.current = null;
  }

  async function handleStartRecording() {
    setErrorMessage("");
    setStatus("recording");

    try {
      sessionRef.current = await startDeepgramSession(
        handleTranscript,
        handleDeepgramError
      );
    } catch {
      setErrorMessage("Deepgram connection failed.");
      setStatus("error");
    }
  }

  function handleStopRecording() {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setInterimTranscript("");
    setStatus("idle");
  }

  function handleCopyTranscript() {
  if (!displayedTranscript.trim()) return;

  navigator.clipboard.writeText(displayedTranscript);
  alert("Transcript copied!");
}

async function handleLogout() {
  handleStopRecording();
  await logout();
  router.replace("/login");
}
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* HEADER */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <Logo />
          </div>

          <button
            onClick={handleLogout}
            className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">
              Welcome
            </h2>

            <p className="text-gray-500">
              {email}
            </p>
          </div>

          <div className="mb-4 flex gap-3">
            <button
              onClick={handleStartRecording}
              disabled={status === "recording"}
              className="flex-1 rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
            >
              Start Recording
            </button>

            <button
              onClick={handleStopRecording}
              disabled={status !== "recording"}
              className="flex-1 rounded bg-red-600 px-4 py-2 text-white disabled:opacity-50"
            >
              Stop Recording
            </button>
          </div>

          <div className="mb-4 flex justify-center">
            <span
              className={`rounded-full px-4 py-1 text-sm font-medium ${
                status === "recording"
                  ? "bg-green-100 text-green-700"
                  : status === "error"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {status === "recording"
                ? "🟢 Recording"
                : status === "error"
                ? "🔴 Error"
                : "⚪ Idle"}
            </span>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
  <h3 className="font-medium text-gray-700">
    Transcript
  </h3>

  <div className="flex items-center gap-3">
    <span className="text-xs text-gray-500">
      Words:{" "}
      {displayedTranscript.trim()
        ? displayedTranscript.trim().split(/\s+/).length
        : 0}
    </span>

    <button
  onClick={handleCopyTranscript}
  disabled={!displayedTranscript.trim()}
  className="rounded border border-gray-300 px-2 py-1 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
>
  📋 Copy
</button>
  </div>
</div>

            <div className="min-h-[180px] rounded border border-gray-300 p-4 text-sm">
              {displayedTranscript || (
                <span className="text-gray-400">
                  Speak to see live text...
                </span>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 text-center text-sm text-gray-500">
          Built with Nhost + Deepgram 
        </div>
      </footer>
    </div>
  );
}