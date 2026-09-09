function HouseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M5.5 9.5V19a1 1 0 001 1h11a1 1 0 001-1V9.5" />
    </svg>
  );
}

function BathIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M4 12V6a2 2 0 012-2 2 2 0 012 2" />
      <path d="M3 12h18" />
      <path d="M4 12v3a4 4 0 004 4h8a4 4 0 004-4v-3" />
      <path d="M7 19v2M17 19v2" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20v-1a7 7 0 0114 0v1" />
    </svg>
  );
}

function formatCount(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function PropertyStatsBar({
  bedroomCount,
  bathroomCount,
  capacity,
}: {
  bedroomCount: number;
  bathroomCount: number;
  capacity: number | null;
}) {
  return (
    <div className="mt-1 flex items-center gap-3 text-[13px] text-[#6e6e73]">
      <span className="flex items-center gap-1" title="Nombre de chambres">
        <HouseIcon />
        {formatCount(bedroomCount)}
      </span>
      <span className="flex items-center gap-1" title="Salles de bain (WC séparé = 0,5)">
        <BathIcon />
        {formatCount(bathroomCount)}
      </span>
      <span className="flex items-center gap-1" title="Capacité d'accueil">
        <PersonIcon />
        {capacity != null ? formatCount(capacity) : "—"}
      </span>
    </div>
  );
}
