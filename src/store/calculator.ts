"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  calculatorInputSchema,
  createDefaultInput,
  locationFromCity,
  locationFromCoordinates,
  type CalculatorInput,
  type CalculationSummary,
} from "@/lib/engine";
import { getTariff } from "@/lib/data/tariffs";

export interface HistoryItem {
  id: string;
  title: string | null;
  url: string;
  createdAt: number;
  summary: CalculationSummary;
}

type Section = "location" | "roof" | "consumption" | "system" | "finance";

interface CalculatorStore {
  input: CalculatorInput;
  history: HistoryItem[];
  setInput: (input: CalculatorInput) => void;
  update: <K extends Section>(section: K, patch: Partial<CalculatorInput[K]>) => void;
  setCity: (cityId: string) => void;
  setCoordinates: (lat: number, lon: number, name?: string) => void;
  setTariff: (tariffId: string) => void;
  applyIrradiance: (data: { lat: number; lon: number; ghi: number[]; temp: number[] }) => void;
  resetSection: (section: Exclude<Section, "location">) => void;
  reset: () => void;
  addHistory: (item: HistoryItem) => void;
  removeHistory: (id: string) => void;
}

export const useCalculatorStore = create<CalculatorStore>()(
  persist(
    (set, get) => ({
      input: createDefaultInput(),
      history: [],
      setInput: (input) => set({ input }),
      update: (section, patch) => set({ input: { ...get().input, [section]: { ...get().input[section], ...patch } } }),
      setCity: (cityId) => set({ input: { ...get().input, location: locationFromCity(cityId) } }),
      setCoordinates: (lat, lon, name) => set({ input: { ...get().input, location: locationFromCoordinates(lat, lon, name) } }),
      setTariff: (tariffId) => {
        const tariff = getTariff(tariffId);
        const consumption = get().input.consumption;
        set({
          input: {
            ...get().input,
            consumption: {
              ...consumption,
              tariffId,
              va: tariff ? (tariff.vaOptions.includes(consumption.va) ? consumption.va : tariff.defaultVa) : consumption.va,
              customRate: tariff ? consumption.customRate : (consumption.customRate ?? 1444.7),
            },
          },
        });
      },
      applyIrradiance: ({ lat, lon, ghi, temp }) => {
        const loc = get().input.location;
        // Abaikan respons lama bila lokasi sudah berganti.
        if (Math.abs(loc.lat - lat) > 0.13 || Math.abs(loc.lon - lon) > 0.13 || loc.source === "manual") return;
        set({ input: { ...get().input, location: { ...loc, ghi, temp, source: "nasa-power" } } });
      },
      resetSection: (section) => {
        const defaults = createDefaultInput();
        set({ input: { ...get().input, [section]: defaults[section] } });
      },
      reset: () => set({ input: createDefaultInput(get().input.location.cityId ?? undefined) }),
      addHistory: (item) => set({ history: [item, ...get().history.filter((h) => h.id !== item.id)].slice(0, 20) }),
      removeHistory: (id) => set({ history: get().history.filter((h) => h.id !== id) }),
    }),
    {
      name: "suryahitung:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ input: s.input, history: s.history }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<CalculatorStore>;
        const parsed = calculatorInputSchema.safeParse(p.input);
        return {
          ...current,
          input: parsed.success ? parsed.data : current.input,
          history: Array.isArray(p.history) ? p.history : [],
        };
      },
    },
  ),
);

/** true setelah state dari localStorage dimuat (selalu false saat render server). */
export function useStoreHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useCalculatorStore.persist.onFinishHydration(onChange),
    () => useCalculatorStore.persist.hasHydrated(),
    () => false,
  );
}
