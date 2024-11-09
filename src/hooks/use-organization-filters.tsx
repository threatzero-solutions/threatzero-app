import { useQuery } from "@tanstack/react-query";
import { ItemFilterQueryParams } from "../hooks/use-item-filter-query";
import { Updater, useImmer } from "use-immer";
import {
  getLocations,
  getOrganizations,
  getUnits,
} from "../queries/organizations";
import { FilterBarFilterOptions } from "../components/layouts/FilterBar";
import { useDebounceValue } from "usehooks-ts";
import { useMemo } from "react";

export const useOrganizationFilters = ({
  query,
  setQuery,
  organizationsEnabled = true,
  unitsEnabled = true,
  locationsEnabled = true,
  organizationKey,
  unitKey,
  locationKey,
  organizationKeyType = "slug",
  unitKeyType = "slug",
  locationKeyType = "id",
}: {
  query: ItemFilterQueryParams;
  setQuery?: Updater<ItemFilterQueryParams>;
  organizationsEnabled?: boolean;
  unitsEnabled?: boolean;
  locationsEnabled?: boolean;
  organizationKey?: string;
  unitKey?: string;
  locationKey?: string;
  organizationKeyType?: "slug" | "id";
  unitKeyType?: "slug" | "id";
  locationKeyType?: "id";
}): FilterBarFilterOptions => {
  const organizationSelected = useMemo(
    () =>
      !!organizationKey &&
      (Array.isArray(query[organizationKey])
        ? (query[organizationKey] as unknown[]).length > 0
        : !!query[organizationKey]),
    [query, organizationKey]
  );

  const [organizationsQuery, setOrganizationsQuery] =
    useImmer<ItemFilterQueryParams>({ limit: 5 });
  const [debouncedOrganizationsQuery] = useDebounceValue(
    organizationsQuery,
    300
  );

  const { data: organizations, isLoading: organizationsLoading } = useQuery({
    queryKey: ["organizations", debouncedOrganizationsQuery] as const,
    queryFn: ({ queryKey }) => getOrganizations(queryKey[1]),
    enabled: organizationsEnabled,
  });

  const unitSelected = useMemo(
    () =>
      !!unitKey &&
      (Array.isArray(query[unitKey])
        ? (query[unitKey] as unknown[]).length > 0
        : !!query[unitKey]),
    [query, unitKey]
  );

  const [unitsQuery, setUnitsQuery] = useImmer<ItemFilterQueryParams>({
    limit: 5,
  });
  const [debouncedUnitsQuery] = useDebounceValue(unitsQuery, 300);

  const { data: units, isLoading: unitsLoading } = useQuery({
    queryKey: [
      "units",
      {
        ...debouncedUnitsQuery,
        [`organization.${organizationKeyType}`]:
          organizationKey && query[organizationKey],
      },
    ] as const,
    queryFn: ({ queryKey }) => getUnits(queryKey[1]),
    enabled: unitsEnabled && (!organizationsEnabled || organizationSelected),
  });

  const [locationsQuery, setLocationsQuery] = useImmer<ItemFilterQueryParams>({
    limit: 5,
  });
  const [debouncedLocationsQuery] = useDebounceValue(locationsQuery, 300);

  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: [
      "locations",
      {
        ...debouncedLocationsQuery,
        [`unit.${unitKeyType}`]: unitKey && query[unitKey],
      },
    ] as const,
    queryFn: ({ queryKey }) => getLocations(queryKey[1]),
    enabled: locationsEnabled && (!unitsEnabled || unitSelected),
  });

  return {
    filters: [
      {
        key: organizationKey ?? "organization",
        label: "Organization",
        many: true,
        defaultValue: organizationKey && (query[organizationKey] as string[]),
        options: organizations?.results.map((org) => ({
          value: org[organizationKeyType],
          label: org.name,
        })) ?? [{ value: undefined, label: "All organizations" }],
        query: organizationsQuery.search,
        setQuery: (sq) =>
          setOrganizationsQuery((q) => {
            q.search = sq;
            q.limit = 5;
          }),
        queryPlaceholder: "Find organizations...",
        isLoading: organizationsLoading,
        hidden: !organizationKey || !organizationsEnabled,
        onSetFilter: (value, setFilter) => {
          if (unitKey && (Array.isArray(value) ? !value.length : !value)) {
            setFilter(unitKey, undefined);
          }
        },
        loadMore: () =>
          setOrganizationsQuery((q) => {
            q.limit = +(q.limit ?? 5) + 5;
          }),
        hasMore: organizations && organizations.count > organizations.limit,
      },
      {
        key: unitKey ?? "unit",
        label: "Unit",
        many: true,
        defaultValue: unitKey && (query[unitKey] as string[]),
        options: units?.results.map((unit) => ({
          value: unit[unitKeyType],
          label: unit.name,
        })) ?? [{ value: undefined, label: "All units" }],
        query: unitsQuery.search,
        setQuery: (sq) =>
          setUnitsQuery((q) => {
            q.search = sq;
            q.limit = 5;
          }),
        queryPlaceholder: "Find units...",
        isLoading: unitsLoading,
        hidden:
          !unitKey ||
          !unitsEnabled ||
          (organizationsEnabled && !organizationSelected),
        onSetFilter: (value, setFilter) => {
          if (locationKey && (Array.isArray(value) ? !value.length : !value)) {
            setFilter(locationKey, undefined);
          }
        },
        loadMore: () =>
          setUnitsQuery((q) => {
            q.limit = +(q.limit ?? 5) + 5;
          }),
        hasMore: units && units.count > units.limit,
      },
      {
        key: locationKey ?? "location",
        label: "Location",
        many: true,
        defaultValue: locationKey && (query[locationKey] as string[]),
        options: locations?.results.map((location) => ({
          value: location[locationKeyType],
          label: location.name,
        })) ?? [{ value: undefined, label: "All locations" }],
        query: locationsQuery.search,
        setQuery: (sq) =>
          setLocationsQuery((q) => {
            q.search = sq;
            q.limit = 5;
          }),
        queryPlaceholder: "Find locations...",
        isLoading: locationsLoading,
        hidden:
          !locationKey || !locationsEnabled || (unitsEnabled && !unitSelected),
        loadMore: () =>
          setLocationsQuery((q) => {
            q.limit = +(q.limit ?? 5) + 5;
          }),
        hasMore: locations && locations.count > locations.limit,
      },
    ],
    setQuery,
  };
};
