import { describe, expect, it } from "vitest";
import {
  classNames,
  orderSort,
  noMutateSort,
  humanizeSlug,
  slugify,
  fromDaysKey,
  fromStatus,
  stringifyOrder,
  parseOrder,
  pathJoin,
  camelToSnake,
  snakeToCamel,
  formatPhoneNumber,
  stripPhoneNumber,
  isUndefined,
  isNil,
  Path,
} from "./core";

describe("classNames", () => {
  it("joins class strings", () => {
    expect(classNames("a", "b", "c")).toBe("a b c");
  });

  it("filters out undefined values", () => {
    expect(classNames("a", undefined, "b")).toBe("a b");
  });

  it("filters out empty strings", () => {
    expect(classNames("a", "", "b")).toBe("a b");
  });
});

describe("orderSort", () => {
  it("sorts by order ascending", () => {
    const items = [{ order: 3 }, { order: 1 }, { order: 2 }];
    expect(items.sort(orderSort)).toEqual([
      { order: 1 },
      { order: 2 },
      { order: 3 },
    ]);
  });

  it("treats missing order as 0", () => {
    expect(orderSort({}, { order: 1 })).toBe(-1);
  });
});

describe("noMutateSort", () => {
  it("returns a sorted copy without mutating the original", () => {
    const original = [3, 1, 2];
    const sorted = noMutateSort(original, (a, b) => a - b);
    expect(sorted).toEqual([1, 2, 3]);
    expect(original).toEqual([3, 1, 2]);
  });

  it("returns undefined for undefined input", () => {
    expect(noMutateSort(undefined)).toBeUndefined();
  });
});

describe("humanizeSlug", () => {
  it("converts dashes to spaces and capitalizes", () => {
    expect(humanizeSlug("hello-world")).toBe("Hello World");
  });

  it("converts underscores to spaces and capitalizes", () => {
    expect(humanizeSlug("some_slug_value")).toBe("Some Slug Value");
  });
});

describe("slugify", () => {
  it("converts to lowercase slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips leading/trailing dashes in strict mode", () => {
    expect(slugify("-hello-")).toBe("hello");
  });

  it("keeps leading/trailing dashes in non-strict mode", () => {
    expect(slugify("-hello-", false)).toBe("-hello-");
  });

  it("removes apostrophes", () => {
    expect(slugify("it's a test")).toBe("its-a-test");
  });

  it("collapses multiple dashes", () => {
    expect(slugify("a   b")).toBe("a-b");
  });
});

describe("fromDaysKey", () => {
  it("parses a valid days key", () => {
    expect(fromDaysKey("days30")).toBe("Last 30 Days");
  });

  it("parses hours key", () => {
    expect(fromDaysKey("hours24")).toBe("Last 24 Hours");
  });

  it("returns empty string for invalid key", () => {
    expect(fromDaysKey("invalid")).toBe("");
  });
});

describe("fromStatus", () => {
  it("converts underscored status to title case", () => {
    expect(fromStatus("in_progress")).toBe("In Progress");
  });

  it("handles single word", () => {
    expect(fromStatus("active")).toBe("Active");
  });
});

describe("stringifyOrder / parseOrder", () => {
  it("stringifies ordering with DESC prefix", () => {
    expect(stringifyOrder({ name: "ASC", date: "DESC" })).toBe("name,-date");
  });

  it("parses order string back to object", () => {
    expect(parseOrder("name,-date")).toEqual({ name: "ASC", date: "DESC" });
  });

  it("roundtrips correctly", () => {
    const ordering = { name: "ASC" as const, date: "DESC" as const };
    expect(parseOrder(stringifyOrder(ordering))).toEqual(ordering);
  });
});

describe("pathJoin", () => {
  it("joins path segments", () => {
    expect(pathJoin("a", "b", "c")).toBe("a/b/c");
  });

  it("collapses duplicate slashes", () => {
    expect(pathJoin("/a/", "/b/", "/c")).toBe("/a/b/c");
  });
});

describe("camelToSnake / snakeToCamel", () => {
  it("converts camelCase to snake_case", () => {
    expect(camelToSnake("helloWorld")).toBe("hello_world");
  });

  it("converts snake_case to camelCase", () => {
    expect(snakeToCamel("hello_world")).toBe("helloWorld");
  });
});

describe("formatPhoneNumber", () => {
  it("formats a 10-digit number", () => {
    expect(formatPhoneNumber("3035551234")).toBe("(303) 555-1234");
  });

  it("formats with country code", () => {
    expect(formatPhoneNumber("+13035551234")).toBe("+1 (303) 555-1234");
  });

  it("handles already formatted input", () => {
    expect(formatPhoneNumber("(303) 555-1234")).toBe("(303) 555-1234");
  });
});

describe("stripPhoneNumber", () => {
  it("strips non-digit characters except +", () => {
    expect(stripPhoneNumber("+1 (303) 555-1234")).toBe("+13035551234");
  });
});

describe("isUndefined", () => {
  it("returns true for undefined", () => {
    expect(isUndefined(undefined)).toBe(true);
  });

  it("returns false for null", () => {
    expect(isUndefined(null)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isUndefined("")).toBe(false);
  });
});

describe("isNil", () => {
  it("returns true for null", () => {
    expect(isNil(null)).toBe(true);
  });

  it("returns true for undefined", () => {
    expect(isNil(undefined)).toBe(true);
  });

  it("returns false for 0", () => {
    expect(isNil(0)).toBe(false);
  });
});

describe("Path", () => {
  it("splits path into segments", () => {
    const p = new Path("/a/b/c");
    expect(p.segments).toEqual(["a", "b", "c"]);
  });

  it("detects absolute paths", () => {
    expect(new Path("/a/b").isAbsolute).toBe(true);
    expect(new Path("a/b").isAbsolute).toBe(false);
  });

  it("returns root segment", () => {
    expect(new Path("/api/v1/users").root).toBe("api");
  });

  it("includes checks for sub-path", () => {
    const p = new Path("/api/v1/users");
    expect(p.includes("v1/users")).toBe(true);
    expect(p.includes("v2/users")).toBe(false);
  });

  it("cleans duplicate slashes", () => {
    expect(Path.clean("//a///b//")).toBe("/a/b/");
  });

  it("slices segments", () => {
    const p = new Path("/a/b/c/d");
    expect(p.slice(1, 3).path).toBe("b/c");
  });

  it("beheads absolute paths", () => {
    const p = new Path("/api/v1");
    expect(p.behead().path).toBe("v1");
  });

  it("throws when beheading relative paths", () => {
    expect(() => new Path("api/v1").behead()).toThrow();
  });
});
