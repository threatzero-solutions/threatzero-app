/**
 * Role × sidebar-nav visibility matrix. Drives the real Keycloak login
 * flow for each seed role and asserts which top-level nav items render.
 * This is the deterministic regression suite backing the exploratory
 * findings recorded during the `feat/me-consumption` cutover.
 *
 * Expectations track the capability seed in
 * `threatzero-api/src/migrations/1775500000000-add-authorization-tables.ts`
 * (+ 1775500000002 adding manage-system; + 1775500000004 merging TAT).
 *
 * Running locally:
 *   PLAYWRIGHT_BASE_URL=http://localhost:5174 npx playwright test role-nav
 * Prereqs: API running on :3001 with AUTHORIZATION_SOURCE=db against the
 * integration Neon branch, Vite dev server up, KC integration container
 * up, and role users provisioned per _docs/integration-testing.md.
 */
import { test, expect, BrowserContext } from "@playwright/test";
import { loginAsRole, RoleKey } from "./helpers/login";

interface RoleExpectation {
  role: RoleKey;
  /** Top-level link/button labels that MUST be visible in the sidebar. */
  expectVisible: string[];
  /** Top-level link/button labels that MUST NOT appear in the sidebar. */
  expectHidden: string[];
}

const EXPECTATIONS: RoleExpectation[] = [
  {
    role: "system-admin",
    expectVisible: [
      "My Dashboard",
      "Training Library",
      "Share a Safety Concern",
      "Safety Management",
      "Additional Resources",
      "Admin Panel",
      "My Organization",
    ],
    expectHidden: [],
  },
  {
    role: "organization-admin",
    expectVisible: [
      "My Dashboard",
      "Training Library",
      "Share a Safety Concern",
      "Safety Management",
      "Additional Resources",
      "My Organization",
    ],
    expectHidden: ["Admin Panel"],
  },
  {
    role: "training-admin",
    expectVisible: [
      "My Dashboard",
      "Training Library",
      "Share a Safety Concern",
      "Safety Management", // holds the Training Admin child
      "Additional Resources",
    ],
    expectHidden: ["Admin Panel", "My Organization"],
  },
  {
    role: "tat-member",
    expectVisible: [
      "My Dashboard",
      "Share a Safety Concern",
      "Safety Management",
    ],
    expectHidden: [
      "Admin Panel",
      "My Organization",
      "Training Library", // tat-member has no view-training
    ],
  },
  {
    role: "member",
    // This row is the canAny-fix regression guard. Before the fix, a
    // member's unit-level view-training / view-forms / view-resources
    // grants were invisible to the nav because can(cap) with no unitId
    // is org-wide. Training Library + Additional Resources re-appeared
    // once useNav switched to canAny.
    expectVisible: [
      "My Dashboard",
      "Training Library",
      "Share a Safety Concern",
      "Additional Resources",
    ],
    expectHidden: ["Admin Panel", "My Organization", "Safety Management"],
  },
];

/**
 * Each role gets its own fresh context so the KC SSO cookie from one role
 * doesn't leak into another. Using per-role contexts is cheap compared to
 * serializing storage state, and it keeps the test self-contained.
 */
async function freshContext(
  browser: import("@playwright/test").Browser,
): Promise<BrowserContext> {
  return await browser.newContext();
}

test.describe("Role nav visibility (integration)", () => {
  for (const exp of EXPECTATIONS) {
    test(`${exp.role} sees the expected top-level nav items`, async ({
      browser,
    }) => {
      const context = await freshContext(browser);
      const page = await context.newPage();

      try {
        await loginAsRole(page, exp.role);

        for (const label of exp.expectVisible) {
          // Match a link OR an expandable button inside the sidebar.
          // Safety Management / Additional Resources render as <button>;
          // everything else is a NavLink.
          const nav = page.locator("nav").first();
          const asLink = nav.getByRole("link", { name: label, exact: true });
          const asButton = nav.getByRole("button", {
            name: label,
            exact: true,
          });
          await expect(
            asLink.or(asButton).first(),
            `[${exp.role}] expected "${label}" in sidebar`,
          ).toBeVisible({ timeout: 10_000 });
        }

        for (const label of exp.expectHidden) {
          const nav = page.locator("nav").first();
          const asLink = nav.getByRole("link", { name: label, exact: true });
          const asButton = nav.getByRole("button", {
            name: label,
            exact: true,
          });
          await expect(
            asLink,
            `[${exp.role}] link "${label}" must NOT appear in sidebar`,
          ).toHaveCount(0);
          await expect(
            asButton,
            `[${exp.role}] button "${label}" must NOT appear in sidebar`,
          ).toHaveCount(0);
        }
      } finally {
        await context.close();
      }
    });
  }
});
