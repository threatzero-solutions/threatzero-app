/**
 * The single nav definition the chrome consumes.
 *
 * Read by `Sidebar` for the visible primary nav and by `CommandPalette`
 * for the search index. One source so the palette never knows about a
 * route the sidebar can't see, and the sidebar never lists one the
 * palette wouldn't find.
 *
 * Structure: the nav is divided into sections. The first section has no
 * title (it's what training participants see); subsequent sections
 * carry uppercase typographic headers (`SAFETY MANAGEMENT`, `ADMIN
 * PANEL`). A section is hidden when none of its items pass the user's
 * permission filter.
 *
 * Items can still be nested via `children` for the rare expandable
 * sub-tree (e.g. Resources with four category pages); the sidebar
 * renders those as Disclosure groups within their section.
 */
import { ReactNode } from "react";
import {
  House,
  GraduationCap,
  ShieldCheck,
  FolderSimple,
  Buildings,
  Toolbox,
  Notepad,
  Stack,
  Translate,
  UserGear,
  Wrench,
  Warning,
  WarningOctagon,
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

export interface ChromeNavSection {
  /** Optional uppercase header; the first section typically has none. */
  title?: string;
  /** Section-level gate; hides the whole section when items still resolve. */
  permissionOptions?: NavigationItem["permissionOptions"];
  items: ChromeNavItem[];
}

export const CHROME_NAV: ChromeNavSection[] = [
  // Top group — what training participants see. No header.
  {
    items: [
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
        name: "Training Tools",
        icon: Toolbox,
        permissionOptions: trainingAdminPermissionOptions,
        children: [
          {
            name: "Completions",
            to: "/safety-management/training-admin/completions",
          },
          {
            name: "Invites",
            to: "/safety-management/training-admin/invites",
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
        name: "My Organization",
        to: "/my-organization",
        icon: Buildings,
        permissionOptions: myOrganizationPermissionOptions,
      },
    ],
  },
  // Safety Management section
  {
    title: "Safety Management",
    permissionOptions: safetyManagementPermissionOptions,
    items: [
      {
        name: "Safety Concerns",
        to: "/safety-management/safety-concerns",
        icon: Warning,
        permissionOptions: safetyConcernPermissionsOptions,
      },
      {
        name: "Threat Assessments",
        to: "/safety-management/threat-assessments",
        icon: ShieldCheck,
        permissionOptions: threatAssessmentPermissionsOptions,
      },
      {
        name: "Violent Incident Log",
        to: "/safety-management/violent-incident-reports",
        icon: WarningOctagon,
        permissionOptions: violentIncidentReportPermissionsOptions,
      },
    ],
  },
  // Admin Panel section — flattens the old in-page tabs into the chrome
  // so admins can jump straight to a sub-surface from anywhere.
  {
    title: "Admin Panel",
    permissionOptions: adminPanelPermissionOptions,
    items: [
      {
        name: "Organizations",
        to: "/admin-panel/organizations",
        icon: Buildings,
      },
      {
        name: "Courses",
        to: "/admin-panel/courses",
        icon: GraduationCap,
      },
      {
        name: "Forms",
        to: "/admin-panel/forms",
        icon: Notepad,
      },
      {
        name: "Resources",
        to: "/admin-panel/resources",
        icon: Stack,
      },
      {
        name: "Languages",
        to: "/admin-panel/languages",
        icon: Translate,
      },
      {
        name: "System Admins",
        to: "/admin-panel/system-admins",
        icon: UserGear,
      },
      {
        name: "Advanced",
        to: "/admin-panel/advanced",
        icon: Wrench,
      },
    ],
  },
];

export interface FlatNavEntry {
  id: string;
  label: string;
  to: string;
  group?: string;
  icon?: PhosphorIcon;
  permissionOptions?: NavigationItem["permissionOptions"];
}

/**
 * Flatten the sectioned nav into a list of navigable destinations for
 * the command palette's search index. Each entry inherits the section's
 * title as `group` for context. Disclosure parents without a `to` are
 * skipped; their children carry the path with the parent name as group.
 */
export const flattenNav = (sections: ChromeNavSection[]): FlatNavEntry[] => {
  const out: FlatNavEntry[] = [];
  for (const section of sections) {
    for (const item of section.items) {
      if (item.to) {
        out.push({
          id: item.to,
          label: item.name,
          to: item.to,
          group: section.title,
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
            group: section.title
              ? `${section.title} · ${item.name}`
              : item.name,
            icon: item.icon,
            permissionOptions: child.permissionOptions,
          });
        }
      }
    }
  }
  return out;
};
