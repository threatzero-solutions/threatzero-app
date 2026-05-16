/**
 * Allowed target fields for IDP profile-sync mappings. Kept in lockstep
 * with the backend `ALLOWED_IMPORTED_ATTRIBUTES` whitelist in
 * `create-organization-idp.dto.ts`. The backend enforces the list via
 * `@IsIn`; this file just provides labels for the FE dropdown.
 */
export const IDP_PROFILE_FIELDS = [
  { value: "firstName", label: "First name" },
  { value: "lastName", label: "Last name" },
  { value: "email", label: "Email" },
  { value: "picture", label: "Profile picture URL" },
  { value: "title", label: "Title" },
] as const;

export type IdpProfileField = (typeof IDP_PROFILE_FIELDS)[number]["value"];
