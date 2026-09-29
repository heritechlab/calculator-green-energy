"use client";

import { useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { useCalculatorStore, useStoreHydrated } from "@/store/calculator";
import { useCalculation } from "@/hooks/use-calculation";
import { useIrradianceSync } from "@/hooks/use-irradiance-sync";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { ResultsView } from "@/components/results/results-view";
import { Stepper } from "./stepper";
import { LiveSummary, MobileWizardBar } from "./live-summary";
import { isStepId, WIZARD_STEPS, type StepId, type WizardStepId } from "./steps-config";
import { LocationStep } from "./steps/location-step";
import { UsageStep } from "./steps/usage-step";
import { SystemStep } from "./steps/system-step";
import { CostStep } from "./steps/cost-step";

function CalculatorSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-6xl animate-pulse-soft px-4 py-8 sm:px-6"
      aria-busy="true"
      aria-label="Memuat kalkulator"
    >
      <div className="h-8 w-56 rounded-lg bg-slate-200" />
      <div className="mt-6 h-14 rounded-2xl bg-slate-200/70" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="h-[520px] rounded-3xl bg-white" />
        <div className="hidden h-[420px] rounded-3xl bg-white lg:block" />
      </div>
    </div>
  );
}

export function CalculatorApp() {
  const searchParams = useSearchParams();
  const rawStep = searchParams.get("step");
  const step: StepId = isStepId(rawStep) ? rawStep : "lokasi";

  const hydrated = useStoreHydrated();
  const input = useCalculatorStore((s) => s.input);
  const reset = useCalculatorStore((s) => s.reset);
  useIrradianceSync();
  const { result, stale } = useCalculation(input);

  const goTo = useCallback((next: StepId) => {
    window.history.pushState(null, "", `?step=${next}`);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  useEffect(() => {
    const title = step === "hasil" ? "Hasil Perhitungan PLTS" : WIZARD_STEPS.find((s) => s.id === step)?.label;
    if (title) document.title = `${title} | SuryaHitung`;
  }, [step]);

  if (!hydrated) return <CalculatorSkeleton />;

  if (step === "hasil") {
    if (!result) return <CalculatorSkeleton />;
    return <ResultsView result={result} context="calculator" onEdit={(s) => goTo(s)} />;
  }

  const index = WIZARD_STEPS.findIndex((s) => s.id === step);
  const current = WIZARD_STEPS[index];
  const isLast = index === WIZARD_STEPS.length - 1;
  const next = () => goTo(isLast ? "hasil" : WIZARD_STEPS[index + 1].id);
  const back = () => index > 0 && goTo(WIZARD_STEPS[index - 1].id);

  const stepContent: Record<WizardStepId, React.ReactNode> = {
    lokasi: <LocationStep />,
    listrik: <UsageStep result={result} />,
    sistem: <SystemStep result={result} />,
    biaya: <CostStep result={result} />,
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-40 sm:px-6 sm:pt-10 lg:pb-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Kalkulator PLTS</h1>
          <p className="mt-1 text-sm text-slate-500">Semua isian sudah terisi nilai umum — ubah yang Anda ketahui saja.</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            reset();
            toast("Isian dikembalikan ke nilai awal");
          }}
        >
          <RotateCcw className="h-4 w-4" aria-hidden /> Mulai ulang
        </Button>
      </div>

      <div className="mt-6">
        <Stepper current={current.id} onSelect={goTo} />
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-labelledby="step-title" className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-soft sm:p-8">
          <div className="flex items-start gap-3 border-b border-slate-100 pb-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-900/20">
              <current.icon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 id="step-title" className="text-xl font-bold text-slate-900">
                {current.label}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">{current.description}</p>
            </div>
          </div>
          <div key={current.id} className="animate-fade-up pt-6">
            {stepContent[current.id]}
          </div>
          <div className="mt-8 hidden items-center justify-between gap-3 border-t border-slate-100 pt-6 lg:flex">
            <Button variant="outline" onClick={back} disabled={index === 0}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> Kembali
            </Button>
            <Button onClick={next} size="lg">
              {isLast ? "Lihat hasil lengkap" : `Lanjut: ${WIZARD_STEPS[index + 1].label}`}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </section>
        <aside className="sticky top-24 hidden lg:block" aria-label="Ringkasan estimasi">
          <LiveSummary result={result} stale={stale} onShowResults={() => goTo("hasil")} />
        </aside>
      </div>

      <MobileWizardBar result={result} canBack={index > 0} isLast={isLast} onBack={back} onNext={next} />
    </div>
  );
}
