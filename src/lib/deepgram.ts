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

export async function startDeepgramSession(
  onTranscript: (text: string, isFinal: boolean) => void,
  onError: (message: string) => void
): Promise<DeepgramSession> {
  let stream: MediaStream | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let socket: WebSocket | null = null;
  let stopped = false;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
  } catch {
    onError("Microphone access denied");
    throw new Error("Microphone access denied");
  }

  const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
  console.log("Deepgram key exists:", !!apiKey);
console.log("Deepgram key length:", apiKey?.length);

  if (!apiKey) {
    onError("Missing Deepgram API key");
    throw new Error("Missing Deepgram API key");
  }

const wsUrl ="wss://api.deepgram.com/v1/listen?model=nova-2&punctuate=true&interim_results=true";

  socket = new WebSocket(wsUrl, ["token", apiKey]);

await new Promise<void>((resolve, reject) => {
  const timeout = setTimeout(() => {
    reject(new Error("Deepgram connection timeout"));
  }, 10000);

  socket!.onopen = () => {
    clearTimeout(timeout);
    console.log("Deepgram connected");
    resolve();
  };

  socket!.onerror = (event) => {
    clearTimeout(timeout);
    console.error("Deepgram websocket error", event);
    reject(new Error("Deepgram connection failed"));
  };

  socket!.onclose = (event) => {
    console.error("Deepgram closed", {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
    });
  };
});
  socket.onmessage = (event) => {
  try {
    console.log("RAW MESSAGE:", event.data);

    const data: DeepgramMessage = JSON.parse(event.data);

    if (data.type !== "Results") return;

    const transcript =
      data.channel?.alternatives?.[0]?.transcript ?? "";

    console.log("TRANSCRIPT =", transcript);

    if (!transcript.trim()) return;

    onTranscript(
      transcript,
      Boolean(data.is_final || data.speech_final)
    );
  } catch (error) {
    console.error(error);
  }
};
  socket.onerror = () => {
    if (!stopped) {
      onError("Deepgram connection failed");
    }
  };

  socket.onclose = () => {
    if (!stopped) {
      onError("Deepgram connection closed");
    }
  };

  const mimeType = MediaRecorder.isTypeSupported(
  "audio/webm;codecs=opus"
)
  ? "audio/webm;codecs=opus"
  : "audio/webm";

console.log("MIME TYPE:", mimeType);

mediaRecorder = new MediaRecorder(stream, {
  mimeType,
});

mediaRecorder.ondataavailable = (event) => {
  console.log(
    "Audio chunk:",
    event.data.size,
    event.data.type
  );

  if (
    event.data.size > 0 &&
    socket?.readyState === WebSocket.OPEN
  ) {
    socket.send(event.data);
  }
};

mediaRecorder.start(250);

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

      cleanup(stream, mediaRecorder, socket);

      stream = null;
      mediaRecorder = null;
      socket = null;
    },
  };
}