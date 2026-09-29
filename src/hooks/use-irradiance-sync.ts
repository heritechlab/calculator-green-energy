"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { useCalculatorStore, useStoreHydrated } from "@/store/calculator";

type Status = "idle" | "loading" | "nasa" | "fallback";

export const useIrradianceStatus = create<{ status: Status; setStatus: (s: Status) => void }>((set) => ({
  status: "idle",
  setStatus: (status) => set({ status }),
}));

/** Kunci koordinat yang sudah dicek pada sesi ini (hindari permintaan berulang). */
const checked = new Map<string, "nasa" | "fallback">();

/**
 * Coba perbarui data radiasi lokasi dengan klimatologi NASA POWER melalui API server.
 * Bila tidak tersedia, kalkulator tetap memakai estimasi dataset kota.
 */
export function useIrradianceSync() {
  const lat = useCalculatorStore((s) => s.input.location.lat);
  const lon = useCalculatorStore((s) => s.input.location.lon);
  const source = useCalculatorStore((s) => s.input.location.source);
  const hydrated = useStoreHydrated();
  const applyIrradiance = useCalculatorStore((s) => s.applyIrradiance);
  const setStatus = useIrradianceStatus((s) => s.setStatus);

  useEffect(() => {
    if (!hydrated) return;
    if (source === "nasa-power") {
      setStatus("nasa");
      return;
    }
    if (source === "manual") {
      setStatus("idle");
      return;
    }
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const known = checked.get(key);
    if (known) {
      setStatus(known);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("loading");
      try {
        const res = await fetch(`/api/irradiance?lat=${lat}&lon=${lon}`, { signal: controller.signal });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { source: string; ghi: number[]; temp: number[] };
        if (data.source === "nasa-power") {
          checked.set(key, "nasa");
          applyIrradiance({ lat, lon, ghi: data.ghi, temp: data.temp });
          setStatus("nasa");
        } else {
          checked.set(key, "fallback");
          setStatus("fallback");
        }
      } catch {
        if (!controller.signal.aborted) setStatus("fallback");
      }
    }, 350);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [lat, lon, source, hydrated, applyIrradiance, setStatus]);
}
