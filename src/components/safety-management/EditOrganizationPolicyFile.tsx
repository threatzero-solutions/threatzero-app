import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";
import { useMutation } from "@tanstack/react-query";
import { ChangeEvent, useState } from "react";
import { useForm } from "react-hook-form";
import {
  GetPresignedUploadUrlsResult,
  prepareFileUploads,
  uploadFile,
} from "../../queries/media";
import { OrganizationPolicyFile } from "../../types/entities";
import FormInput from "../forms/inputs/FormInput";
import Input from "../forms/inputs/Input";
import SlideOverField from "../layouts/slide-over/SlideOverField";
import SlideOverForm from "../layouts/slide-over/SlideOverForm";
import SlideOverFormBody from "../layouts/slide-over/SlideOverFormBody";
import SlideOverHeading from "../layouts/slide-over/SlideOverHeading";

type TForm = Omit<
  OrganizationPolicyFile,
  "pdfUrl" | "id" | "createdOn" | "updatedOn"
> &
  Partial<
    Pick<OrganizationPolicyFile, "pdfUrl" | "id" | "createdOn" | "updatedOn">
  >;

interface EditOrganizationPolicyFileProps {
  generatePolicyUploadsUrlsUrl: string;
  organizationPolicyFile?: Partial<OrganizationPolicyFile>;
  setOpen: (open: boolean) => void;
  onSave: (data: TForm) => void;
  saving?: boolean;
}

const EditOrganizationPolicyFile: React.FC<EditOrganizationPolicyFileProps> = ({
  generatePolicyUploadsUrlsUrl,
  organizationPolicyFile,
  setOpen,
  onSave,
  saving = false,
}) => {
  const formMethods = useForm<TForm>({
    values: {
      name: "",
      pdfS3Key: "",
      ...organizationPolicyFile,
    },
  });

  const { watch } = formMethods;
  const pdfS3Key = watch("pdfS3Key");

  const [presignedUrlResult, setPresignedUrlResult] = useState<
    [GetPresignedUploadUrlsResult, File] | undefined
  >();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    const file = e.target.files[0];
    const results = await prepareFileUploads(generatePolicyUploadsUrlsUrl, [
      file,
    ]);

    if (!results.length) return;

    setPresignedUrlResult(results[0]);
    formMethods.setValue("pdfS3Key", results[0][0].filename);
  };

  const { mutate: uploadDocument } = useMutation({
    mutationFn: ({ url, file }: { url: string; file: File }) =>
      uploadFile(url, file),
  });

  const handleSubmit = (data: TForm) => {
    const doSave = () => {
      onSave(data);
    };

    if (!presignedUrlResult) {
      doSave();
      return;
    }

    uploadDocument(
      {
        url: presignedUrlResult[0].putUrl,
        file: presignedUrlResult[1],
      },
      {
        onSuccess: () => {
          doSave();
        },
      }
    );
  };
  return (
    <SlideOverForm
      onSubmit={formMethods.handleSubmit(handleSubmit)}
      onClose={() => setOpen(false)}
      submitText="Done"
      isSaving={saving}
    >
      <SlideOverHeading
        title={
          organizationPolicyFile
            ? "Add Policy or Procedure"
            : "Edit Policy or Procedure"
        }
        description="Manage this organization policy or procedure."
        setOpen={setOpen}
      />
      <SlideOverFormBody>
        <SlideOverField
          key="name"
          label="Name"
          name="name"
          helpText="Name for this policy or procedure."
        >
          <FormInput {...formMethods.register("name")} />
        </SlideOverField>
        <SlideOverField
          key="pdfS3Key"
          label="Policy or Procedure PDF"
          name="pdfS3Key"
          helpText="Select and upload the PDF document for this policy or procedure."
        >
          <Input
            type="file"
            onChange={handleFileChange}
            className="pl-2 w-full"
            accept="application/pdf"
          />
          {(organizationPolicyFile?.pdfUrl ?? presignedUrlResult?.[1]) && (
            <a
              href={
                organizationPolicyFile?.pdfUrl ??
                URL.createObjectURL(presignedUrlResult![1])
              }
              target="_blank"
              rel="noreferrer"
              className="text-secondary-600 hover:text-secondary-500 transition-colors inline-flex items-center gap-1 text-sm"
            >
              Preview{" "}
              <span className="font-semibold">{pdfS3Key.split("/").pop()}</span>{" "}
              <ArrowTopRightOnSquareIcon className="size-4" />
            </a>
          )}
        </SlideOverField>
      </SlideOverFormBody>
    </SlideOverForm>
  );
};

export default EditOrganizationPolicyFile;
