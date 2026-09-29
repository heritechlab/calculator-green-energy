"use client";

import { useId, useMemo, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { getCity, searchCities, type City } from "@/lib/data/locations";
import { cn } from "@/lib/utils";
import { inputClass } from "@/components/ui/styles";

const POPULAR = ["jakarta", "surabaya", "bandung", "medan", "semarang", "makassar", "denpasar", "yogyakarta"];

export function CityCombobox({
  selectedName,
  onSelect,
  id,
}: {
  selectedName: string;
  onSelect: (city: City) => void;
  id?: string;
}) {
  const autoId = useId();
  const inputId = id ?? `city-${autoId}`;
  const listId = `${inputId}-list`;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(
    () => (query.trim() ? searchCities(query, 8) : POPULAR.map((c) => getCity(c)!).filter(Boolean)),
    [query],
  );

  const choose = (city: City) => {
    onSelect(city);
    setQuery("");
    setOpen(false);
    // Tutup keyboard virtual di ponsel setelah memilih.
    inputRef.current?.blur();
  };

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        role="combobox"
        aria-label="Kota atau kabupaten"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && results[active] ? `${listId}-${results[active].id}` : undefined}
        autoComplete="off"
        placeholder={selectedName ? `${selectedName} — ketik untuk mengganti` : "Cari kota atau kabupaten…"}
        className={cn(inputClass, "pl-10")}
        value={open ? query : selectedName}
        onFocus={() => {
          setOpen(true);
          setActive(0);
        }}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 150);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((a) => Math.min(results.length - 1, a + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === "Enter") {
            if (open && results[active]) {
              e.preventDefault();
              choose(results[active]);
            }
          } else if (e.key === "Escape") {
            setOpen(false);
            setQuery("");
          }
        }}
      />
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Pilihan kota"
          className="absolute z-30 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lift"
        >
          {!query.trim() ? (
            <li role="presentation" className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
              Kota populer
            </li>
          ) : null}
          {results.length === 0 ? (
            <li role="presentation" className="px-3 py-3 text-sm text-slate-500">
              Kota tidak ditemukan. Coba nama kota terdekat atau gunakan lokasi Anda.
            </li>
          ) : (
            results.map((c, i) => (
              <li
                key={c.id}
                id={`${listId}-${c.id}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (blurTimer.current) clearTimeout(blurTimer.current);
                  choose(c);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5",
                  i === active ? "bg-emerald-50" : "hover:bg-slate-50",
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <MapPin className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900">{c.name}</span>
                    <span className="block truncate text-xs text-slate-500">{c.province}</span>
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-amber-700 tabular">
                  {c.ghi.toLocaleString("id-ID", { minimumFractionDigits: 1 })} kWh/m²
                </span>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
