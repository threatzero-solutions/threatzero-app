import { useState } from "react";
import SlideOver from "../../../../components/layouts/slide-over/SlideOver";
import EditOrganizationIdp from "./EditOrganizationIdp";
import { OrganizationIdpDto } from "../../../../types/api";
import { Organization } from "../../../../types/entities";
import { PencilIcon } from "@heroicons/react/20/solid";
import { useQuery } from "@tanstack/react-query";
import { getOrganizationIdp } from "../../../../queries/organizations";

interface OrganizationIdpsInputProps {
  organizationId: Organization["id"];
  idpSlugs: string[];
}

const IdpRow: React.FC<{
  organizationId: Organization["id"];
  idpSlug: string;
  onSelect?: (idp: OrganizationIdpDto) => void;
}> = ({ organizationId, idpSlug, onSelect }) => {
  const { data: idp } = useQuery({
    queryKey: ["organization-idps", organizationId, idpSlug] as const,
    queryFn: ({ queryKey }) => getOrganizationIdp(queryKey[1], queryKey[2]),
  });

  return (
    <div className="flex items-center gap-2">
      {idp ? (
        <>
          <span className="ml-3 block text-sm font-medium leading-6 text-gray-900">
            {idp.name}
          </span>
          <button type="button" onClick={() => onSelect?.(idp)}>
            <PencilIcon className="h-4 w-4 text-gray-400" />
          </button>
        </>
      ) : (
        <div className="animate-pulse bg-slate-200 h-4 w-24 rounded-full"></div>
      )}
    </div>
  );
};

const OrganizationIdpsInput: React.FC<OrganizationIdpsInputProps> = ({
  organizationId,
  idpSlugs,
}) => {
  const [editIdpSliderOpen, setEditIdpSliderOpen] = useState(false);
  const [activeIdp, setActiveIdp] = useState<OrganizationIdpDto | undefined>();

  const handleCreateIdp = () => {
    setActiveIdp(undefined);
    setEditIdpSliderOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        {idpSlugs.map((idpSlug) => (
          <IdpRow
            key={idpSlug}
            idpSlug={idpSlug}
            organizationId={organizationId}
            onSelect={(idp) => {
              setActiveIdp(idp);
              setEditIdpSliderOpen(true);
            }}
          />
        ))}
        <button
          type="button"
          onClick={() => handleCreateIdp()}
          className="self-end rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Add Identity Provider
        </button>
      </div>
      <SlideOver open={editIdpSliderOpen} setOpen={setEditIdpSliderOpen}>
        <EditOrganizationIdp
          organizationId={organizationId}
          idp={activeIdp}
          setOpen={setEditIdpSliderOpen}
        />
      </SlideOver>
    </>
  );
};

export default OrganizationIdpsInput;
