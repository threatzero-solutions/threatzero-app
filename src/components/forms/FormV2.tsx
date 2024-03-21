import { Survey } from "survey-react-ui";
import { Model } from "survey-core";
import { BorderlessLight } from "survey-core/themes";
import "survey-core/defaultV2.min.css";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTipForm } from "../../queries/tips";
import { FieldType, InternalFieldType } from "../../types/entities";

const toSurveyJsType = (type: FieldType | InternalFieldType) => {
  switch (type) {
    case FieldType.TEXTAREA:
      return "comment";
    default:
      return type;
  }
};

const strip = (html: string) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
};

const FormV2: React.FC<any> = ({ ...props }) => {
  const { data: formData, isLoading: formLoading } = useQuery({
    queryKey: ["tip-form"],
    queryFn: getTipForm,
  });

  const formJson = useMemo(() => {
    if (!formData) return;

    return {
      pages: [
        {
          html: formData.title,
          elements: (formData.fields ?? []).map((f) => ({
            name: f.name,
            title: strip(f.label),
            type: toSurveyJsType(f.type),
          })),
        },
      ],
    };
  }, [formData]);

  const formModel = useMemo(() => {
    const form = new Model(formJson);
    form.applyTheme(BorderlessLight);
    return form;
  }, [formJson]);

  return (
    <div>
      <Survey model={formModel} />
    </div>
  );
};

export default FormV2;
