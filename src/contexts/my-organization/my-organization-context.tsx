import { createContext, PropsWithChildren, useCallback, useMemo } from "react";
import { Organization, Unit } from "../../types/entities";
import { useAuth } from "../auth/useAuth";
import {
  getOrganizationBySlug,
  getUnits,
  saveOrganization,
  saveUnit,
} from "../../queries/organizations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { DeepPartial } from "react-hook-form";

export interface MyOrganizationContextType {
  myOrganizationSlug?: string | null;
  myOrganization?: Organization | null;
  myOrganizationLoading: boolean;
  saveOrganization: (data: DeepPartial<Organization>) => void;
  saveOrganizationPending: boolean;
  saveOrganizationSuccess: boolean;
  saveOrganizationError: boolean;
  allUnits?: Unit[] | null;
  allUnitsLoading: boolean;
  currentUnitSlug?: string;
  currentUnit?: Unit | null;
  currentUnitLoading: boolean;
  saveCurrentUnit: (data: DeepPartial<Unit>) => void;
  saveCurrentUnitPending: boolean;
  saveCurrentUnitSuccess: boolean;
  saveCurrentUnitError: boolean;
  unitsPath?: string | null;
  setUnitsPath: (
    unitsPath: string | null | ((prevUnitsPath: string | null) => string | null)
  ) => void;
  isUnitContext: boolean;
}

export const MyOrganizationContext = createContext<MyOrganizationContextType>({
  myOrganizationLoading: false,
  saveOrganization: () => {},
  saveOrganizationPending: false,
  saveOrganizationSuccess: false,
  saveOrganizationError: false,
  allUnitsLoading: false,
  currentUnitLoading: false,
  saveCurrentUnit: () => {},
  saveCurrentUnitPending: false,
  saveCurrentUnitSuccess: false,
  saveCurrentUnitError: false,
  setUnitsPath: () => {},
  isUnitContext: false,
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

  const {
    mutate: saveOrganizationMutate,
    isPending: saveOrganizationPending,
    isSuccess: saveOrganizationSuccess,
    isError: saveOrganizationError,
  } = useMutation({
    mutationFn: (data: DeepPartial<Organization>) =>
      saveOrganization(data as Partial<Organization>),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["organization", "slug", data.slug],
      });
    },
  });

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

  const {
    mutate: saveCurrentUnitMutate,
    isPending: saveCurrentUnitPending,
    isSuccess: saveCurrentUnitSuccess,
    isError: saveCurrentUnitError,
  } = useMutation({
    mutationFn: (data: DeepPartial<Unit>) => saveUnit(data as Partial<Unit>),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [
          "unit",
          "slug",
          {
            ["organization.slug"]: myOrganizationSlug,
            slug: data.slug,
          },
        ],
      });
    },
  });

  return (
    <MyOrganizationContext.Provider
      value={{
        myOrganizationSlug,
        myOrganization,
        myOrganizationLoading,
        saveOrganization: saveOrganizationMutate,
        saveOrganizationPending,
        saveOrganizationSuccess,
        saveOrganizationError,
        allUnits,
        allUnitsLoading,
        currentUnitSlug,
        currentUnit,
        currentUnitLoading,
        saveCurrentUnit: saveCurrentUnitMutate,
        saveCurrentUnitPending,
        saveCurrentUnitSuccess,
        saveCurrentUnitError,
        unitsPath,
        setUnitsPath,
        isUnitContext: !!currentUnitSlug,
      }}
    >
      {children}
    </MyOrganizationContext.Provider>
  );
};
