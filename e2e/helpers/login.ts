import { Page, expect } from "@playwright/test";

/**
 * Role keys matching the API's integration test user factory
 * (threatzero-api/test/integration/role-test-users.ts). The API provisions
 * KC accounts + DB grants for each; Playwright drives the frontend login
 * form to acquire a browser session for each role.
 *
 * Tokens carry `aud: threatzero-api` because all role test users are
 * members of the "ThreatZero Administrator" KC group — see
 * _docs/integration-testing.md §2b. The real authority still comes from
 * the DB grants under AUTHORIZATION_SOURCE=db.
 */
export type RoleKey =
  | "system-admin"
  | "organization-admin"
  | "training-admin"
  | "tat-member"
  | "member";

export const ROLE_USERNAMES: Record<RoleKey, string> = {
  "system-admin": "test-integration@localhost.test",
  "organization-admin": "test-integration-org-admin@localhost.test",
  "training-admin": "test-integration-training-admin@localhost.test",
  "tat-member": "test-integration-tat-member@localhost.test",
  member: "test-integration-member@localhost.test",
};

const DEFAULT_PASSWORD =
  process.env.E2E_ROLE_USER_PASSWORD || "integration-test-password";

/**
 * Drive the Keycloak login form as the given role and wait for the app
 * dashboard to render. Assumes a fresh browser context (no existing KC
 * session) — call `context.clearCookies()` + clear storage first if
 * reusing a context across roles.
 */
export async function loginAsRole(page: Page, role: RoleKey): Promise<void> {
  const username = ROLE_USERNAMES[role];

  await page.goto("/");

  // KC's identity-first flow shows the email field, submits, then reveals
  // the password field on the next step.
  await page.getByRole("heading", { name: "Sign in to continue" }).waitFor();
  await page.getByRole("textbox", { name: "Email" }).fill(username);
  await page.getByRole("button", { name: "Sign In" }).click();

  await page.getByRole("textbox", { name: "Password" }).waitFor();
  await page.getByRole("textbox", { name: "Password" }).fill(DEFAULT_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();

  // Back on the app. Wait for a nav item that always renders for an
  // authenticated user (My Dashboard) as the signal the app has
  // hydrated /me and rendered the sidebar.
  await expect(page.getByRole("link", { name: "My Dashboard" })).toBeVisible({
    timeout: 30_000,
  });
}
