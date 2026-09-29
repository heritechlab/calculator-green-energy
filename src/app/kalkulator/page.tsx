import type { Metadata } from "next";
import { Suspense } from "react";
import { CalculatorApp } from "@/components/calculator/calculator-app";

export const metadata: Metadata = {
  title: "Kalkulator PLTS — Kebutuhan, Biaya & Balik Modal",
  description:
    "Hitung kapasitas PLTS atap yang Anda butuhkan, biaya investasi, penghematan tagihan, balik modal, NPV, IRR, dan dampak lingkungan — lengkap dengan simulasi per jam.",
  alternates: { canonical: "/kalkulator" },
};

export default function CalculatorPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
      <CalculatorApp />
    </Suspense>
  );
}
