import { expect, test } from "@playwright/test";

// Alur utama di ponsel: login -> catat usaha -> kunjungan -> skor + penjelasan -> dasbor.
test("alur utama mustahik, pendamping, manajer", async ({ page }) => {
  // 1. Login sebagai mustahik dan catat usaha
  await page.goto("/masuk/");
  await page.getByRole("button", { name: /Masuk/ }).first().click();
  await expect(page.getByText("Tahap saat ini")).toBeVisible();
  await expect(page.getByText("SINTETIS").first()).toBeVisible();
  await page.getByRole("link", { name: /Catat hari ini/ }).click();
  await page.locator("#omzet").fill("450000");
  await page.locator("#biaya").fill("250000");
  await page.locator("#tabungan").fill("30000");
  await page.getByRole("button", { name: "Simpan catatan" }).click();
  await expect(page.getByText("Catatan tersimpan")).toBeVisible();
  await page.getByRole("button", { name: "Kembali ke beranda" }).click();
  await expect(page.getByText(/proyeksi dari 1 hari tercatat/)).toBeVisible();
  await page.getByLabel("Keluar").click();

  // 2. Pendamping: kunjungan dan penjelasan skor
  await page.goto("/masuk/");
  await page.getByRole("button", { name: /Masuk/ }).nth(1).click();
  await page.goto("/pendamping/detail/?id=M001");
  await expect(page.getByText("Penjelasan skor bulan terakhir")).toBeVisible();
  await expect(page.getByText(/Versi parameter/)).toBeVisible();
  await expect(page.getByText(/keputusan akhir ada pada amil/).first()).toBeVisible();
  await page.getByRole("link", { name: /Kunjungan/ }).click();
  await page.getByRole("button", { name: "Catatan keuangan" }).click();
  await page.getByRole("button", { name: "Sepi pembeli" }).click();
  await page.locator("#cat").fill("Uji e2e");
  await page.getByRole("button", { name: "Simpan kunjungan" }).click();
  await expect(page.getByText("baru (perangkat)")).toBeVisible();
  await page.getByLabel("Keluar").click();

  // 3. Manajer: dasbor
  await page.goto("/masuk/");
  await page.getByRole("button", { name: /Masuk/ }).nth(2).click();
  await expect(page.getByRole("heading", { name: "Dasbor program" })).toBeVisible();
  await expect(page.getByText("Sebaran tahap per bulan")).toBeVisible();
});

test("halaman peran lain dilindungi", async ({ page }) => {
  await page.goto("/manajer/");
  await expect(page).toHaveURL(/\/masuk\//);
});

test("buku usaha tetap berjalan saat luring dan tersinkron saat daring", async ({ page, context }) => {
  await page.goto("/masuk/");
  await page.getByRole("button", { name: /Masuk/ }).first().click();
  await expect(page.getByText("Tahap saat ini")).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.getByRole("link", { name: /Catat hari ini/ }).click(); // muat halaman catat selagi daring
  await expect(page.locator("#omzet")).toBeVisible();
  await page.getByRole("link", { name: "Beranda" }).click();

  await context.setOffline(true);
  await page.getByRole("link", { name: /Catat hari ini/ }).click();
  await page.locator("#omzet").fill("300000");
  await page.getByRole("button", { name: "Simpan catatan" }).click();
  await expect(page.getByText(/Anda luring/)).toBeVisible();
  await page.getByRole("button", { name: "Kembali ke beranda" }).click();
  await expect(page.getByText("Menunggu").first()).toBeVisible();

  await context.setOffline(false);
  await expect(page.getByText(/Tersinkron \(simulasi\)/).first()).toBeVisible({ timeout: 10_000 });
});
