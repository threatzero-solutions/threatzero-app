import { PaginationState, SortingState } from "@tanstack/react-table";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { OrderOptions, Ordering } from "../types/core";
import { Paginated } from "../types/entities";

export const classNames = (...classes: (string | undefined)[]) =>
  classes.filter(Boolean).join(" ");

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const orderSort = (a: { order?: number }, b: { order?: number }) => {
  return (a.order ?? 0) - (b.order ?? 0);
};

export const noMutateSort = <T>(
  a?: T[],
  sortFn?: (a: T, b: T) => number
): T[] | undefined => (a ? [...a].sort(sortFn) : undefined);

export const humanizeSlug = (slug: string) =>
  slug
    .split(/[-_]/g)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const slugify = (str: string, strict = true) => {
  const slug = str
    .toLowerCase()
    .replace(/[']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/--+/g, "-");

  if (!strict) {
    return slug;
  }

  return slug.replace(/^-+/, "").replace(/-+$/, "");
};

export const fromDaysKey = (key: string) => {
  const matches = /^(minutes|hours|days|months|weeks)(\d+)$/i.exec(key);
  if (matches?.length === 3) {
    const [unit, value] = matches.slice(1);
    return `Last ${value} ${unit.replace(/(^.)/, (u) => u.toUpperCase())}`;
  }
  return "";
};

export const fromStatus = (status: string) =>
  status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const stringifyOrder = (order: Ordering) =>
  Object.entries(order)
    .filter(([field]) => !!field)
    .reduce(
      (acc, [field, order]) => [...acc, order === "DESC" ? `-${field}` : field],
      [] as string[]
    )
    .join(",");

export const parseOrder = (order: string) =>
  order
    .split(",")
    .filter((field) => !!field)
    .map((field) =>
      field.startsWith("-") ? [field.slice(1), "DESC"] : [field, "ASC"]
    )
    .reduce((acc, [field, order]) => {
      acc[field] = order as OrderOptions;
      return acc;
    }, {} as Ordering);

export const asOrdering = (sorting: SortingState) =>
  sorting.reduce((acc, { id, desc }) => {
    acc[id] = desc ? "DESC" : "ASC";
    return acc;
  }, {} as Ordering);

export const asSortingState = (ordering: Ordering): SortingState =>
  Object.entries(ordering).map(([key, value]) => ({
    id: key,
    desc: value === "DESC",
  }));

export const asPageInfo = (
  pagination: PaginationState
): Omit<Paginated<unknown>, "results" | "count"> => ({
  offset: pagination.pageIndex * pagination.pageSize,
  limit: pagination.pageSize,
});

export const asPaginationState = (
  pageInfo: {
    offset?: number | string;
    limit?: number | string;
  },
  pageSize = 10
) => {
  return {
    pageSize,
    pageIndex: Math.floor(+(pageInfo.offset || 0) / pageSize),
  } as PaginationState;
};

export const getIframeSrcFromEmbed = (embed: string) => {
  const node = document.createElement("html");
  node.innerHTML = embed;
  const src = node.querySelector("iframe")?.getAttribute("src");
  return src;
};

export const pathJoin = (...args: string[]) => {
  return args.join("/").replace(/\/+/g, "/");
};

export function stripHtml(html: string): string;
export function stripHtml(html: undefined | null): undefined | null;
export function stripHtml(
  html: string | undefined | null
): string | undefined | null;
export function stripHtml(html: string | undefined | null) {
  if (!html) {
    return html;
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

export const camelToSnake = (str: string) =>
  str.replace(/[A-Z][a-z0-9]+/g, (match) => `_${match.toLowerCase()}`);

export const snakeToCamel = (str: string) =>
  str.replace(/(_\w)/g, (match) => match[1].toUpperCase());

const PHONE_NUMBER_FORMATTING_REGEX =
  /^(?<ccp>\+?)(?<cc>(?<=\+)1)?\s*\(?(?<ac>\d{1,3})?\)?\s*(?<p1>\d{1,3})?\s*-?\s*(?<p2>\d{1,4})?.*$/;
export const formatPhoneNumber = (phoneNumber: string) => {
  phoneNumber = phoneNumber
    .trim()
    .replace(/[^+\d\s]/g, "")
    .replace(/\s\s/g, " ");

  const match = phoneNumber.match(PHONE_NUMBER_FORMATTING_REGEX);

  if (!match || !match.groups) {
    return phoneNumber;
  }

  const { ccp, cc, ac, p1, p2 } = match.groups;

  let formattedPhoneNumber = "";

  if (ccp && !cc) {
    formattedPhoneNumber += "+";
  }

  if (cc) {
    formattedPhoneNumber += `+${cc}`;
  }

  if (ac) {
    if (cc) {
      formattedPhoneNumber += " ";
    } else {
      formattedPhoneNumber = "";
    }

    formattedPhoneNumber += `(${ac}`;
  }

  if (p1) {
    formattedPhoneNumber += `) ${p1}`;
  }

  if (p2) {
    formattedPhoneNumber += `-${p2}`;
  }

  return formattedPhoneNumber;
};

export const stripPhoneNumber = (phoneNumber: string) => {
  return phoneNumber.replace(/[^+\d]/g, "");
};

export const simulateDownload = (
  data: Blob | MediaSource,
  filename: string
) => {
  const a = document.createElement("a");
  a.setAttribute("href", window.URL.createObjectURL(data));
  a.setAttribute("download", filename);
  document.body.append(a);
  a.click();
  a.remove();
};

export const isUndefined = (obj: unknown): obj is undefined =>
  typeof obj === "undefined";

export const isNil = <T>(
  value: T | null | undefined
): value is null | undefined => value === null || isUndefined(value);

const defaultFallback: Record<string, unknown> = {};
export const as = <T extends typeof defaultFallback = typeof defaultFallback>(
  context: unknown,
  fallback: T = defaultFallback as T
) => {
  if (context !== null && typeof context === "object") {
    return context as Record<string, unknown>;
  }
  return fallback;
};

export class Path {
  raw_path: string;
  segments: string[];

  constructor(path: string | null | undefined | Path) {
    this.raw_path = Path.isPath(path) ? path.path : Path.clean(path ?? "");
    this.segments = Path.splitPath(this.raw_path || "");
  }

  public get path() {
    return this.raw_path;
  }

  public get isAbsolute() {
    return !!this.raw_path.startsWith("/");
  }

  public get root() {
    return this.segments.find((s) => s);
  }

  public get node() {
    return this.segments.reverse().find((s) => s);
  }

  public includes(pathB: string | null | undefined | Path) {
    const segmentsB = Path.splitPath(pathB);

    if (segmentsB.length === 0 || this.segments.length < segmentsB.length) {
      return false;
    }

    const startIdx = this.segments.findIndex(
      (segment) => segment === segmentsB[0]
    );
    if (startIdx === -1) {
      return false;
    }
    return segmentsB.every(
      (segment, idx) => this.segments[startIdx + idx] === segment
    );
  }

  public slice(start: number, end?: number) {
    return new Path(this.segments.slice(start, end).join("/"));
  }

  public behead() {
    if (!this.isAbsolute) {
      throw new Error("Cannot behead a relative path");
    }
    return this.slice(1);
  }

  public static isPath(path: unknown): path is Path {
    if (path !== null && typeof path === "object" && path instanceof Path) {
      return true;
    }

    return false;
  }

  public static clean(path: string) {
    return path.replace(/\/+/g, "/");
  }

  public static splitPath(path: string | null | undefined | Path) {
    if (Path.isPath(path)) {
      return path.segments;
    }
    if (typeof path === "string") {
      return Path.clean(path).split("/").filter(Boolean);
    }

    return [];
  }
}
