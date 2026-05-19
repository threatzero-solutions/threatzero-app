/**
 * The single nav definition the chrome consumes.
 *
 * Read by `Sidebar` for the visible primary nav and by `CommandPalette`
 * for the search index. One source so the palette never knows about a
 * route the sidebar can't see, and the sidebar never lists one the
 * palette wouldn't find.
 *
 * Each item declares its own icon component (Phosphor) and optional
 * permission options, which both consumers run through `useNav` to
 * filter to the current user's grants.
 */
import { ReactNode } from "react";
import {
  House,
  GraduationCap,
  Flag,
  ShieldCheck,
  FolderSimple,
  GearSix,
  Buildings,
} from "@phosphor-icons/react";
import {
  trainingLibraryPermissionsOptions,
  safetyManagementPermissionOptions,
  safetyConcernPermissionsOptions,
  threatAssessmentPermissionsOptions,
  violentIncidentReportPermissionsOptions,
  trainingAdminPermissionOptions,
  resourcePermissionsOptions,
  adminPanelPermissionOptions,
  myOrganizationPermissionOptions,
} from "../../constants/permission-options";
import { NavigationItem } from "../../types/core";

export type PhosphorIcon = (props: {
  size?: number | string;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  className?: string;
}) => ReactNode;

export interface ChromeNavItem extends NavigationItem {
  icon?: PhosphorIcon;
  children?: ChromeNavItem[];
}

/**
 * Top-level chrome nav. "Share a Safety Concern" is now "Safety Concerns"
 * and "Additional Resources" is now "Resources" — the verb→noun rename
 * called out in the critique.
 */
export const CHROME_NAV: ChromeNavItem[] = [
  {
    name: "My Dashboard",
    to: "/dashboard",
    icon: House,
  },
  {
    name: "Training Library",
    to: "/training/library",
    icon: GraduationCap,
    permissionOptions: trainingLibraryPermissionsOptions,
  },
  {
    name: "Safety Concerns",
    to: "/safety-concerns",
    icon: Flag,
  },
  {
    name: "Safety Management",
    icon: ShieldCheck,
    permissionOptions: safetyManagementPermissionOptions,
    children: [
      {
        name: "Safety Concerns",
        to: "/safety-management/safety-concerns",
        permissionOptions: safetyConcernPermissionsOptions,
      },
      {
        name: "Threat Assessments",
        to: "/safety-management/threat-assessments",
        permissionOptions: threatAssessmentPermissionsOptions,
      },
      {
        name: "Violent Incident Log",
        to: "/safety-management/violent-incident-reports",
        permissionOptions: violentIncidentReportPermissionsOptions,
      },
      {
        name: "Training Admin",
        to: "/safety-management/training-admin",
        permissionOptions: trainingAdminPermissionOptions,
      },
    ],
  },
  {
    name: "Resources",
    icon: FolderSimple,
    permissionOptions: resourcePermissionsOptions,
    children: [
      { name: "Prevention", to: "/resources/prevention" },
      { name: "Preparation", to: "/resources/preparation" },
      { name: "Response", to: "/resources/response" },
      { name: "Resilience", to: "/resources/resilience" },
    ],
  },
  {
    name: "Admin Panel",
    to: "/admin-panel",
    icon: GearSix,
    permissionOptions: adminPanelPermissionOptions,
  },
  {
    name: "My Organization",
    to: "/my-organization",
    icon: Buildings,
    permissionOptions: myOrganizationPermissionOptions,
  },
];

/**
 * Flatten the nav into a list of navigable destinations for the command
 * palette's search index. Parent items without a `to` (group headers) are
 * skipped; their children carry the path. The label includes the parent
 * for context ("Safety Management · Threat Assessments") so the palette
 * disambiguates when multiple entries share a leaf name.
 */
export interface FlatNavEntry {
  id: string;
  label: string;
  to: string;
  group?: string;
  icon?: PhosphorIcon;
  permissionOptions?: NavigationItem["permissionOptions"];
}

export const flattenNav = (items: ChromeNavItem[]): FlatNavEntry[] => {
  const out: FlatNavEntry[] = [];
  for (const item of items) {
    if (item.to) {
      out.push({
        id: item.to,
        label: item.name,
        to: item.to,
        icon: item.icon,
        permissionOptions: item.permissionOptions,
      });
    }
    if (item.children) {
      for (const child of item.children) {
        if (!child.to) continue;
        out.push({
          id: child.to,
          label: child.name,
          to: child.to,
          group: item.name,
          icon: item.icon,
          permissionOptions: child.permissionOptions,
        });
      }
    }
  }
  return out;
};
