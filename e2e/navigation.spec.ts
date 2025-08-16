import { expect, test } from "@playwright/test";

test("home → about via header nav", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Insights|Perspectivas|Iterations/i);

  const aboutLink = page.getByRole("link", { name: /about|acerca de/i });
  await aboutLink.click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("mobile nav renders and closes", async ({ page }) => {
  await page.goto("/");
  await page.setViewportSize({ width: 375, height: 812 });

  const toggle = page.getByRole("button", { name: /toggle navigation/i });
  await toggle.click();
  await expect(page.locator("#mobile-menu")).toBeVisible();

  // Click outside to close
  await page.click("body", { position: { x: 1, y: 1 } });
  await expect(page.locator("#mobile-menu")).toBeHidden();
});
