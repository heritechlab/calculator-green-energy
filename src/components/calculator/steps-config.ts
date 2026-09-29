import { MapPin, Sun, Wallet, Zap, type LucideIcon } from "lucide-react";

export type WizardStepId = "lokasi" | "listrik" | "sistem" | "biaya";
export type StepId = WizardStepId | "hasil";

export const WIZARD_STEPS: { id: WizardStepId; label: string; short: string; description: string; icon: LucideIcon }[] = [
  {
    id: "lokasi",
    label: "Lokasi & Atap",
    short: "Lokasi",
    description: "Radiasi matahari di lokasi Anda dan kondisi atap menentukan produksi panel.",
    icon: MapPin,
  },
  {
    id: "listrik",
    label: "Pemakaian Listrik",
    short: "Listrik",
    description: "Tagihan, golongan PLN, dan pola pemakaian siang/malam.",
    icon: Zap,
  },
  {
    id: "sistem",
    label: "Sistem PLTS",
    short: "Sistem",
    description: "Jenis sistem, cara menentukan kapasitas, dan baterai.",
    icon: Sun,
  },
  {
    id: "biaya",
    label: "Biaya & Pembiayaan",
    short: "Biaya",
    description: "Harga sistem, metode pembayaran, dan asumsi finansial.",
    icon: Wallet,
  },
];

export function isStepId(v: string | null): v is StepId {
  return v === "hasil" || WIZARD_STEPS.some((s) => s.id === v);
}
