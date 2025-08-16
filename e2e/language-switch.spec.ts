import { expect, test } from "@playwright/test";

test("desktop language select switches path prefix", async ({ page }) => {
  await page.goto("/");
  const select = page.locator("#lang-select");
  await expect(select).toBeVisible();

  // Switch to Spanish
  await select.selectOption("es");
  await expect(page).toHaveURL(/\/es(\/|$)/);

  // Header title should be Spanish variant (scope to header)
  const header = page.locator("header");
  await expect(header.getByText(/Perspectivas e Iteraciones/i)).toBeVisible();

  // Switch back to English
  await page.locator("#lang-select").selectOption("en");
  await expect(page).toHaveURL(/^http.*\/$/);
  await expect(header.getByText(/Insights & Iterations/i)).toBeVisible();
});
