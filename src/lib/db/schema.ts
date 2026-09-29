import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** Laporan perhitungan yang disimpan & dibagikan lewat tautan /hasil/{id}. */
export const reports = sqliteTable(
  "reports",
  {
    id: text("id").primaryKey(),
    title: text("title"),
    engineVersion: text("engine_version").notNull(),
    inputJson: text("input_json").notNull(),
    summaryJson: text("summary_json").notNull(),
    locationName: text("location_name").notNull(),
    systemType: text("system_type").notNull(),
    viewCount: integer("view_count").notNull().default(0),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [index("reports_created_at_idx").on(t.createdAt)],
);

/** Cache data klimatologi NASA POWER per koordinat (dibulatkan 0,25°). */
export const irradianceCache = sqliteTable("irradiance_cache", {
  key: text("key").primaryKey(),
  lat: real("lat").notNull(),
  lon: real("lon").notNull(),
  source: text("source").notNull(),
  ghiJson: text("ghi_json").notNull(),
  tempJson: text("temp_json").notNull(),
  fetchedAt: integer("fetched_at").notNull(),
});

export type ReportRow = typeof reports.$inferSelect;
export type IrradianceRow = typeof irradianceCache.$inferSelect;
