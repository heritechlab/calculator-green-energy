import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { reports } from "@/lib/db/schema";
import { calculate, calculatorInputSchema, summarize, type CalculationSummary, type CalculatorInput } from "@/lib/engine";
import { generateId, isValidId } from "./id";

export interface StoredReport {
  id: string;
  title: string | null;
  engineVersion: string;
  input: CalculatorInput;
  summary: CalculationSummary;
  viewCount: number;
  createdAt: number;
}

export async function createReport(input: CalculatorInput, title: string | null): Promise<StoredReport> {
  const db = await getDb();
  const result = calculate(input);
  const summary = summarize(result);
  const now = Date.now();
  const cleanTitle = title?.trim().slice(0, 80) || null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const id = generateId(10);
    try {
      await db.insert(reports).values({
        id,
        title: cleanTitle,
        engineVersion: result.engineVersion,
        inputJson: JSON.stringify(input),
        summaryJson: JSON.stringify(summary),
        locationName: input.location.name,
        systemType: input.system.type,
        viewCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      return { id, title: cleanTitle, engineVersion: result.engineVersion, input, summary, viewCount: 0, createdAt: now };
    } catch (error) {
      // Tabrakan ID sangat jarang; coba lagi dengan ID baru.
      if (attempt === 4) throw error;
    }
  }
  throw new Error("Gagal membuat ID laporan");
}

export async function getReport(id: string, options: { countView?: boolean } = {}): Promise<StoredReport | null> {
  if (!isValidId(id)) return null;
  const db = await getDb();
  const rows = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  const row = rows[0];
  if (!row) return null;

  const parsed = calculatorInputSchema.safeParse(JSON.parse(row.inputJson));
  if (!parsed.success) return null;

  if (options.countView) {
    await db
      .update(reports)
      .set({ viewCount: sql`${reports.viewCount} + 1` })
      .where(eq(reports.id, id));
  }
  return {
    id: row.id,
    title: row.title,
    engineVersion: row.engineVersion,
    input: parsed.data,
    summary: JSON.parse(row.summaryJson) as CalculationSummary,
    viewCount: row.viewCount + (options.countView ? 1 : 0),
    createdAt: row.createdAt,
  };
}
