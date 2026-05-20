import { useEffect, useMemo, useRef } from "react";
import { Ordering } from "../types/core";
import {
  camelToSnake,
  parseOrder,
  snakeToCamel,
  stringifyOrder,
} from "../utils/core";
import { useSearchParams } from "react-router";
import { useImmer } from "use-immer";
import { useDebounceValue } from "usehooks-ts";

type CustomParamValue = string | string[] | undefined;

const normalizeCustom = (v: unknown): CustomParamValue => {
  if (Array.isArray(v)) {
    const cleaned = v
      .filter((x) => x !== undefined && x !== null && x !== "")
      .map(String);
    return cleaned.length ? cleaned : undefined;
  }
  if (v === undefined || v === null || v === "") return undefined;
  return `${v}`;
};

export interface ItemFilterQueryParams {
  offset?: string | number;
  order?: Ordering;
  limit?: string | number;
  search?: string;
  [key: string]: unknown;
}

export const useItemFilterQuery = (
  initialValue: ItemFilterQueryParams = {},
  options: {
    prefix?: string;
    pageSize?: number;
    debounceTime?: number;
  } = {},
) => {
  const DEFAULT_PREFIX = "tbl_";
  const DEFAULT_PAGE_SIZE = 10;
  const initialized = useRef(false);

  const prefix = options.prefix ?? DEFAULT_PREFIX;

  const removeEmpties = (obj: object) => {
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => {
        if (Array.isArray(v)) return v.length > 0;
        return Number.isInteger(v) || !!v;
      }),
    );
  };

  const [searchParams, setSearchParams] = useSearchParams();

  const parsedSearchParams = useMemo<ItemFilterQueryParams>(() => {
    const seen = new Set<string>();
    const customParams: Record<string, string | string[]> = {};
    for (const key of searchParams.keys()) {
      if (seen.has(key)) continue;
      seen.add(key);
      if (!key.startsWith(prefix)) continue;
      const k = key.slice(prefix.length);
      if (["offset", "order", "search", "limit"].includes(k)) continue;
      const values = searchParams.getAll(key).filter(Boolean);
      if (values.length === 0) continue;
      customParams[snakeToCamel(k)] = values.length === 1 ? values[0] : values;
    }

    const orderParam = searchParams.get(`${prefix}order`);

    return removeEmpties({
      limit: options.pageSize ?? DEFAULT_PAGE_SIZE,
      offset: searchParams.get(`${prefix}offset`) ?? 0,
      order: orderParam ? parseOrder(orderParam) : undefined,
      search: searchParams.get(`${prefix}search`) ?? "",
      ...customParams,
    });
  }, [searchParams, options.pageSize, prefix]);

  const [params, setParams] = useImmer<ItemFilterQueryParams>({});

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setParams({
        ...initialValue,
        ...parsedSearchParams,
      });
      return;
    }
  }, [initialValue, parsedSearchParams, setParams]);

  const [debouncedItemFilterOptions] = useDebounceValue(
    params,
    options.debounceTime ?? 300,
  );

  useEffect(() => {
    if (!Object.keys(params).length) {
      return;
    }

    const prefix = options.prefix ?? DEFAULT_PREFIX;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { offset, order, search, limit, ...customParams } = params;
    const p: Record<string, CustomParamValue> = {
      offset: normalizeCustom(offset),
      order: normalizeCustom(order && stringifyOrder(order)),
      search: normalizeCustom(search),
    };
    for (const [k, v] of Object.entries(customParams ?? {})) {
      p[k] = normalizeCustom(v);
    }

    setSearchParams(
      (draft) => {
        for (const [k, v] of Object.entries(p)) {
          const key = `${prefix}${camelToSnake(k)}`;
          if (v === undefined) {
            draft.delete(key);
            continue;
          }
          // Re-emit the key from scratch so single→array and
          // array→single transitions don't leave stale entries behind.
          draft.delete(key);
          if (Array.isArray(v)) {
            for (const vv of v) draft.append(key, vv);
          } else {
            draft.set(key, v);
          }
        }
        return draft;
      },
      { replace: true },
    );
  }, [debouncedItemFilterOptions, options.prefix, setSearchParams, params]);

  const clearParams = () => {
    setParams({});
  };

  return {
    itemFilterOptions: params,
    setItemFilterOptions: setParams,
    debouncedItemFilterOptions,
    clearFilterOptions: clearParams,
    searchParams,
    setSearchParams,
  };
};
