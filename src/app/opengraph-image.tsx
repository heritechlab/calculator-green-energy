import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "linear-gradient(135deg, #022c22 0%, #065f46 60%, #0f766e 100%)",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: "#10b981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 34, height: 34, borderRadius: 999, background: "#fbbf24" }} />
        </div>
        <div style={{ fontSize: 44, fontWeight: 800 }}>{siteConfig.name}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1 }}>Hitung kebutuhan PLTS & balik modal Anda</div>
        <div style={{ fontSize: 30, color: "#a7f3d0" }}>Radiasi per kota · tarif PLN terbaru · simulasi per jam · NPV & IRR</div>
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: 26, color: "#fde68a" }}>
        ☀ Energi hijau untuk rumah & usaha di Indonesia
      </div>
    </div>,
    size,
  );
}
