"use client";
import { useState, useRef, useEffect } from "react";

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    province?: string;
    country?: string;
    country_code?: string;
  };
  type: string;
  class: string;
}

function formatCity(r: NominatimResult): string {
  const a = r.address;
  const city = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? "";
  const state = a.state ?? a.province ?? "";
  const country = a.country ?? "";
  return [city, state, country].filter(Boolean).join(", ");
}

const inp = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" };

export function CityInput({ value, onChange, placeholder = "Ej: Buenos Aires, Argentina" }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync query if value changes from outside
  useEffect(() => { setQuery(value); }, [value]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleInput(val: string) {
    setQuery(val);
    onChange(val); // allow free text too
    if (timeout.current) clearTimeout(timeout.current);
    if (val.length < 2) { setResults([]); setOpen(false); return; }

    timeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&addressdetails=1&limit=7&featuretype=settlement`,
          { headers: { "Accept-Language": "es" } }
        );
        const data: NominatimResult[] = await res.json();
        // Filtrar solo resultados tipo ciudad/pueblo
        const cities = data.filter(r =>
          ["city", "town", "village", "municipality", "suburb", "administrative"].includes(r.type) ||
          r.class === "place" || r.class === "boundary"
        );
        setResults(cities.slice(0, 6));
        setOpen(cities.length > 0);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 500);
  }

  function selectCity(r: NominatimResult) {
    const formatted = formatCity(r);
    setQuery(formatted);
    onChange(formatted);
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none pr-10"
          style={inp}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-[#8296E3] border-t-transparent animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-2xl overflow-hidden shadow-xl"
          style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}>
          {results.map((r, i) => {
            const formatted = formatCity(r);
            const parts = formatted.split(", ");
            return (
              <button key={r.place_id} onClick={() => selectCity(r)}
                className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-start gap-3"
                style={{ borderBottom: i < results.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <span className="mt-0.5 text-sm">📍</span>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{parts[0]}</p>
                  {parts.length > 1 && (
                    <p className="text-xs truncate mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {parts.slice(1).join(", ")}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
