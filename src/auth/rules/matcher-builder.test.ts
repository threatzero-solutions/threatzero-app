import { describe, expect, it } from "vitest";
import {
  MatcherBuilder,
  MatcherBuilderError,
  compileMatcher,
  toJsRegex,
} from "./matcher-builder";

const b = (over: Partial<MatcherBuilder>): MatcherBuilder => ({
  op: "equals",
  values: ["x"],
  caseInsensitive: false,
  ...over,
});

const matches = (pattern: string, input: string): boolean =>
  toJsRegex(pattern).test(input);

describe("compileMatcher (FE parity)", () => {
  it("equals: single exact match, anchored", () => {
    const p = compileMatcher(b({ op: "equals", values: ["Security"] }));
    expect(matches(p, "Security")).toBe(true);
    expect(matches(p, "Securityx")).toBe(false);
  });

  it("equals: case-insensitive", () => {
    const p = compileMatcher(
      b({ op: "equals", values: ["Security"], caseInsensitive: true }),
    );
    expect(matches(p, "SECURITY")).toBe(true);
    expect(matches(p, "security")).toBe(true);
  });

  it("ends-with: suffix only", () => {
    const p = compileMatcher(b({ op: "ends-with", values: ["-admin"] }));
    expect(matches(p, "sec-admin")).toBe(true);
    expect(matches(p, "admin-sec")).toBe(false);
  });

  it("contains: substring match", () => {
    const p = compileMatcher(b({ op: "contains", values: ["sec"] }));
    expect(matches(p, "security-ops")).toBe(true);
    expect(matches(p, "finance")).toBe(false);
  });

  it("starts-with: prefix only", () => {
    const p = compileMatcher(b({ op: "starts-with", values: ["SEC-"] }));
    expect(matches(p, "SEC-ADMIN")).toBe(true);
    expect(matches(p, "xSEC-ADMIN")).toBe(false);
  });

  it("escapes regex metacharacters in user values", () => {
    const p = compileMatcher(b({ op: "equals", values: ["a.b"] }));
    expect(matches(p, "a.b")).toBe(true);
    expect(matches(p, "ab")).toBe(false);
  });

  it("trims whitespace around values", () => {
    const p = compileMatcher(b({ op: "equals", values: ["  hello  "] }));
    expect(matches(p, "hello")).toBe(true);
  });

  it("rejects empty value lists", () => {
    expect(() => compileMatcher(b({ values: [] }))).toThrow(
      MatcherBuilderError,
    );
  });

  it("rejects whitespace-only values", () => {
    expect(() => compileMatcher(b({ values: ["  "] }))).toThrow(
      MatcherBuilderError,
    );
  });

  it("produces identical output to the API canonical compiler", () => {
    // Cross-check: these expected strings are the same format the API
    // `matcher-builder.ts` produces (see its spec). If this test ever
    // diverges, FE/BE parity has drifted.
    expect(compileMatcher(b({ op: "equals", values: ["A", "B"] }))).toBe(
      "^(?:A|B)$",
    );
    expect(
      compileMatcher(
        b({ op: "contains", values: ["x"], caseInsensitive: true }),
      ),
    ).toBe("(?i)^.*(?:x).*$");
    expect(compileMatcher(b({ op: "starts-with", values: ["SEC-"] }))).toBe(
      "^(?:SEC-).*$",
    );
  });
});

describe("toJsRegex (FE)", () => {
  it("strips inline (?i) into the JS i flag", () => {
    const re = toJsRegex("(?i)^foo$");
    expect(re.flags).toContain("i");
    expect(re.test("FOO")).toBe(true);
  });
});
