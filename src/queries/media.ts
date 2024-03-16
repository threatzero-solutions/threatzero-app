import axios from "axios";
import { API_BASE_URL } from "../contexts/core/constants";
import {
	Paginated,
	ResourceItem,
	ResourceItemCategory,
	ResourceType,
} from "../types/entities";

export interface GetResourceItemOptions {
	category?: ResourceItemCategory;
	type?: ResourceType;
}

export const getResourceItems = (options: GetResourceItemOptions) =>
	axios
		.get<Paginated<ResourceItem>>(`${API_BASE_URL}/api/resources/`, {
			params: {
				category: options.category,
				type: options.type,
			},
		})
		.then((res) => res.data);

export const getResourceItem = (id: string) =>
	axios
		.get<ResourceItem>(`${API_BASE_URL}/api/resources/${id}`)
		.then((res) => res.data);

// MUTATIONS

export const saveResourceItem = async (resource: Partial<ResourceItem>) => {
	const method = resource.id ? "patch" : "post";
	return axios[method](
		`${API_BASE_URL}/api/resources/` + (resource.id ?? ""),
		resource,
	).then((res) => res.data);
};

export const deleteResourceItem = (id: string | undefined) =>
	id
		? axios.delete(`${API_BASE_URL}/api/resources/${id}`)
		: Promise.reject(new Error("Resource Item ID must not be empty."));
