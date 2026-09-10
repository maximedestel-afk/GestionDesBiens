export const PLATFORM_LABELS: Record<string, string> = {
  airbnb: "Airbnb",
  booking: "Booking.com",
  vrbo: "Vrbo",
  hopper: "Hopper",
};

export function platformTitle(platform: { platformType: string; platformTypeDetail: string | null }): string {
  if (platform.platformType === "autre") {
    return platform.platformTypeDetail?.trim() || "Autre";
  }
  return PLATFORM_LABELS[platform.platformType] ?? platform.platformType;
}

// Icônes stylisées approximant l'identité visuelle de chaque plateforme
// (pas les logos officiels exacts — dessinées à la main, faute d'accès aux
// fichiers d'origine dans cet environnement).
function AirbnbGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[60%] w-[60%]">
      <path
        d="M12 3.5c1.2 1.7 4.8 7 5.6 9 .6 1.5.2 3.3-1.1 4.3a3.4 3.4 0 0 1-4.5-.3 3.4 3.4 0 0 1-4.5.3 3.4 3.4 0 0 1-1.1-4.3c.8-2 4.4-7.3 5.6-9Z"
        fill="#FF5A5F"
      />
      <ellipse cx="12" cy="17.3" rx="4.4" ry="1" fill="#FF5A5F" opacity=".55" />
    </svg>
  );
}

function BookingGlyph() {
  return (
    <span aria-hidden="true" className="text-[65%] font-bold italic text-white">
      B
    </span>
  );
}

function VrboGlyph() {
  return (
    <span aria-hidden="true" className="text-[65%] font-bold italic text-white">
      V
    </span>
  );
}

function HopperGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="#FF6161" className="h-[70%] w-[70%]">
      <rect x="5.3" y="1.6" width="1.7" height="7.4" rx="0.85" transform="rotate(-14 6.15 5.3)" />
      <rect x="8.7" y="1.3" width="1.7" height="7.4" rx="0.85" transform="rotate(12 9.55 5)" />
      <ellipse cx="13.4" cy="16.3" rx="6.2" ry="4.7" />
      <circle cx="7.8" cy="10.6" r="3.1" />
      <circle cx="6.5" cy="10" r=".55" fill="#fff" />
    </svg>
  );
}

const PLATFORM_GLYPHS: Record<string, () => React.ReactElement> = {
  airbnb: AirbnbGlyph,
  booking: BookingGlyph,
  vrbo: VrboGlyph,
  hopper: HopperGlyph,
};

const PLATFORM_CHIP_BG: Record<string, string> = {
  airbnb: "#ffffff",
  booking: "#003580",
  vrbo: "#245ABC",
  hopper: "#ffffff",
};

export function PlatformLogo({
  platformType,
  title,
  className = "h-6 w-6 text-[12px]",
}: {
  platformType: string;
  title: string;
  className?: string;
}) {
  const Glyph = PLATFORM_GLYPHS[platformType];
  if (!Glyph) {
    const letter = (title.trim()[0] ?? "?").toUpperCase();
    return (
      <span
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center rounded-full bg-[#6e6e73] font-bold text-white ${className}`}
      >
        {letter}
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full border border-black/[0.06] ${className}`}
      style={{ backgroundColor: PLATFORM_CHIP_BG[platformType] }}
    >
      <Glyph />
    </span>
  );
}
