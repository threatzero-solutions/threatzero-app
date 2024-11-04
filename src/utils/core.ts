import { OrderOptions, Ordering } from "../types/core";

export const classNames = (...classes: (string | undefined)[]) =>
  classes.filter(Boolean).join(" ");

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
