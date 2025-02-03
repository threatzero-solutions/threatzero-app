import {
  CheckCircleIcon,
  InformationCircleIcon,
  PauseCircleIcon,
} from "@heroicons/react/20/solid";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useDebounceCallback } from "usehooks-ts";
import { isURL } from "validator";
import Input from "../../../components/forms/inputs/Input";
import {
  importOrganizationIdpMetadata,
  ImportOrganizationIdpMetadataPayload,
} from "../../../queries/organizations";
import { SimpleChangeEvent } from "../../../types/core";
import { classNames } from "../../../utils/core";
import InputRadioOptions from "../../training-library/components/edit-training-item/InputRadioOptions";

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
  const [fileErrorMsg, setFileErrorMsg] = useState<string | null>();
  const [urlErrorMsg, setUrlErrorMsg] = useState<string | null>();
  const [loadedMsg, setLoadedMsg] = useState<string>("Using existing metadata");

  const [metadataFile, setMetadataFile] = useState<File | null>(null);
  const [metadataURL, setMetadataURL] = useState<string | null>(null);

  const isSet = Object.entries(value).length > 0;

  const { mutate: importMetadata, isPending } = useMutation({
    mutationFn: (payload: ImportOrganizationIdpMetadataPayload) =>
      importOrganizationIdpMetadata(organizationId, protocol, payload),
    onMutate: () => {
      return { skipOnError: true };
    },
    onSuccess: (d) => {
      onChange?.({ target: { name, value: d } });
    },
    onError: (e) => {
      console.warn("Unable to import metadata", e.message);
    },
  });

  const handleSetMetadataFile = (file: File | null) => {
    if (file) {
      setMetadataFile(file);
      setFileErrorMsg(null);
      const payload = new FormData();
      payload.append("file", file);
      importMetadata(payload, {
        onSuccess: () => {
          setLoadedMsg("Updated metadata from file");
        },
        onError: () => {
          setFileErrorMsg("Unable to import metadata from this file.");
        },
      });
    }
  };

  const handleSetMetadataURL = (url: string | null) => {
    if (url) {
      if (isURL(url)) {
        setMetadataURL(url);
        setUrlErrorMsg(null);
        const payload = { url };
        importMetadata(payload, {
          onSuccess: () => {
            setLoadedMsg("Updated metadata from URL");
          },
          onError: () => {
            setUrlErrorMsg("Unable to import metadata from this URL.");
          },
        });
      } else {
        setUrlErrorMsg("This is not a valid URL.");
      }
    } else {
      setUrlErrorMsg(null);
    }
  };
  const debouncedHandleSetMetadataURL = useDebounceCallback(
    handleSetMetadataURL,
    400
  );

  return (
    <div className="flex flex-col gap-2">
      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
        {isPending ? (
          <>
            <PauseCircleIcon className="size-5 text-gray-400 inline animate-pulse" />
            <span className="italic">Metadata loading...</span>
          </>
        ) : isSet ? (
          <>
            <CheckCircleIcon className="size-5 text-green-500 inline" />
            <span>{loadedMsg}</span>
          </>
        ) : (
          <>
            <InformationCircleIcon className="size-5 text-gray-400 inline" />
            <span>No metadata loaded</span>
          </>
        )}
      </span>

      <InputRadioOptions
        onSelect={(id) => {
          if (id === "file-upload") {
            handleSetMetadataFile(metadataFile);
          } else if (id === "url") {
            handleSetMetadataURL(metadataURL);
          }
        }}
        options={[
          {
            id: "file-upload",
            name: "File Upload",
            children: ({ selected }) => (
              <div>
                <input
                  type="file"
                  onChange={(e) =>
                    handleSetMetadataFile(e.target.files?.[0] ?? null)
                  }
                  accept={protocol === "saml" ? ".xml" : ".json"}
                />
                {selected && fileErrorMsg && (
                  <p className="mt-1 text-xs text-red-600">{fileErrorMsg}</p>
                )}
              </div>
            ),
          },
          {
            id: "url",
            name: "URL",
            children: ({ selected }) => (
              <div>
                <Input
                  onChange={(e) =>
                    debouncedHandleSetMetadataURL(e.target.value)
                  }
                  onKeyUp={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      debouncedHandleSetMetadataURL(e.currentTarget.value);
                    }
                  }}
                  name="url"
                  type="url"
                  className={classNames(
                    "w-full",
                    selected && urlErrorMsg
                      ? "ring-red-300 text-red-900 focus:!ring-red-500"
                      : ""
                  )}
                />
                {selected && urlErrorMsg && (
                  <p className="mt-1 text-xs text-red-600">{urlErrorMsg}</p>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default IdpMetadataInput;
