import { MONTH_LABELS, MONTH_NAMES } from "@/lib/engine/constants";
import { DAY_END_HOUR, DAY_START_HOUR } from "@/lib/data/load-profiles";
import { formatDecimal } from "@/lib/format";

/**
 * Grafik batang mini radiasi bulanan (satu seri → tanpa legenda; judul menamai data).
 * Nilai tertinggi & terendah diberi label langsung; nilai lain tersedia di <title> & tabel tersembunyi.
 */
export function IrradianceBars({ values, label }: { values: number[]; label: string }) {
  const width = 312;
  const height = 96;
  const top = 16;
  const bottom = 18;
  const slot = width / 12;
  const barW = Math.min(18, slot - 6);
  const max = Math.max(...values, 1);
  const iMax = values.indexOf(Math.max(...values));
  const iMin = values.indexOf(Math.min(...values));
  const plotH = height - top - bottom;

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={label}>
        <line x1="0" x2={width} y1={height - bottom + 0.5} y2={height - bottom + 0.5} stroke="#cbd5e1" strokeWidth="1" />
        {values.map((v, i) => {
          const h = Math.max(2, (v / max) * plotH);
          const x = i * slot + (slot - barW) / 2;
          const y = height - bottom - h;
          const r = Math.min(4, h / 2);
          const d = `M${x},${height - bottom} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${height - bottom} Z`;
          return (
            <g key={i}>
              <path d={d} fill={i === iMax ? "#d97706" : "#fbbf24"}>
                <title>{`${MONTH_NAMES[i]}: ${formatDecimal(v, 2)} kWh/m²/hari`}</title>
              </path>
              {i === iMax || i === iMin ? (
                <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="10" fontWeight="600" fill="#475569">
                  {formatDecimal(v, 1)}
                </text>
              ) : null}
              <text x={x + barW / 2} y={height - 4} textAnchor="middle" fontSize="9.5" fill="#64748b">
                {MONTH_LABELS[i].charAt(0)}
              </text>
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {values.map((v, i) => (
            <tr key={i}>
              <th scope="row">{MONTH_NAMES[i]}</th>
              <td>{formatDecimal(v, 2)} kWh/m²/hari</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Thumbnail pola pemakaian 24 jam (jam siang ditandai hijau). */
export function ProfileSparkline({ profile }: { profile: number[] }) {
  const width = 144;
  const height = 36;
  const max = Math.max(...profile, 0.0001);
  const slot = width / 24;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-9 w-full" aria-hidden>
      {profile.map((v, h) => {
        const bh = Math.max(1.5, (v / max) * (height - 2));
        const day = h >= DAY_START_HOUR && h < DAY_END_HOUR;
        return (
          <rect
            key={h}
            x={h * slot + 0.75}
            y={height - bh}
            width={slot - 1.5}
            height={bh}
            rx={1.5}
            fill={day ? "#059669" : "#cbd5e1"}
          />
        );
      })}
    </svg>
  );
}
