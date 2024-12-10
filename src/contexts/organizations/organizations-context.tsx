import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { createContext, PropsWithChildren, useCallback, useMemo } from "react";
import { To, useSearchParams } from "react-router";
import {
  getOrganization,
  getOrganizationBySlug,
  getOrganizationIdp,
  getOrganizationIdpRoleGroups,
  getUnits,
} from "../../queries/organizations";
import { KeycloakGroupDto, OrganizationIdpDto } from "../../types/api";
import { Organization, Unit } from "../../types/entities";
import { useAuth } from "../auth/useAuth";

export interface OrganizationsContextType {
  myOrganizationSlug?: string | null;
  currentOrganizationId?: Organization["id"] | null;
  currentOrganization?: Organization | null;
  currentOrganizationLoading: boolean;
  invalidateOrganizationQuery: () => void;
  allUnits?: Unit[] | null;
  allUnitsLoading: boolean;
  currentUnitSlug?: string;
  currentUnit?: Unit | null;
  currentUnitLoading: boolean;
  organizationIdps?: (OrganizationIdpDto | null)[];
  organizationIdpsLoading: boolean;
  invalidateCurrentUnitQuery: () => void;
  invalidateAllUnitsQuery: () => void;
  unitsPath?: string | null;
  setUnitsPath: (
    unitsPath: string | null | ((prevUnitsPath: string | null) => string | null)
  ) => void;
  isUnitContext: boolean;
  roleGroups?: KeycloakGroupDto[] | null;
  roleGroupsLoading: boolean;
  invalidateOrganizationUsersQuery: (
    unitsSlugs?: (string | undefined)[]
  ) => void;
  organizationDeleteRedirect: To;
}

export const OrganizationsContext = createContext<OrganizationsContextType>({
  currentOrganizationLoading: false,
  invalidateOrganizationQuery: () => {},
  allUnitsLoading: false,
  currentUnitLoading: false,
  organizationIdpsLoading: false,
  invalidateCurrentUnitQuery: () => {},
  invalidateAllUnitsQuery: () => {},
  setUnitsPath: () => {},
  isUnitContext: false,
  roleGroupsLoading: false,
  invalidateOrganizationUsersQuery: () => {},
  organizationDeleteRedirect: "/",
});

export interface OrganizationsContextProviderProps extends PropsWithChildren {
  currentOrganizationId?: Organization["id"];
  organizationDeleteRedirect?: To;
}

export const OrganizationsContextProvider: React.FC<
  OrganizationsContextProviderProps
> = ({
  currentOrganizationId: currentOrganizationIdProp,
  organizationDeleteRedirect,
  children,
}) => {
  const { myOrganizationSlug } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const organizationId = useMemo(
    () => currentOrganizationIdProp ?? myOrganizationSlug,
    [currentOrganizationIdProp, myOrganizationSlug]
  );
  const organizationIdType = useMemo(
    () => (currentOrganizationIdProp ? "id" : "slug"),
    [currentOrganizationIdProp]
  );

  const { data: currentOrganization, isLoading: currentOrganizationLoading } =
    useQuery({
      queryKey: ["organization", organizationIdType, organizationId] as const,
      queryFn: ({ queryKey }) =>
        queryKey[1] === "slug"
          ? getOrganizationBySlug(queryKey[2]!)
          : getOrganization(queryKey[2]!),
      enabled: !!organizationId,
    });

  const currentOrganizationId = useMemo(
    () => currentOrganizationIdProp ?? currentOrganization?.id,
    [currentOrganizationIdProp, currentOrganization]
  );

  const queryClient = useQueryClient();

  const invalidateOrganizationQuery = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["organization", organizationIdType, organizationId],
    });
  }, [queryClient, organizationId, organizationIdType]);

  const { data: allUnits, isLoading: allUnitsLoading } = useQuery({
    queryKey: [
      "units",
      {
        [`organization.${organizationIdType}`]: organizationId,
        order: { createdTimestamp: "DESC" },
        limit: 10000,
      },
    ] as const,
    queryFn: ({ queryKey }) =>
      getUnits(queryKey[1]).then((units) => units.results),
    enabled: !!organizationId,
  });

  const unitsPath = useMemo(
    () => searchParams.get("unitsPath"),
    [searchParams]
  );

  const setUnitsPath = useCallback(
    (
      unitsPath:
        | string
        | null
        | ((prevUnitsPath: string | null) => string | null)
    ) => {
      setSearchParams((prevSearchParams) => {
        const newUnitsPath =
          typeof unitsPath === "function"
            ? unitsPath(prevSearchParams.get("unitsPath"))
            : unitsPath;
        if (newUnitsPath === null) {
          prevSearchParams.delete("unitsPath");
        } else {
          prevSearchParams.set("unitsPath", newUnitsPath);
        }
        return prevSearchParams;
      });
    },
    [setSearchParams]
  );

  const currentUnitSlug = useMemo(
    () => unitsPath?.split("/").pop(),
    [unitsPath]
  );

  const { data: currentUnit, isLoading: currentUnitLoading } = useQuery({
    queryKey: [
      "unit",
      "slug",
      {
        [`organization.${organizationIdType}`]: organizationId,
        slug: currentUnitSlug,
      },
    ] as const,
    queryFn: ({ queryKey }) =>
      getUnits(queryKey[2]).then((units) => units.results.find((u) => u)),
    enabled: !!organizationId && !!currentUnitSlug,
  });

  const organizationIdpQueryResults = useQueries({
    queries: (currentOrganization?.idpSlugs ?? []).map((slug) => {
      return {
        queryKey: ["organization-idps", currentOrganization?.id, slug],
        queryFn: () =>
          currentOrganization?.id
            ? getOrganizationIdp(currentOrganization.id, slug).catch((e) => {
                if (e instanceof AxiosError && e.response?.status === 404) {
                  return null;
                }
                throw e;
              })
            : Promise.reject("No organization id"),
        enabled: !!currentOrganization,
      };
    }),
  });

  const { organizationIdps, organizationIdpsLoading } = useMemo(
    () =>
      organizationIdpQueryResults.reduce(
        (acc, result) => {
          acc.organizationIdpsLoading =
            acc.organizationIdpsLoading || result.isLoading;
          if (result.isLoading || result.data === undefined) {
            return acc;
          }
          acc.organizationIdps.push(result.data);
          return acc;
        },
        {
          organizationIdps: [] as (OrganizationIdpDto | null)[],
          organizationIdpsLoading: false,
        }
      ),
    [organizationIdpQueryResults]
  );

  const invalidateAllUnitsQuery = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["units"],
    });
  }, [queryClient]);

  const invalidateCurrentUnitQuery = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: [
        "unit",
        "slug",
        {
          [`organization.${organizationIdType}`]: organizationId,
          slug: currentUnitSlug,
        },
      ],
    });
    invalidateAllUnitsQuery();
  }, [
    queryClient,
    organizationId,
    organizationIdType,
    currentUnitSlug,
    invalidateAllUnitsQuery,
  ]);

  const invalidateOrganizationUsersQuery = useCallback(
    (unitsSlugs?: (string | undefined)[]) => {
      queryClient.invalidateQueries({
        predicate: ({ queryKey }) => {
          if (queryKey.length < 3) {
            return false;
          }
          const [type, qOrganizationId, userIdOrQuery, query] = queryKey;

          // Is this an organizations user query?
          if (
            !["organizations-users", "organizations-user"].includes(`${type}`)
          )
            return false;

          // Does the query match this current organization?
          if (qOrganizationId !== currentOrganization?.id) return false;

          // Does the query match this current unit?
          const q = typeof userIdOrQuery === "string" ? query : userIdOrQuery;
          if (
            !q ||
            typeof q !== "object" ||
            !("unit" in q) ||
            !(unitsSlugs ?? [currentUnitSlug]).includes(
              q.unit as string | undefined
            )
          )
            return false;

          return true;
        },
      });
    },
    [queryClient, currentOrganization?.id, currentUnitSlug]
  );

  const { data: roleGroups, isLoading: roleGroupsLoading } = useQuery({
    queryKey: ["roleGroups", currentOrganization?.id] as const,
    queryFn: ({ queryKey }) =>
      queryKey[1] ? getOrganizationIdpRoleGroups(queryKey[1]) : null,
    enabled: !!currentOrganization?.id,
  });

  return (
    <OrganizationsContext.Provider
      value={{
        myOrganizationSlug,
        currentOrganizationId,
        currentOrganization,
        currentOrganizationLoading,
        invalidateOrganizationQuery,
        allUnits,
        allUnitsLoading,
        currentUnitSlug,
        currentUnit,
        currentUnitLoading,
        organizationIdps,
        organizationIdpsLoading,
        invalidateCurrentUnitQuery,
        invalidateAllUnitsQuery,
        unitsPath,
        setUnitsPath,
        isUnitContext: !!currentUnitSlug,
        roleGroups,
        roleGroupsLoading,
        invalidateOrganizationUsersQuery,
        organizationDeleteRedirect: organizationDeleteRedirect ?? "/",
      }}
    >
      {children}
    </OrganizationsContext.Provider>
  );
};
