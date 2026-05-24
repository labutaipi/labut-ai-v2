interface RegionEntry {
  location?: string;
  values?: Array<{ query?: string; extracted_value?: number }>;
}

interface RegionMapProps {
  data: { region?: RegionEntry[] } | null;
}

const COLORS = ["#328f97", "#16A34A", "#EA580C", "#6B7280", "#DC2626"];

export default function RegionMap({ data }: RegionMapProps) {
  const regions = data?.region ?? [];

  if (!regions.length) {
    return (
      <p className="text-sm text-(--sea-ink-soft)">
        Nenhum dado regional disponível.
      </p>
    );
  }

  // Collect all unique keywords (preserving order from first region)
  const keywords: string[] = [];
  for (const r of regions) {
    for (const v of r.values ?? []) {
      if (v.query && !keywords.includes(v.query)) keywords.push(v.query);
    }
  }

  // Score each region by its total across keywords, sort, take top 5
  const scored = regions
    .map((r) => ({
      location: r.location ?? "Desconhecido",
      values: Object.fromEntries(
        (r.values ?? []).map((v) => [v.query ?? "", v.extracted_value ?? 0]),
      ),
      total: (r.values ?? []).reduce((s, v) => s + (v.extracted_value ?? 0), 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Global max for consistent bar scale
  const globalMax = Math.max(
    ...scored.flatMap((r) => Object.values(r.values)),
    1,
  );

  return (
    <div className="space-y-5">
      {scored.map(({ location, values }, ri) => {
        const dominant = keywords.reduce((best, kw) =>
          (values[kw] ?? 0) > (values[best] ?? 0) ? kw : best,
          keywords[0] ?? "",
        );

        return (
          <div key={location}>
            {/* Region header */}
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-(--sea-ink)">
                {ri + 1}. {location}
              </span>
              {dominant && (
                <span className="rounded-full bg-(--lagoon-deep)/10 px-2 py-0.5 text-xs text-(--lagoon-deep)">
                  ↑ {dominant}
                </span>
              )}
            </div>

            {/* Per-keyword bars */}
            <div className="space-y-1.5">
              {keywords.map((kw, ki) => {
                const val = values[kw] ?? 0;
                if (val === 0) return null;
                const pct = Math.round((val / globalMax) * 100);
                const color = COLORS[ki % COLORS.length];
                return (
                  <div key={kw} className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: color }}
                    />
                    <span className="w-32 shrink-0 truncate text-xs text-(--sea-ink-soft)">
                      {kw}
                    </span>
                    <div className="flex-1 overflow-hidden rounded-full bg-(--line) h-1.5">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                    <span className="w-6 text-right text-xs font-medium text-(--sea-ink)">
                      {val}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
