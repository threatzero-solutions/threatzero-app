import { MeResidence, MeResponse } from "../types/me";
import { findOneOrFail, insertOne } from "./utils";

/** Fetches the authenticated user's identity + authorization snapshot. */
export const getMe = () => findOneOrFail<MeResponse>("/me");

/** Canonical TanStack Query key for `/me`. */
export const ME_QUERY_KEY = ["me"] as const;

/**
 * Self-pick the residence unit for the given organization. Backend enforces
 * the first-set rule (`unitId IS NULL` or no row) and 409s on a second
 * write. Pass `unitId: null` to leave residence-unit unset (rare —
 * normally the picker requires a unit before submitting).
 *
 * See `_docs/residence-and-tenant-model.md` §5 (API surface).
 */
export const setMyResidence = (organizationId: string, unitId: string | null) =>
  insertOne<{ unitId: string | null }, MeResidence>(
    `/me/residences/${organizationId}`,
    { unitId },
  );
