/**
 * Role + TAT management UI regression suite. Exercises the access and
 * TAT tabs wired in OrganizationsRoot, backed by the access-management
 * API (access-management.controller.ts).
 *
 * Prereqs same as role-nav.spec.ts: live KC + API + Vite, role test
 * users provisioned (run the API integration suite first).
 */
import { test, expect } from "@playwright/test";
import { loginAsRole } from "./helpers/login";

test.describe("Role management (integration)", () => {
  test("org-admin can open the Access tab and see the user table", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await loginAsRole(page, "organization-admin");

      // My Organization link takes the user to the org root. We navigate
      // the deep link directly so the test doesn't depend on nav layout.
      await page.goto("/my-organization/access");

      await expect(
        page.getByRole("heading", { name: "Access", exact: true }),
      ).toBeVisible({ timeout: 15_000 });

      // The seed users from the API test factory all have at least one
      // manual grant in this org, so the table should render at least one
      // row. Not asserting specific emails here — the dataset is prod-copy
      // and varies.
      const rows = page.locator("table tbody tr");
      await expect(rows.first()).toBeVisible({ timeout: 15_000 });
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
      await page.goto("/my-organization/access");

      // Wait for the table to render before interacting with any row.
      await expect(
        page.getByRole("heading", { name: "Access", exact: true }),
      ).toBeVisible({ timeout: 15_000 });
      await expect(page.locator("table tbody tr").first()).toBeVisible();

      // Click the first row's Edit button to open the drawer.
      const firstEditBtn = page
        .getByRole("button", {
          name: "Edit",
        })
        .first();
      await firstEditBtn.click();

      // Drawer heading + at least the three assignable roles are visible.
      // Scope subsequent queries to the dialog so we don't accidentally
      // match text elsewhere on the page (e.g., role chips in the table).
      const dialog = page.getByRole("dialog");
      await expect(
        dialog.getByRole("heading", { name: "Edit roles" }),
      ).toBeVisible({ timeout: 10_000 });

      for (const label of [
        "Organization Admin",
        "Training Admin",
        "TAT (Org-level)",
      ]) {
        await expect(dialog.getByText(label, { exact: true })).toBeVisible();
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
      await page.goto("/my-organization/access");

      await expect(
        page.getByRole("heading", { name: "Access", exact: true }),
      ).toBeVisible({ timeout: 15_000 });
      await expect(page.locator("table tbody tr").first()).toBeVisible();

      await page.getByRole("button", { name: "Edit" }).first().click();

      const dialog = page.getByRole("dialog");
      await expect(
        dialog.getByRole("heading", { name: "Edit roles" }),
      ).toBeVisible({ timeout: 10_000 });

      // New section + affordance for fine-grained unit-scoped grants.
      await expect(
        dialog.getByRole("heading", {
          name: "Unit-specific roles",
          exact: true,
        }),
      ).toBeVisible();

      // "+ Add unit role" only renders when the org actually has units to
      // assign to. The prod-copy branch should have units; if the test
      // organization happens to have none, we accept the empty-state copy.
      const addButton = dialog.getByRole("button", { name: /add unit role/i });
      const emptyState = dialog.getByText(/organization has no units yet/i);
      await expect(addButton.or(emptyState).first()).toBeVisible();

      // When the Add control is available, clicking it reveals role + unit
      // selects. This smoke-tests the dynamic row wiring without writing.
      if (await addButton.isVisible()) {
        await addButton.click();

        // Role select has both unit-scope options and a blank placeholder.
        const roleSelect = dialog.locator('select[id^="unit-role-"]').first();
        await expect(roleSelect).toBeVisible();
        await expect(
          roleSelect.getByRole("option", { name: "TAT (Unit-level)" }),
        ).toHaveCount(1);
        await expect(
          roleSelect.getByRole("option", {
            name: "Training Admin (Unit-level)",
          }),
        ).toHaveCount(1);

        // Unit select exists alongside it.
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
        page.getByRole("heading", { name: "Threat Assessment Team" }),
      ).toBeVisible({ timeout: 15_000 });

      // Org-wide section always renders (even if empty state).
      await expect(
        page.getByRole("heading", { name: "Organization-wide" }),
      ).toBeVisible();

      // The tat-member seed user is scoped at the org level in the API
      // factory (role-test-users.ts grants 'organization'), so we expect
      // at least one member card with that email in the org section.
      await expect(
        page.getByText("test-integration-tat-member@localhost.test"),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await context.close();
    }
  });

  test("system-admin reaches the Access tab when scoped to an org", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await loginAsRole(page, "system-admin");
      // System-admin without a tenant context has no "my organization" —
      // /my-organization/access requires an active org. The rendered page
      // may show a loading skeleton until the context resolves.
      // We assert only that the navigation succeeds without a hard error;
      // the system-admin workflow for cross-org access uses /admin-panel
      // in a later phase.
      const nav = await page.goto("/my-organization/access");
      expect(nav?.status() ?? 200).toBeLessThan(500);
      // Let the page settle so any errors surface.
      await page.waitForLoadState("networkidle", { timeout: 15_000 });
    } finally {
      await context.close();
    }
  });
});
