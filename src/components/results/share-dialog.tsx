"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Loader2, MessageCircle, Share2 } from "lucide-react";
import type { CalculationResult, CalculationSummary } from "@/lib/engine";
import { formatKwp, formatRupiahCompact, formatYears } from "@/lib/format";
import { useCalculatorStore } from "@/store/calculator";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { TextInput } from "@/components/ui/inputs";
import { Dialog } from "@/components/ui/overlay";
import { toast } from "@/components/ui/toast";

function shareText(result: CalculationResult, url: string) {
  const ev = result.evaluation;
  return `Hasil hitung PLTS ${formatKwp(result.system.kwp)} di ${result.input.location.name}: investasi ${formatRupiahCompact(ev.capex)}, hemat ${formatRupiahCompact(ev.year1.savings / 12)}/bulan, balik modal ${formatYears(ev.metrics.paybackYears)}. ${url}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ShareDialog({ result, trigger }: { result: CalculationResult; trigger: React.ReactNode }) {
  const addHistory = useCalculatorStore((s) => s.addHistory);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ url: string; id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: title.trim() || null, input: result.input }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Gagal menyimpan");
      const url = `${window.location.origin}/hasil/${json.id}`;
      setSaved({ url, id: json.id });
      addHistory({ id: json.id, title: title.trim() || null, url, createdAt: json.createdAt ?? Date.now(), summary: json.summary as CalculationSummary });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setSaved(null);
          setCopied(false);
          setError(null);
        }
      }}
      title="Simpan & bagikan hasil"
      description="Buat tautan yang bisa dibuka siapa saja — cocok untuk keluarga, partner bisnis, atau installer."
      trigger={trigger}
    >
      {!saved ? (
        <div className="flex flex-col gap-4">
          <Field label="Judul (opsional)" htmlFor="share-title" hint="Contoh: Rumah Bekasi, Ruko Jl. Sudirman.">
            <TextInput id="share-title" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="Nama lokasi atau proyek" />
          </Field>
          {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
          <Button size="lg" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Share2 className="h-4 w-4" aria-hidden />}
            Buat tautan
          </Button>
          <p className="text-xs leading-relaxed text-slate-500">
            Yang disimpan hanya parameter perhitungan dan judul — tanpa data pribadi.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <Check className="h-4 w-4" aria-hidden /> Tautan siap dibagikan
          </p>
          <div className="flex gap-2">
            <TextInput readOnly value={saved.url} aria-label="Tautan hasil" onFocus={(e) => e.currentTarget.select()} className="text-sm" />
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12"
              aria-label="Salin tautan"
              onClick={async () => {
                const ok = await copyToClipboard(saved.url);
                setCopied(ok);
                toast(ok ? "Tautan disalin" : "Gagal menyalin — salin manual", ok ? "success" : "error");
              }}
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button asChild variant="secondary">
              <a href={`https://wa.me/?text=${encodeURIComponent(shareText(result, saved.url))}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" aria-hidden /> Kirim via WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={saved.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" aria-hidden /> Buka tautan
              </a>
            </Button>
          </div>
          {typeof navigator !== "undefined" && "share" in navigator ? (
            <Button
              variant="ghost"
              onClick={() => navigator.share({ title: "Hasil perhitungan PLTS", text: shareText(result, saved.url), url: saved.url }).catch(() => {})}
            >
              <Share2 className="h-4 w-4" aria-hidden /> Bagikan lewat aplikasi lain
            </Button>
          ) : null}
        </div>
      )}
    </Dialog>
  );
}
