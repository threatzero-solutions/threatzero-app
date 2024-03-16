import { API_BASE_URL } from "../contexts/core/constants";
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

export const getThumbnailForEmbed = (
  embed: string,
  height?: number,
  width?: number
) => {
  const src = getIframeSrcFromEmbed(embed);
  if (!src) {
    return null;
  }
  let url = `${API_BASE_URL}/api/media/thumbnail-for-video-url?videoUrl=${encodeURIComponent(
    src
  )}`;
  if (height) {
    url = `${url}&height=${height}`;
  }
  if (width) {
    url = `${url}&width=${width}`;
  }
  return url;
};

export const pathJoin = (...args: string[]) => {
  return args.join("/").replace(/\/+/g, "/");
};

export const stripHtml = (html: string | undefined | null) => {
  if (!html) {
    return html;
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

export const camelToSnake = (str: string) =>
  str.replace(/[A-Z][a-z0-9]+/g, (match) => `_${match.toLowerCase()}`);

export const snakeToCamel = (str: string) =>
  str.replace(/(_\w)/g, (match) => match[1].toUpperCase());
