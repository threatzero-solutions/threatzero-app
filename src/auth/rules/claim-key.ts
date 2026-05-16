/**
 * The rule engine matches on fully-namespaced claim keys like
 * `tz.idp.department`. The prefix prevents collisions with standard
 * JWT claims (`sub`, `email`, etc.) and is applied behind the scenes
 * when a claim is configured in Forwarded Claims.
 *
 * Admins never need to see or type the prefix. These helpers translate
 * between the on-the-wire full form and the prefix-stripped short name
 * the UI works in.
 */
export const CLAIM_KEY_PREFIX = "tz.idp.";

export const toDisplayClaimKey = (
  fullKey: string | undefined | null,
): string =>
  fullKey?.startsWith(CLAIM_KEY_PREFIX)
    ? fullKey.slice(CLAIM_KEY_PREFIX.length)
    : (fullKey ?? "");

export const toFullClaimKey = (shortName: string): string =>
  shortName ? `${CLAIM_KEY_PREFIX}${shortName}` : "";
