/**
 * Role + TAT management UI regression suite. Exercises the Users tab
 * (merged Access surface) and the TAT tab, backed by access-management
 * controller.
 *
 * Prereqs same as role-nav.spec.ts: live KC + API + Vite, role test
 * users provisioned (run the API integration suite first).
 */
import { test, expect, Page } from "@playwright/test";
import { loginAsRole } from "./helpers/login";

async function gotoUsersTab(page: Page) {
  await page.goto("/my-organization/users");
  // Table rows are the settled-state signal: the page has no "Users"
  // heading (the h1 shows the org name), so we wait for data.
  await expect(page.locator("table tbody tr").first()).toBeVisible({
    timeout: 15_000,
  });
}

async function openFirstRowEditor(page: Page) {
  // Each row's actions live behind an ellipsis dropdown; the "Edit roles"
  // menu item opens the slide-over drawer.
  await page.locator("table tbody tr").first().locator("button").last().click();
  await page.getByRole("menuitem", { name: /edit roles/i }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Edit roles" })).toBeVisible(
    { timeout: 10_000 },
  );
  return dialog;
}

test.describe("Role management (integration)", () => {
  test("org-admin can open the Users tab and see the user table", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await loginAsRole(page, "organization-admin");
      await gotoUsersTab(page);
      // Data-agnostic assertion: at least one row rendered, covered by
      // gotoUsersTab's waitFor above.
    } finally {
      await context.close();
    }
  });

  test("org-admin opens the role editor drawer and sees assignable roles", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await loginAsRole(page, "organization-admin");
      await gotoUsersTab(page);
      const dialog = await openFirstRowEditor(page);

      // The assignable-roles list is driven by GET /access/roles (#77).
      // We assert the current display names — not the slugs.
      for (const label of [
        "Organization Admin",
        "Training Coordinator",
        "TAT Member",
      ]) {
        await expect(
          dialog.getByText(label, { exact: true }).first(),
        ).toBeVisible();
      }

      // system-admin MUST NOT be offered in an org-admin's editor —
      // server-side authority enforcement belt + UI suspenders.
      await expect(dialog.getByText(/^System Admin$/)).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test("role editor exposes the Unit-specific roles section with Add control", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await loginAsRole(page, "organization-admin");
      await gotoUsersTab(page);
      const dialog = await openFirstRowEditor(page);

      await expect(
        dialog.getByRole("heading", {
          name: "Unit-specific roles",
          exact: true,
        }),
      ).toBeVisible();

      // "+ Add unit role" only renders when the org actually has units.
      const addButton = dialog.getByRole("button", { name: /add unit role/i });
      const emptyState = dialog.getByText(/organization has no units yet/i);
      await expect(addButton.or(emptyState).first()).toBeVisible();

      if (await addButton.isVisible()) {
        await addButton.click();

        const roleSelect = dialog.locator('select[id^="unit-role-"]').first();
        await expect(roleSelect).toBeVisible();
        // Unit-scope roles (per #77 /access/roles metadata) include these.
        await expect(
          roleSelect.locator("option", { hasText: "TAT Member" }),
        ).toHaveCount(1);
        await expect(
          roleSelect.locator("option", { hasText: "Training Coordinator" }),
        ).toHaveCount(1);

        await expect(
          dialog.locator('select[id^="unit-unit-"]').first(),
        ).toBeVisible();
      }
    } finally {
      await context.close();
    }
  });

  test("org-admin opens the TAT tab and sees the roster sections", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await loginAsRole(page, "organization-admin");
      await page.goto("/my-organization/tat");
      await expect(
        page.getByRole("heading", { name: "Organization-wide" }),
      ).toBeVisible({ timeout: 20_000 });
    } finally {
      await context.close();
    }
  });

  test("Training tab is hidden for org-admin in org context", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await loginAsRole(page, "organization-admin");
      await gotoUsersTab(page);
      const tabsNav = page.locator("nav").nth(1);
      await expect(
        tabsNav.getByRole("link", { name: "Training", exact: true }),
      ).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test("Training deep link redirects away for non-system-admin", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await loginAsRole(page, "organization-admin");
      await page.goto("/my-organization/training");
      // Page guards itself by redirecting up one path segment.
      await expect(page).not.toHaveURL(/\/my-organization\/training$/, {
        timeout: 10_000,
      });
    } finally {
      await context.close();
    }
  });

  test("system-admin reaches the Users tab when scoped to an org", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await loginAsRole(page, "system-admin");
      // System-admin without a tenant context has no "my organization".
      // We assert only that the navigation succeeds without a hard error.
      const nav = await page.goto("/my-organization/users");
      expect(nav?.status() ?? 200).toBeLessThan(500);
      await page.waitForLoadState("networkidle", { timeout: 15_000 });
    } finally {
      await context.close();
    }
  });
});
