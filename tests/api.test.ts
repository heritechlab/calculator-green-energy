import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const dbFile = path.join(os.tmpdir(), `suryahitung-test-${process.pid}-${Date.now()}.db`);
process.env.DATABASE_URL = `file:${dbFile}`;
process.env.NASA_POWER_ENABLED = "false";

const { POST: calculatePost } = await import("@/app/api/calculate/route");
const { POST: reportsPost } = await import("@/app/api/reports/route");
const { GET: reportGet } = await import("@/app/api/reports/[id]/route");
const { GET: irradianceGet } = await import("@/app/api/irradiance/route");
const { GET: locationsGet } = await import("@/app/api/locations/route");
const { GET: tariffsGet } = await import("@/app/api/tariffs/route");
const { GET: healthGet } = await import("@/app/api/health/route");
const { getIrradiance, parseNasaPower } = await import("@/lib/server/irradiance");
const { rateLimit, resetRateLimits } = await import("@/lib/server/rate-limit");
const { generateId, isValidId } = await import("@/lib/server/id");

function post(url: string, body: unknown, raw = false) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "10.0.0.1" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

const nasaSample = {
  properties: {
    parameter: {
      ALLSKY_SFC_SW_DWN: {
        JAN: 4.1,
        FEB: 4.3,
        MAR: 4.6,
        APR: 4.7,
        MAY: 4.7,
        JUN: 4.5,
        JUL: 4.8,
        AUG: 5.2,
        SEP: 5.5,
        OCT: 5.3,
        NOV: 4.8,
        DEC: 4.3,
        ANN: 4.73,
      },
      T2M: {
        JAN: 27.1,
        FEB: 27.2,
        MAR: 27.6,
        APR: 28,
        MAY: 28.2,
        JUN: 27.8,
        JUL: 27.4,
        AUG: 27.6,
        SEP: 28.1,
        OCT: 28.4,
        NOV: 28.1,
        DEC: 27.5,
        ANN: 27.7,
      },
    },
  },
};

beforeAll(() => resetRateLimits());
afterAll(async () => {
  const fs = await import("node:fs");
  fs.rmSync(dbFile, { force: true });
});

describe("POST /api/calculate", () => {
  it("menghitung dari input parsial", async () => {
    const res = await calculatePost(
      post("http://test/api/calculate", { location: { cityId: "bandung" }, consumption: { monthlyBill: 1_500_000 } }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.summary.locationName).toBe("Bandung");
    expect(json.result.system.kwp).toBeGreaterThan(0);
    expect(json.extras).toBeUndefined();
  });

  it("mendukung view=summary dan extras=1", async () => {
    const summary = await (await calculatePost(post("http://test/api/calculate?view=summary", {}))).json();
    expect(Object.keys(summary)).toEqual(["summary"]);
    const full = await (await calculatePost(post("http://test/api/calculate?extras=1", {}))).json();
    expect(full.extras.comparison).toHaveLength(3);
    expect(full.extras.sensitivity).toHaveLength(4);
  });

  it("menolak input tidak valid dengan daftar masalah", async () => {
    const res = await calculatePost(post("http://test/api/calculate", { consumption: { monthlyBill: -5 } }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.issues[0].path).toBe("consumption.monthlyBill");
  });

  it("menolak JSON rusak", async () => {
    const res = await calculatePost(post("http://test/api/calculate", "{rusak", true));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("INVALID_JSON");
  });
});

describe("laporan tersimpan", () => {
  it("menyimpan lalu membaca kembali laporan", async () => {
    const res = await reportsPost(
      post("http://test/api/reports", { title: "Rumah Bekasi", input: { location: { cityId: "bekasi" } } }),
    );
    expect(res.status).toBe(201);
    const created = await res.json();
    expect(isValidId(created.id)).toBe(true);
    expect(created.url).toMatch(new RegExp(`/hasil/${created.id}$`));

    const got = await reportGet(new Request(`http://test/api/reports/${created.id}`), {
      params: Promise.resolve({ id: created.id }),
    });
    expect(got.status).toBe(200);
    const report = await got.json();
    expect(report.title).toBe("Rumah Bekasi");
    expect(report.input.location.name).toBe("Bekasi");
    expect(report.summary.kwp).toBeGreaterThan(0);
  });

  it("mengembalikan 404 untuk ID yang tidak ada", async () => {
    const res = await reportGet(new Request("http://test/api/reports/abcdefghjk"), {
      params: Promise.resolve({ id: "abcdefghjk" }),
    });
    expect(res.status).toBe(404);
  });

  it("memvalidasi judul", async () => {
    const res = await reportsPost(post("http://test/api/reports", { title: 123, input: {} }));
    expect(res.status).toBe(400);
  });
});

describe("radiasi", () => {
  it("memakai dataset bila NASA POWER dinonaktifkan", async () => {
    const res = await irradianceGet(new Request("http://test/api/irradiance?lat=-6.2&lon=106.8"));
    const json = await res.json();
    expect(json.source).toBe("dataset");
    expect(json.city.name).toBe("Jakarta");
    expect(json.ghi).toHaveLength(12);
  });

  it("menolak koordinat di luar Indonesia", async () => {
    const res = await irradianceGet(new Request("http://test/api/irradiance?lat=48.8&lon=2.3"));
    expect(res.status).toBe(400);
  });

  it("mem-parse & men-cache data NASA POWER", async () => {
    process.env.NASA_POWER_ENABLED = "true";
    let calls = 0;
    const fetcher = async () => {
      calls++;
      return parseNasaPower(nasaSample);
    };
    const first = await getIrradiance(-7.25, 112.75, fetcher);
    expect(first.source).toBe("nasa-power");
    expect(first.ghi[0]).toBe(4.1);
    const second = await getIrradiance(-7.26, 112.74, fetcher);
    expect(second.cached).toBe(true);
    expect(calls).toBe(1);
    process.env.NASA_POWER_ENABLED = "false";
  });

  it("jatuh ke dataset bila NASA POWER gagal", async () => {
    process.env.NASA_POWER_ENABLED = "true";
    const data = await getIrradiance(-8.65, 115.22, async () => {
      throw new Error("timeout");
    });
    expect(data.source).toBe("dataset");
    expect(data.city?.name).toBe("Denpasar");
    process.env.NASA_POWER_ENABLED = "false";
  });

  it("menolak respons NASA yang tidak lengkap", () => {
    expect(parseNasaPower({ properties: { parameter: { ALLSKY_SFC_SW_DWN: { JAN: -999 } } } })).toBeNull();
  });
});

describe("endpoint referensi & utilitas", () => {
  it("mencari kota", async () => {
    const json = await (await locationsGet(new Request("http://test/api/locations?q=band"))).json();
    expect(json.items.map((i: { name: string }) => i.name)).toContain("Bandung");
  });

  it("mengembalikan tarif", async () => {
    const json = await (await tariffsGet()).json();
    expect(json.items.length).toBeGreaterThan(10);
  });

  it("melaporkan status sehat", async () => {
    const json = await (await healthGet()).json();
    expect(json).toMatchObject({ status: "ok", db: "ok" });
  });

  it("membatasi laju permintaan", () => {
    resetRateLimits();
    const results = Array.from({ length: 4 }, () => rateLimit("t", 3, 60_000, 1000));
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results[3].retryAfterSeconds).toBeGreaterThan(0);
    expect(rateLimit("t", 3, 60_000, 1000 + 20_000).allowed).toBe(true);
  });

  it("membuat ID yang valid", () => {
    for (let i = 0; i < 50; i++) expect(isValidId(generateId())).toBe(true);
  });
});
