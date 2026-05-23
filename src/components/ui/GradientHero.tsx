"use client";

interface GradientHeroProps {
  title: string;
  subtitle?: string;
  illustration?: React.ReactNode;
  compact?: boolean;
}

/**
 * DESIGN.md gradient mesh header used across all main pages.
 * cream #f5e9d4 → magenta #f96bee → lavender #b9b9f9 → indigo #533afd → navy #1c1e54
 */
export default function GradientHero({ title, subtitle, illustration, compact = false }: GradientHeroProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl mb-4"
      style={{ minHeight: compact ? "80px" : "100px" }}
    >
      {/* Gradient mesh background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #f5e9d4 0%, #f96bee 28%, #b9b9f9 52%, #533afd 76%, #1c1e54 100%)",
        }}
      />

      {/* SVG decorative blobs */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 120"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="350" cy="20" rx="100" ry="70" fill="white" fillOpacity="0.07" />
        <ellipse cx="50" cy="100" rx="80" ry="55" fill="white" fillOpacity="0.06" />
        <circle cx="380" cy="100" r="45" fill="#ea2261" fillOpacity="0.18" />
        <circle cx="20" cy="20" r="30" fill="#f96bee" fillOpacity="0.12" />
      </svg>

      {/* Sparkle */}
      <svg
        className="absolute top-3 right-5 text-white/15"
        style={{ width: "28px", height: "28px" }}
        viewBox="0 0 28 28"
        fill="none"
      >
        <path
          d="M14 2l1.7 7.2L24 7l-5.5 5.5 3.7 7L14 16.6 5.8 19.5l3.7-7L4 7l8.3 2.2L14 2z"
          fill="currentColor"
        />
      </svg>
      <svg
        className="absolute bottom-3 left-5 text-white/10"
        style={{ width: "16px", height: "16px" }}
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M8 1l1 4.2L13 4l-3.2 3.2 2.1 4.2L8 9.6 4.1 11.4l2.1-4.2L3 4l4-.8L8 1z"
          fill="currentColor"
        />
      </svg>

      {/* Content */}
      <div className="relative z-10 px-5 flex items-center justify-between h-full" style={{ minHeight: compact ? "80px" : "100px" }}>
        <div>
          <h1
            className="text-white font-semibold text-lg leading-tight"
            style={{ letterSpacing: "-0.4px" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-white/70 text-xs mt-0.5">{subtitle}</p>
          )}
        </div>
        {illustration && (
          <div className="text-white/80 flex-shrink-0">{illustration}</div>
        )}
      </div>
    </div>
  );
}
