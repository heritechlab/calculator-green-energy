import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test.beforeEach(async ({ page }) => {
  // Mulai dari keadaan bersih (tanpa draft tersimpan).
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("e2e-init")) {
      localStorage.clear();
      sessionStorage.setItem("e2e-init", "1");
    }
  });
});

test("hitung cepat di landing memperbarui estimasi dan membuka hasil lengkap", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("balik modal");
  const estimate = page.locator("[aria-live=polite]").first();
  const before = await estimate.textContent();
  await page.getByRole("textbox", { name: "Tagihan listrik per bulan" }).fill("3000000");
  await expect(estimate).not.toHaveText(before ?? "");
  await expectNoHorizontalOverflow(page);

  await page.getByRole("button", { name: /Lihat analisis lengkap/ }).click();
  await expect(page).toHaveURL(/\/kalkulator\?step=hasil/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("PLTS On-Grid");
  await expect(page.getByRole("heading", { name: "Analisis keuangan" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("wizard lengkap: kota, golongan, hybrid, cicilan", async ({ page, isMobile }) => {
  await page.goto("/kalkulator");
  await expect(page.getByRole("heading", { name: "Lokasi & Atap", level: 2 })).toBeVisible();

  const city = page.getByRole("combobox", { name: "Kota atau kabupaten" });
  await city.click();
  await city.fill("Suraba");
  await page.getByRole("option", { name: /Surabaya/ }).click();
  await expect(city).toHaveValue("Surabaya");
  await expect(page.getByText("Jawa Timur").first()).toBeVisible();

  const next = page.getByRole("button", { name: isMobile ? /^Lanjut/ : /Lanjut: Pemakaian Listrik/ });
  await next.click();
  await expect(page.getByRole("heading", { name: "Pemakaian Listrik", level: 2 })).toBeVisible();
  await page.getByLabel("Golongan tarif").selectOption("R2");
  await page.getByLabel("Rata-rata tagihan per bulan").fill("2500000");

  await page.getByRole("button", { name: isMobile ? /^Lanjut/ : /Lanjut: Sistem PLTS/ }).click();
  await page.getByRole("radio", { name: /Hybrid/ }).click();

  await page.getByRole("button", { name: isMobile ? /^Lanjut/ : /Lanjut: Biaya/ }).click();
  await page.getByRole("radio", { name: "Cicilan / kredit" }).click();
  await expect(page.getByText("Cicilan per bulan")).toBeVisible();

  await page
    .getByRole("button", { name: isMobile ? /Lihat hasil/ : /Lihat hasil lengkap/ })
    .first()
    .click();
  await expect(page).toHaveURL(/step=hasil/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("PLTS Hybrid");
  await expect(page.getByText("Simulasi cicilan")).toBeVisible();
  await expect(page.getByText("Rekomendasi untuk Surabaya")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("simpan & bagikan menghasilkan tautan yang bisa dibuka", async ({ page }) => {
  await page.goto("/kalkulator?step=hasil");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("PLTS");
  await page.getByRole("button", { name: /Simpan & bagikan/ }).click();
  await page.getByLabel("Judul (opsional)").fill("Rumah Uji E2E");
  await page.getByRole("button", { name: "Buat tautan" }).click();
  const link = page.getByLabel("Tautan hasil");
  await expect(link).toHaveValue(/\/hasil\/[A-Za-z0-9]+$/);
  const url = await link.inputValue();

  await page.goto(new URL(url).pathname);
  await expect(page.getByText("Rumah Uji E2E")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("PLTS On-Grid");
  await expect(page.getByRole("button", { name: /Ubah di kalkulator saya/ })).toBeVisible();
});

test("tautan laporan yang tidak ada menampilkan 404 ramah", async ({ page }) => {
  const res = await page.goto("/hasil/tidakada99");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Halaman tidak ditemukan" })).toBeVisible();
});

test("halaman panduan & metodologi", async ({ page }) => {
  await page.goto("/panduan");
  await expect(page.getByRole("heading", { name: "Aturan PLTS atap terbaru" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.goto("/metodologi");
  await expect(page.getByRole("heading", { name: "Metodologi perhitungan" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("API perhitungan merespons ringkasan", async ({ request }) => {
  const res = await request.post("/api/calculate?view=summary", {
    data: {
      location: { cityId: "makassar" },
      consumption: { tariffId: "B2", va: 23000, monthlyBill: 8_000_000, profileId: "kantor" },
    },
  });
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json.summary.locationName).toBe("Makassar");
  expect(json.summary.kwp).toBeGreaterThan(5);
});
