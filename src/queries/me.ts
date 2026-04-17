import { MeResponse } from "../types/me";
import { findOneOrFail } from "./utils";

/** Fetches the authenticated user's identity + authorization snapshot. */
export const getMe = () => findOneOrFail<MeResponse>("/me");

/** Canonical TanStack Query key for `/me`. */
export const ME_QUERY_KEY = ["me"] as const;
