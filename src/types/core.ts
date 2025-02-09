import { RequirePermissionsOptions } from "../guards/RequirePermissions";

export interface NavigationItem {
  name: string;
  to?: string;
  permissionOptions?: RequirePermissionsOptions;
  children?: NavigationItem[];
}

export type OrderOptions = "ASC" | "DESC" | undefined;

export interface Ordering {
  [key: string]: OrderOptions;
}

export interface SimpleChangeEvent<V, K = string> {
  type?: string;
  target?: {
    name: K;
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

export type FieldPath<T, Prefix extends string = ""> = {
  [K in keyof T]: T[K] extends object
    ? // If the property is an object, recursively call FieldPath with dot notation
      | `${Prefix extends "" ? "" : `${Prefix}.`}${K & string}`
        | FieldPath<
            T[K],
            `${Prefix extends "" ? "" : `${Prefix}.`}${K & string}`
          >
    : `${Prefix extends "" ? "" : `${Prefix}.`}${K & string}`;
}[keyof T];

export type KeysOfType<T, U> = Exclude<
  {
    [K in keyof T]: T[K] extends U | undefined ? K : never;
  }[keyof T],
  undefined
>;
