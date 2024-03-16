import { RequirePermissionsOptions } from "../guards/RequirePermissions";

export interface NavigationItem {
	name: string;
	href: string;
	permissionOptions?: RequirePermissionsOptions;
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
