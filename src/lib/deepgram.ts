export type RecordingStatus = "idle" | "recording" | "error";

export type DeepgramSession = {
  stop: () => void;
};

type DeepgramMessage = {
  type?: string;
  channel?: {
    alternatives?: Array<{ transcript?: string }>;
  };
  is_final?: boolean;
  speech_final?: boolean;
};

/**
 * Purpose: Read the Deepgram API key from environment variables.
 * Inputs: none.
 * Output: API key string, or throws if missing.
 */
function getDeepgramApiKey(): string {
  const key = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
  if (!key) {
    throw new Error("Missing NEXT_PUBLIC_DEEPGRAM_API_KEY");
  }
  return key;
}

/**
 * Purpose: Stop the microphone, media recorder, and WebSocket.
 * Inputs: refs to stream, recorder, and socket.
 * Output: none (resources are released).
 */
function cleanup(
  stream: MediaStream | null,
  mediaRecorder: MediaRecorder | null,
  socket: WebSocket | null
): void {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  stream?.getTracks().forEach((track) => track.stop());
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close();
  }
}

/**
 * Purpose: Open a live Deepgram session from the browser.
 * Inputs:
 *   - onTranscript: called with text and whether it is final
 *   - onError: called with a user-friendly error message
 * Output: session object with a stop() method.
 */
export async function startDeepgramSession(
  onTranscript: (text: string, isFinal: boolean) => void,
  onError: (message: string) => void
): Promise<DeepgramSession> {
  let stream: MediaStream | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let socket: WebSocket | null = null;
  let stopped = false;

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    onError("Microphone access denied");
    throw new Error("Microphone access denied");
  }

  const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;

  if (!apiKey) {
    onError("Missing Deepgram API key");
    throw new Error("Missing Deepgram API key");
  }

  console.log("Deepgram key loaded:", apiKey.substring(0, 5));
console.log(
  process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY
);
  // IMPORTANT: remove encoding=webm
  const wsUrl =
    "wss://api.deepgram.com/v1/listen?model=nova-2&punctuate=true&interim_results=true";

  try {
    socket = new WebSocket(wsUrl, ["token", apiKey]);
  } catch (err) {
    console.error(err);
    onError("Failed to create Deepgram websocket");
    throw err;
  }

  await new Promise<void>((resolve, reject) => {
    if (!socket) return reject();

    const timeout = setTimeout(() => {
      reject(new Error("Connection timeout"));
    }, 10000);

    socket.onopen = () => {
      clearTimeout(timeout);
      console.log("Deepgram connected");
      resolve();
    };

    socket.onerror = (event) => {
      clearTimeout(timeout);
      console.error("WebSocket error", event);
      reject(new Error("Deepgram connection failed"));
    };

    socket.onclose = (event) => {
      console.log(
        "WebSocket closed",
        event.code,
        event.reason
      );
    };
  });

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      console.log("DG message:", data);

      const transcript =
        data.channel?.alternatives?.[0]?.transcript ?? "";
        console.log("Transcript:", transcript);

      if (transcript) {
        onTranscript(
          transcript,
          Boolean(data.is_final)
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const mimeType = MediaRecorder.isTypeSupported(
    "audio/webm;codecs=opus"
  )
    ? "audio/webm;codecs=opus"
    : "audio/webm";

  mediaRecorder = new MediaRecorder(stream, {
    mimeType,
  });

  mediaRecorder.ondataavailable = (event) => {
    if (
      event.data.size > 0 &&
      socket?.readyState === WebSocket.OPEN
    ) {
      socket.send(event.data);
    }
  };

  mediaRecorder.start(250);

  return {
    stop: () => {
      stopped = true;

      if (
        mediaRecorder &&
        mediaRecorder.state !== "inactive"
      ) {
        mediaRecorder.stop();
      }

      stream?.getTracks().forEach((track) => track.stop());

      if (socket?.readyState === WebSocket.OPEN) {
        socket.close();
      }
    },
  };
}
