import { RequirePermissionsOptions } from "../guards/RequirePermissions";

export interface NavigationItem {
  name: string;
  href?: string;
  permissionOptions?: RequirePermissionsOptions;
  children?: NavigationItem[];
}

export type OrderOptions = "ASC" | "DESC" | undefined;

export interface Ordering {
  [key: string]: OrderOptions;
}

export interface SimpleChangeEvent<V> {
  type?: string;
  target?: {
    name: string;
    value: V;
  } | null;
}

export type DeepPartial<T> =
  | T
  | (T extends Array<infer U>
      ? DeepPartial<U>[]
      : T extends Map<infer K, infer V>
      ? Map<DeepPartial<K>, DeepPartial<V>>
      : T extends Set<infer M>
      ? Set<DeepPartial<M>>
      : T extends object
      ? {
          [K in keyof T]?: DeepPartial<T[K]>;
        }
      : T);
