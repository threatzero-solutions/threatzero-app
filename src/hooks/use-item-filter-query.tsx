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
  } = {}
) => {
  const DEFAULT_PREFIX = "tbl_";
  const DEFAULT_PAGE_SIZE = 10;
  const initialized = useRef(false);

  const prefix = options.prefix ?? DEFAULT_PREFIX;

  const parameterizeOptions = <T,>(
    options: ItemFilterQueryParams,
    valueMap: (v: string | undefined) => T
  ) => {
    // Extracting limit from options even though it's not used so only custom params are left.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { offset, order, search, limit, ...customParams } = options;
    const p: Record<string, T> = {
      offset: valueMap(offset ? `${offset}` : undefined),
      order: valueMap(order && stringifyOrder(order)),
      search: valueMap(search),
      ...Object.entries(customParams ?? {}).reduce((acc, [k, v]) => {
        const value = v !== undefined ? `${v}` : v;
        acc[k] = valueMap(value);
        return acc;
      }, {} as Record<string, T>),
    };
    return p;
  };

  const removeEmpties = (obj: object) => {
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => Number.isInteger(v) || !!v)
    );
  };

  const [searchParams, setSearchParams] = useSearchParams();

  const parsedSearchParams = useMemo<ItemFilterQueryParams>(() => {
    const customParams = Array.from(searchParams.entries()).reduce(
      (acc, [key, value]) => {
        if (key.startsWith(prefix) && value) {
          const k = key.slice(prefix.length);
          if (!["offset", "order", "search", "limit"].includes(k)) {
            acc[snakeToCamel(k)] = value;
          }
        }
        return acc;
      },
      {} as Record<string, string>
    );

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
    options.debounceTime ?? 300
  );

  useEffect(() => {
    if (!Object.keys(params).length) {
      return;
    }

    const prefix = options.prefix ?? DEFAULT_PREFIX;
    const p = parameterizeOptions(params, (v) => v);
    setSearchParams(
      (draft) => {
        Object.entries(p).forEach(([k, v]) => {
          const key = `${prefix}${camelToSnake(k)}`;
          const currentValue = draft.get(key);
          if (v && v !== currentValue) {
            draft.set(key, v);
          } else if (!v) {
            draft.delete(key);
          }
        });
        return draft;
      },
      { replace: true }
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
