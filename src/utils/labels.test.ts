import { describe, expect, it } from "vitest";
import { DEFAULT_LABEL_BUNDLE, labelsForPreset } from "./labels";

describe("labelsForPreset", () => {
  it("returns the default bundle for the 'default' preset", () => {
    expect(labelsForPreset("default")).toEqual(DEFAULT_LABEL_BUNDLE);
  });

  it("returns school-flavored labels for the 'school' preset", () => {
    const bundle = labelsForPreset("school");
    expect(bundle.unitSingular).toBe("School");
    expect(bundle.unitPlural).toBe("Schools");
    // Schools collapse team vocabulary onto the unit label so the dashboard
    // reads naturally.
    expect(bundle.teamSingular).toBe("School");
    expect(bundle.teamPlural).toBe("Schools");
  });

  it("returns business-flavored labels for the 'business' preset", () => {
    const bundle = labelsForPreset("business");
    expect(bundle.unitSingular).toBe("Site");
    expect(bundle.unitPlural).toBe("Sites");
    // Business orgs keep team as its own thing.
    expect(bundle.teamSingular).toBe("Team");
    expect(bundle.teamPlural).toBe("Teams");
  });

  it("falls back to the default bundle for null / undefined preset", () => {
    expect(labelsForPreset(null)).toEqual(DEFAULT_LABEL_BUNDLE);
    expect(labelsForPreset(undefined)).toEqual(DEFAULT_LABEL_BUNDLE);
  });

  it("falls back to the default bundle for unknown presets (forward-compat)", () => {
    // Cast through `any` intentionally — we want to prove the runtime
    // fallback works even if the backend rolls out a new preset before
    // this client catches up.
    expect(labelsForPreset("manufacturing" as unknown as "default")).toEqual(
      DEFAULT_LABEL_BUNDLE,
    );
  });
});
