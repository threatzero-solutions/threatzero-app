import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, PropsWithChildren, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import {
  getOrganizationBySlug,
  getOrganizationIdpRoleGroups,
  getUnits,
} from "../../queries/organizations";
import { KeycloakGroupDto } from "../../types/api";
import { Organization, Unit } from "../../types/entities";
import { useAuth } from "../auth/useAuth";

export interface MyOrganizationContextType {
  myOrganizationSlug?: string | null;
  myOrganization?: Organization | null;
  myOrganizationLoading: boolean;
  invalidateOrganizationQuery: () => void;
  allUnits?: Unit[] | null;
  allUnitsLoading: boolean;
  currentUnitSlug?: string;
  currentUnit?: Unit | null;
  currentUnitLoading: boolean;
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
}

export const MyOrganizationContext = createContext<MyOrganizationContextType>({
  myOrganizationLoading: false,
  invalidateOrganizationQuery: () => {},
  allUnitsLoading: false,
  currentUnitLoading: false,
  invalidateCurrentUnitQuery: () => {},
  invalidateAllUnitsQuery: () => {},
  setUnitsPath: () => {},
  isUnitContext: false,
  roleGroupsLoading: false,
  invalidateOrganizationUsersQuery: () => {},
});

export interface MyOrganizationContextProviderProps extends PropsWithChildren {}

export const MyOrganizationContextProvider: React.FC<
  MyOrganizationContextProviderProps
> = ({ children }) => {
  const { accessTokenClaims } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const myOrganizationSlug = useMemo(
    () =>
      accessTokenClaims?.organization
        ? `${accessTokenClaims?.organization}`
        : null,
    [accessTokenClaims]
  );

  const { data: myOrganization, isLoading: myOrganizationLoading } = useQuery({
    queryKey: ["organization", "slug", myOrganizationSlug!] as const,
    queryFn: ({ queryKey }) => getOrganizationBySlug(queryKey[2]),
    enabled: !!myOrganizationSlug,
  });

  const queryClient = useQueryClient();

  const invalidateOrganizationQuery = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["organization", "slug", myOrganizationSlug],
    });
  }, [queryClient, myOrganizationSlug]);

  const { data: allUnits, isLoading: allUnitsLoading } = useQuery({
    queryKey: [
      "units",
      {
        [`organization.slug`]: myOrganizationSlug,
        order: { createdTimestamp: "DESC" },
        limit: 10000,
      },
    ] as const,
    queryFn: ({ queryKey }) =>
      getUnits(queryKey[1]).then((units) => units.results),
    enabled: !!myOrganizationSlug,
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
        ["organization.slug"]: myOrganizationSlug,
        slug: currentUnitSlug,
      },
    ] as const,
    queryFn: ({ queryKey }) =>
      getUnits(queryKey[2]).then((units) => units.results.find((u) => u)),
    enabled: !!myOrganizationSlug && !!currentUnitSlug,
  });

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
          ["organization.slug"]: myOrganizationSlug,
          slug: currentUnitSlug,
        },
      ],
    });
    invalidateAllUnitsQuery();
  }, [
    queryClient,
    myOrganizationSlug,
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
          if (qOrganizationId !== myOrganization?.id) return false;

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
    [queryClient, myOrganization?.id, currentUnitSlug]
  );

  const { data: roleGroups, isLoading: roleGroupsLoading } = useQuery({
    queryKey: ["roleGroups", myOrganization?.id] as const,
    queryFn: ({ queryKey }) =>
      queryKey[1] ? getOrganizationIdpRoleGroups(queryKey[1]) : null,
    enabled: !!myOrganization?.id,
  });

  return (
    <MyOrganizationContext.Provider
      value={{
        myOrganizationSlug,
        myOrganization,
        myOrganizationLoading,
        invalidateOrganizationQuery,
        allUnits,
        allUnitsLoading,
        currentUnitSlug,
        currentUnit,
        currentUnitLoading,
        invalidateCurrentUnitQuery,
        invalidateAllUnitsQuery,
        unitsPath,
        setUnitsPath,
        isUnitContext: !!currentUnitSlug,
        roleGroups,
        roleGroupsLoading,
        invalidateOrganizationUsersQuery,
      }}
    >
      {children}
    </MyOrganizationContext.Provider>
  );
};
