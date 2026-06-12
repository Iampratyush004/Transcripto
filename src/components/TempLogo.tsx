export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <svg
        width="42"
        height="42"
        viewBox="0 0 48 48"
        fill="none"
      >
        {/* Top bar of T */}
        <rect
          x="8"
          y="6"
          width="32"
          height="6"
          rx="3"
          fill="#2563EB"
        />

        {/* Mic head */}
        <rect
          x="18"
          y="12"
          width="12"
          height="16"
          rx="6"
          fill="#2563EB"
        />

        {/* Mic stem */}
        <rect
          x="22"
          y="28"
          width="4"
          height="10"
          rx="2"
          fill="#2563EB"
        />

        {/* Mic base */}
        <rect
          x="16"
          y="38"
          width="16"
          height="4"
          rx="2"
          fill="#2563EB"
        />
      </svg>

      <div>
        <h1 className="text-xl font-bold">
          Transcripto
        </h1>

        <p className="text-xs text-gray-500">
          Real-Time Speech Transcription
        </p>
      </div>
    </div>
  );
}