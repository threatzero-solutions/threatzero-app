/**
 * Queries + mutations for the System Admins page in the admin panel.
 * Backed by the dedicated `/admin/system-admins` controller — kept off
 * the org module on purpose so an org-admin session can't accidentally
 * grant cross-tenant privilege through the same surface they manage
 * regular users from.
 */
import axios from "axios";
import { API_BASE_URL } from "../contexts/core/constants";
import { findOneOrFail } from "./utils";

export interface SystemAdminEntry {
  grantId: string;
  grantedAt: string;
  source: "manual" | "sso" | "rule";
  user: {
    id: string;
    idpId: string | null;
    email: string;
    givenName: string | null;
    familyName: string | null;
  };
}

const path = (sub = "") => `admin/system-admins${sub}`;

export const SYSTEM_ADMINS_QUERY_KEY = ["admin", "system-admins"] as const;

export const listSystemAdmins = () => findOneOrFail<SystemAdminEntry[]>(path());

export const grantSystemAdmin = async (
  email: string,
): Promise<{ grantId: string }> => {
  const res = await axios.post(`${API_BASE_URL}/${path()}`, { email });
  return res.data;
};

export const revokeSystemAdmin = async (userId: string): Promise<void> => {
  await axios.delete(
    `${API_BASE_URL}/${path("/")}${encodeURIComponent(userId)}`,
  );
};
