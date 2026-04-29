/**
 * Change Log (audit history) regression suite. The history view is a
 * slide-over launched from the Users tab's "More actions" menu; it's
 * deep-linkable via `?view=history`. Exercises the launch, combobox user
 * filter, and row list (replaces the earlier wide table).
 *
 * Prereqs: live KC + API + Vite, role test users provisioned (run the
 * API integration suite first). The branch this targets is a prod-copy,
 * so tests avoid row-count assertions — they verify structure.
 */
import { test, expect, Page } from "@playwright/test";
import { loginAsRole } from "./helpers/login";

async function gotoUsersTab(page: Page) {
  await page.goto("/my-organization/users");
  // The Users tab nav link carries aria-current when active.
  await expect(
    page.getByRole("link", { name: "Users", exact: true }),
  ).toHaveAttribute("aria-current", "page", { timeout: 15_000 });
}

async function openChangeLog(page: Page) {
  await page.getByRole("button", { name: "More actions" }).click();
  await page.getByRole("menuitem", { name: /change log/i }).click();
  await expect(
    page.getByRole("heading", { name: "Change log", exact: true }),
  ).toBeVisible({ timeout: 10_000 });
}

test.describe("Change log (integration)", () => {
  test("opens from the Users tab more-actions menu", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await loginAsRole(page, "organization-admin");
      await gotoUsersTab(page);
      await openChangeLog(page);

      // Slide-over carries its own subheading referencing the org.
      await expect(
        page.getByText(/Grant and revoke events for/i),
      ).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test("closes the slide-over and drops the URL param", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await loginAsRole(page, "organization-admin");
      await gotoUsersTab(page);
      await openChangeLog(page);

      await expect(page).toHaveURL(/[?&]view=history/);

      await page.getByRole("button", { name: "Close change log" }).click();
      await expect(
        page.getByRole("heading", { name: "Change log", exact: true }),
      ).toBeHidden();
      await expect(page).not.toHaveURL(/[?&]view=history/);
    } finally {
      await context.close();
    }
  });

  test("deep link to ?view=history opens the slide-over directly", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await loginAsRole(page, "organization-admin");
      await page.goto("/my-organization/users?view=history");

      await expect(
        page.getByRole("heading", { name: "Change log", exact: true }),
      ).toBeVisible({ timeout: 15_000 });
    } finally {
      await context.close();
    }
  });

  test("user filter combobox is wired and searchable", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await loginAsRole(page, "organization-admin");
      await page.goto("/my-organization/users?view=history");

      const filter = page.getByRole("combobox", { name: /filter by user/i });
      await expect(filter).toBeVisible({ timeout: 10_000 });

      // Typing into the combobox should show matching options; we type a
      // character likely to match *something* in a prod-copy org without
      // asserting a specific email.
      await filter.fill("a");
      await expect(page.getByRole("option").first()).toBeVisible({
        timeout: 5_000,
      });
    } finally {
      await context.close();
    }
  });

  test("event list renders entries or a calm empty state", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await loginAsRole(page, "organization-admin");
      await page.goto("/my-organization/users?view=history");

      await expect(
        page.getByRole("heading", { name: "Change log", exact: true }),
      ).toBeVisible({ timeout: 15_000 });

      await page.waitForLoadState("networkidle", { timeout: 15_000 });

      // Either the list contains action words (granted/revoked) or a
      // "No events recorded" empty-state row.
      const list = page.getByTestId("change-log-list");
      const text = (await list.innerText()).toLowerCase();
      const hasActions = text.includes("granted") || text.includes("revoked");
      const isEmpty = text.includes("no events recorded");
      expect(hasActions || isEmpty).toBe(true);
    } finally {
      await context.close();
    }
  });
});
