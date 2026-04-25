import { describe, expect, it } from "vitest";
import { makeCan, makeCanAny, UnitTreeNode } from "./can";
import { MeResponse } from "../types/me";

const baseIdentity = {
  id: "user-1",
  idpId: "kc-sub-1",
  email: "user@example.com",
  name: "Test User",
  givenName: "Test",
  familyName: "User",
  picture: null,
};

const baseOrg = {
  id: "org-1",
  slug: "acme",
  name: "Acme",
  labelPreset: "default" as const,
};

const makeMe = (overrides: Partial<MeResponse> = {}): MeResponse => ({
  identity: baseIdentity,
  scope: { kind: "tenant", organizationId: baseOrg.id },
  organization: baseOrg,
  units: [],
  capabilities: { organization: [], units: {} },
  tat: { organization: false, units: [] },
  residence: null,
  idpClaims: {
    organizationSlug: null,
    unitSlug: null,
    organizationUnitPath: null,
    peerUnits: [],
  },
  ...overrides,
});

const unitTree = (
  nodes: Array<[string, string | null]>,
): Map<string, UnitTreeNode> => {
  const map = new Map<string, UnitTreeNode>();
  nodes.forEach(([id, parentUnitId]) => {
    map.set(id, { id, parentUnitId });
  });
  return map;
};

describe("makeCan", () => {
  it("returns false for null/undefined /me", () => {
    expect(makeCan(null)("view-forms")).toBe(false);
    expect(makeCan(undefined)("view-forms")).toBe(false);
  });

  describe("org-wide capability", () => {
    it("passes when capability is listed organization-wide", () => {
      const me = makeMe({
        capabilities: { organization: ["view-forms"], units: {} },
      });
      expect(makeCan(me)("view-forms")).toBe(true);
    });

    it("fails when capability is not granted", () => {
      const me = makeMe({
        capabilities: { organization: ["view-training"], units: {} },
      });
      expect(makeCan(me)("view-forms")).toBe(false);
    });

    it("org-wide grant satisfies a unit-scoped check without needing unit presence (max-scope rule)", () => {
      // The backend's MeService suppresses unit entries when org grants the
      // same cap; the frontend must therefore accept the org entry as
      // sufficient for any unit-scoped question.
      const me = makeMe({
        capabilities: { organization: ["view-forms"], units: {} },
      });
      expect(makeCan(me)("view-forms", { unitId: "unit-anything" })).toBe(true);
    });
  });

  describe("unit-scoped capability", () => {
    it("passes when cap is directly granted at the target unit", () => {
      const me = makeMe({
        capabilities: {
          organization: [],
          units: { "unit-a": ["triage-safety-reports"] },
        },
      });
      expect(makeCan(me)("triage-safety-reports", { unitId: "unit-a" })).toBe(
        true,
      );
    });

    it("fails when a different unit holds the cap", () => {
      const me = makeMe({
        capabilities: {
          organization: [],
          units: { "unit-a": ["triage-safety-reports"] },
        },
      });
      expect(makeCan(me)("triage-safety-reports", { unitId: "unit-b" })).toBe(
        false,
      );
    });

    it("returns false for unit-scoped call without a unitId when cap is only unit-granted", () => {
      const me = makeMe({
        capabilities: {
          organization: [],
          units: { "unit-a": ["view-forms"] },
        },
      });
      expect(makeCan(me)("view-forms")).toBe(false);
    });
  });

  describe("ancestor inheritance", () => {
    it("inherits a capability from a parent unit", () => {
      // Tree: grandparent ← parent ← child
      const tree = unitTree([
        ["grandparent", null],
        ["parent", "grandparent"],
        ["child", "parent"],
      ]);
      const me = makeMe({
        capabilities: {
          organization: [],
          units: { parent: ["triage-safety-reports"] },
        },
      });
      expect(
        makeCan(me)("triage-safety-reports", {
          unitId: "child",
          unitTree: tree,
        }),
      ).toBe(true);
    });

    it("inherits from a grandparent", () => {
      const tree = unitTree([
        ["grandparent", null],
        ["parent", "grandparent"],
        ["child", "parent"],
      ]);
      const me = makeMe({
        capabilities: {
          organization: [],
          units: { grandparent: ["view-safety-reports"] },
        },
      });
      expect(
        makeCan(me)("view-safety-reports", {
          unitId: "child",
          unitTree: tree,
        }),
      ).toBe(true);
    });

    it("does not inherit from sibling units", () => {
      const tree = unitTree([
        ["parent", null],
        ["child-a", "parent"],
        ["child-b", "parent"],
      ]);
      const me = makeMe({
        capabilities: {
          organization: [],
          units: { "child-a": ["triage-safety-reports"] },
        },
      });
      expect(
        makeCan(me)("triage-safety-reports", {
          unitId: "child-b",
          unitTree: tree,
        }),
      ).toBe(false);
    });

    it("tolerates a missing unit tree (skip ancestor walk, direct grant still works)", () => {
      const me = makeMe({
        capabilities: {
          organization: [],
          units: { "unit-a": ["triage-safety-reports"] },
        },
      });
      expect(makeCan(me)("triage-safety-reports", { unitId: "unit-a" })).toBe(
        true,
      );
    });

    it("handles a cycle in the unit tree without infinite-looping", () => {
      const tree = unitTree([
        ["a", "b"],
        ["b", "a"],
      ]);
      const me = makeMe({
        capabilities: { organization: [], units: {} },
      });
      expect(makeCan(me)("manage-units", { unitId: "a", unitTree: tree })).toBe(
        false,
      );
    });
  });

  describe("scope kinds", () => {
    it("scope=system passes every capability check", () => {
      const me = makeMe({
        scope: { kind: "system", organizationId: null },
        organization: null,
        capabilities: { organization: [], units: {} },
      });
      expect(makeCan(me)("view-forms")).toBe(true);
      expect(makeCan(me)("manage-system")).toBe(true);
      expect(makeCan(me)("anything-at-all")).toBe(true);
      expect(makeCan(me)("triage-safety-reports", { unitId: "any-unit" })).toBe(
        true,
      );
    });

    it("scope=personal rejects every capability check", () => {
      const me = makeMe({
        scope: { kind: "personal", organizationId: null },
        organization: null,
        // Capabilities would normally be empty for personal scope but test
        // that even if something leaked in, personal scope still says no.
        capabilities: { organization: ["view-forms"], units: {} },
      });
      expect(makeCan(me)("view-forms")).toBe(false);
      expect(makeCan(me)("manage-system")).toBe(false);
    });

    it("scope=tenant gates normally", () => {
      const me = makeMe({
        capabilities: { organization: ["view-forms"], units: {} },
      });
      expect(makeCan(me)("view-forms")).toBe(true);
      expect(makeCan(me)("manage-forms")).toBe(false);
    });
  });

  describe("unitTree object-form (Record)", () => {
    it("accepts a plain Record as the unit index", () => {
      const tree: Record<string, UnitTreeNode> = {
        parent: { id: "parent", parentUnitId: null },
        child: { id: "child", parentUnitId: "parent" },
      };
      const me = makeMe({
        capabilities: {
          organization: [],
          units: { parent: ["view-safety-reports"] },
        },
      });
      expect(
        makeCan(me)("view-safety-reports", {
          unitId: "child",
          unitTree: tree,
        }),
      ).toBe(true);
    });
  });
});

describe("makeCanAny", () => {
  it("returns false for null/undefined /me", () => {
    expect(makeCanAny(null)("view-forms")).toBe(false);
    expect(makeCanAny(undefined)("view-forms")).toBe(false);
  });

  it("passes when capability is granted organization-wide", () => {
    const me = makeMe({
      capabilities: { organization: ["view-forms"], units: {} },
    });
    expect(makeCanAny(me)("view-forms")).toBe(true);
  });

  it("passes when capability is granted at any unit (no org-wide)", () => {
    const me = makeMe({
      capabilities: {
        organization: [],
        units: { "unit-a": ["view-training"] },
      },
    });
    expect(makeCanAny(me)("view-training")).toBe(true);
  });

  it("passes when capability is granted at one of several units", () => {
    const me = makeMe({
      capabilities: {
        organization: [],
        units: {
          "unit-a": ["unrelated-cap"],
          "unit-b": ["view-training"],
          "unit-c": ["also-unrelated"],
        },
      },
    });
    expect(makeCanAny(me)("view-training")).toBe(true);
  });

  it("fails when the capability appears nowhere", () => {
    const me = makeMe({
      capabilities: {
        organization: ["view-forms"],
        units: { "unit-a": ["view-training"] },
      },
    });
    expect(makeCanAny(me)("manage-system")).toBe(false);
  });

  it("scope=system passes every capability check unconditionally", () => {
    const me = makeMe({
      scope: { kind: "system", organizationId: null },
      organization: null,
      capabilities: { organization: [], units: {} },
    });
    expect(makeCanAny(me)("anything")).toBe(true);
  });

  it("scope=personal rejects every capability check unconditionally", () => {
    const me = makeMe({
      scope: { kind: "personal", organizationId: null },
      organization: null,
      capabilities: {
        organization: ["view-forms"],
        units: { "unit-a": ["view-training"] },
      },
    });
    expect(makeCanAny(me)("view-forms")).toBe(false);
    expect(makeCanAny(me)("view-training")).toBe(false);
  });
});
