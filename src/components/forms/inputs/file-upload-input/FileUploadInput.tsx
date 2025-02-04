import { PlusIcon } from "@heroicons/react/20/solid";
import { PhotoIcon } from "@heroicons/react/24/outline";
import {
  ChangeEvent,
  DetailedHTMLProps,
  InputHTMLAttributes,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useImmer } from "use-immer";
import { AlertContext } from "../../../../contexts/alert/alert-context";
import { filePreload } from "../../../../queries/media";
import { classNames } from "../../../../utils/core";
import UploadedFileTile, { UploadedFile } from "./UploadedFileTile";

interface FileUploadProps
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  params: {
    mediaUploadUrl: string;
  };
  loadedValue?: unknown;
}

const FileUploadInput: React.FC<FileUploadProps> = ({
  onChange,
  type,
  value,
  params,
  loadedValue,
  readOnly,
  ...attrs
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useImmer<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setError } = useContext(AlertContext);

  useEffect(() => {
    if (fileInputRef.current) {
      if (files.every((u) => u.uploadStatus === "uploaded")) {
        fileInputRef.current.setCustomValidity("");
      } else {
        fileInputRef.current.setCustomValidity(
          "File upload is still in progress."
        );
      }
    }
  }, [files]);

  useEffect(() => {
    if (!loadedValue || !Array.isArray(loadedValue)) {
      setFiles([]);
      return;
    }

    setFiles(
      loadedValue
        .filter(
          (keyTokenPair: unknown) =>
            keyTokenPair !== null &&
            typeof keyTokenPair === "object" &&
            Object.hasOwn(keyTokenPair, "key") &&
            Object.hasOwn(keyTokenPair, "url")
        )
        .map((keyTokenPair: { key: string; url: string }) => {
          return {
            key: keyTokenPair.key,
            uploadStatus: "uploaded",
            url: keyTokenPair.url,
          } as UploadedFile;
        })
    );
  }, [loadedValue, setFiles]);

  const uploadFile = (file: File) => {
    if (readOnly) {
      return;
    }

    const upload: UploadedFile & { local: File } = {
      local: file,
      uploadStatus: "uploading",
    };
    setFiles((f) => {
      f.push(upload);
    });
    filePreload(params.mediaUploadUrl, [upload.local])
      .then((res) => {
        const { key, url } = res[0];
        setFiles((uploads) => {
          const idx = uploads.findIndex((u) => u.local === upload.local);
          if (idx > -1) {
            uploads[idx] = {
              ...uploads[idx],
              key: key,
              uploadStatus: "uploaded",
              url,
            };
          }
        });

        if (fileInputRef.current) {
          const existingKeys = files
            .filter(
              (u) => u.uploadStatus === "uploaded" && u.key && u.key !== key
            )
            .map((u) => u.key);
          onChange?.({
            ...new Event("change"),
            target: {
              value: {
                dataType: "file-uploads",
                keys: [...existingKeys, key],
              },
              name: fileInputRef.current.name,
              getAttribute: (n: string) =>
                fileInputRef.current?.getAttribute(n),
            },
          } as any);
        }
      })
      .catch((e) => {
        console.error(e);
        setError("Oops, we couldn't upload that file.");
      });
  };

  const deleteFile = (upload: UploadedFile) => {
    if (readOnly) {
      return;
    }

    // TODO: Would be nice to delete file from server, but we need a way to
    // make sure this is a safe operation. For now, it's fine to just leave the files
    // and we can do cleanup later.
    setFiles((uploads) => uploads.filter((u) => u.local !== upload.local));
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (readOnly) {
      return;
    }

    setIsDragging(false);
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      const file = e.dataTransfer.files[i];
      uploadFile(file);
    }
    e.preventDefault();
  };

  const handleClickUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) {
      return;
    }

    for (let i = 0; i < files.length; i++) {
      uploadFile(files[i]);
    }
  };

  const fileInput = (
    <input
      {...attrs}
      ref={fileInputRef}
      type="file"
      onChange={handleClickUpload}
      multiple
      className="sr-only"
    />
  );

  return (
    <div
      className={classNames(
        "mt-2 rounded-lg border bg-white transition-all overflow-hidden",
        isDragging ? "border-secondary-600" : "border-gray-900/25",
        files.length || isDragging ? "border-solid" : "border-dashed"
      )}
      style={{
        transform: "translateZ(0)",
      }}
      onDragEnter={handleDragStart}
      onDragLeave={handleDragEnd}
      onDragEnd={handleDragEnd}
      onDragExit={handleDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div
        className={classNames(
          "fixed inset-0 bg-white grid grid-cols-1 place-items-center transition-opacity z-10",
          isDragging && !readOnly
            ? "opacity-90"
            : "pointer-events-none opacity-0"
        )}
      >
        Drop here
      </div>
      {!!files.length && (
        <label
          htmlFor={attrs.id}
          className="absolute bottom-4 right-4 z-10"
          title="Upload a file"
        >
          {!readOnly && (
            <div className="cursor-pointer rounded-full bg-secondary-600 p-1.5 text-white shadow-xs hover:bg-secondary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600">
              <PlusIcon className="h-5 w-5" aria-hidden="true" />
            </div>
          )}
          {fileInput}
        </label>
      )}
      <div className="relative flex justify-center h-48 w-full overflow-hidden overflow-y-auto">
        {files.length ? (
          <div className="px-4 py-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 w-full h-min grid-flow-dense">
            {files.map((file, idx) => (
              <UploadedFileTile
                key={file.key ?? file.local?.name ?? idx}
                file={file}
                deleteFile={deleteFile}
                readOnly={readOnly}
              />
            ))}
          </div>
        ) : (
          <div className="text-center transition-opacity self-center">
            {readOnly ? (
              <>
                <p>No uploads.</p>
              </>
            ) : (
              <>
                <PhotoIcon
                  className="mx-auto h-12 w-12 text-gray-300"
                  aria-hidden="true"
                />
                <div className="mt-4 flex text-sm leading-6 text-gray-600">
                  <label
                    htmlFor={attrs.id}
                    className="relative cursor-pointer rounded-md bg-white font-semibold text-secondary-600 focus-within:outline-hidden focus-within:ring-2 focus-within:ring-secondary-600 focus-within:ring-offset-2 hover:text-secondary-500"
                  >
                    <span>Upload a file</span>
                    {fileInput}
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-gray-600" />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadInput;
