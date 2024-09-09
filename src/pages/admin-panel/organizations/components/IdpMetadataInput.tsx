import { useState } from "react";
import { SimpleChangeEvent } from "../../../../types/core";
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import InputRadioOptions from "../../../training-library/components/edit-training-item/InputRadioOptions";
import Input from "../../../../components/forms/inputs/Input";
import { useMutation } from "@tanstack/react-query";
import {
  importOrganizationIdpMetadata,
  ImportOrganizationIdpMetadataPayload,
} from "../../../../queries/organizations";

interface IdpMetadataInputProps<K extends string | number | symbol> {
  name: K;
  value: Record<string, string>;
  protocol: string;
  organizationId: string;
  onChange?: (e: SimpleChangeEvent<Record<string, string>, K>) => void;
}

const IdpMetadataInput = <K extends string | number | symbol = string>({
  name,
  value,
  protocol,
  organizationId,
  onChange,
}: IdpMetadataInputProps<K>) => {
  // const [metadata, setMetadata] = useState<Record<string, string>>(idpMetadata);
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [uploadTypeId, setUploadTypeId] = useState<string>("file-upload");
  const [metadataFile, setMetadataFile] = useState<File | null>(null);
  const [metadataUrl, setMetadataUrl] = useState<string | null>(null);

  const isSet = Object.entries(value).length > 0;

  const importMetadataMutation = useMutation({
    mutationFn: (payload: ImportOrganizationIdpMetadataPayload) =>
      importOrganizationIdpMetadata(organizationId, protocol, payload),
  });

  const handleImport = () => {
    let payload: ImportOrganizationIdpMetadataPayload | null = null;
    if (uploadTypeId === "file-upload") {
      if (metadataFile) {
        payload = new FormData();
        payload.append("file", metadataFile);
      }
    } else if (uploadTypeId === "url") {
      if (metadataUrl) {
        payload = { url: metadataUrl };
      }
    }

    if (payload) {
      importMetadataMutation.mutate(payload, {
        onSuccess: (d) => {
          setShowLoader(false);
          onChange?.({ target: { name, value: d } });
        },
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {isSet && (
        <>
          <span className="inline-flex items-center gap-1 text-sm text-gray-600">
            <CheckCircleIcon className="h-5 w-5 text-green-500 inline" />
            <span>Metadata loaded</span>
          </span>
          <button
            type="button"
            onClick={() => setShowLoader((s) => !s)}
            className="self-start rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            {showLoader ? "Cancel" : "Change"}
          </button>
        </>
      )}

      {(!isSet || showLoader) && (
        <>
          <InputRadioOptions
            options={[
              {
                id: "file-upload",
                name: "File Upload",
                children: (
                  <input
                    type="file"
                    onChange={(e) =>
                      setMetadataFile(e.target.files?.[0] ?? null)
                    }
                  />
                ),
              },
              {
                id: "url",
                name: "URL",
                children: (
                  <Input onChange={(e) => setMetadataUrl(e.target.value)} />
                ),
              },
            ]}
            onSelect={setUploadTypeId}
          />
          <button
            type="button"
            onClick={() => handleImport()}
            className="self-start rounded-md px-2 py-1 text-xs font-semibold text-white bg-secondary-600 shadow-sm hover:bg-secondary-500 transition-colors disabled:opacity-60 disabled:pointer-events-none"
            disabled={
              (uploadTypeId === "file-upload" && !metadataFile) ||
              (uploadTypeId === "url" && !metadataUrl)
            }
          >
            Import
          </button>
        </>
      )}
    </div>
  );
};

export default IdpMetadataInput;
