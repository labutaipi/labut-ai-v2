interface RegionEntry {
  geo?: string;
  location?: string;
  values?: Array<{ extracted_value?: number }>;
}

interface RegionMapProps {
  data: { region?: RegionEntry[] } | null;
}

export default function RegionMap({ data }: RegionMapProps) {
  const regions = data?.region ?? [];

  const top = regions
    .map((region) => ({
      location: region.location ?? region.geo ?? "Desconhecido",
      value: Math.max(
        ...(region.values?.map((v) => v.extracted_value ?? 0) ?? [0]),
      ),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  if (!top.length) {
    return (
      <p className="text-sm text-(--sea-ink-soft)">
        Nenhum dado regional disponível.
      </p>
    );
  }

  const max = top[0].value || 1;

  return (
    <ul className="space-y-2">
      {top.map(({ location, value }) => (
        <li key={location} className="flex items-center gap-3">
          <span className="w-36 shrink-0 truncate text-sm text-(--sea-ink)">
            {location}
          </span>
          <div className="flex-1 overflow-hidden rounded-full bg-(--line) h-2">
            <div
              className="h-full rounded-full bg-(--lagoon-deep) transition-all"
              style={{ width: `${(value / max) * 100}%` }}
            />
          </div>
          <span className="w-8 text-right text-xs text-(--sea-ink-soft)">
            {value}
          </span>
        </li>
      ))}
    </ul>
  );
}
