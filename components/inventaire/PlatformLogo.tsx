export const PLATFORM_LABELS: Record<string, string> = {
  airbnb: "Airbnb",
  booking: "Booking.com",
  vrbo: "Vrbo",
};

const PLATFORM_COLORS: Record<string, string> = {
  airbnb: "#FF5A5F",
  booking: "#003580",
  vrbo: "#1E54A5",
};

export function platformTitle(platform: { platformType: string; platformTypeDetail: string | null }): string {
  if (platform.platformType === "autre") {
    return platform.platformTypeDetail?.trim() || "Autre";
  }
  return PLATFORM_LABELS[platform.platformType] ?? platform.platformType;
}

export function PlatformLogo({
  platformType,
  title,
  className = "h-6 w-6 text-[12px]",
}: {
  platformType: string;
  title: string;
  className?: string;
}) {
  const color = PLATFORM_COLORS[platformType] ?? "#6e6e73";
  const letter = (title.trim()[0] ?? "?").toUpperCase();
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${className}`}
      style={{ backgroundColor: color }}
    >
      {letter}
    </span>
  );
}
