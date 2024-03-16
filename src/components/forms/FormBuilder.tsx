import { useParams, useSearchParams } from "react-router-dom";
import { LEVEL, WRITE } from "../../constants/permissions";
import { withRequirePermissions } from "../../guards/RequirePermissions";
import { useContext, useEffect, useMemo } from "react";
import Form from "./Form";
import { getForm, getForms, saveForm } from "../../queries/forms";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FormsContext } from "../../contexts/forms/forms-context";

const FormBuilder: React.FC = () => {
	const params = useParams();
	const [searchParams, setSearchParams] = useSearchParams();

	const { dispatch } = useContext(FormsContext);

	const { data: allForms, isLoading: isLoadingAllForms } = useQuery({
		queryKey: ["form", params.slug],
		queryFn: ({ queryKey }) => getForms({ slug: queryKey[1] }),
	});

	const selectedFormId = useMemo(() => {
		if (!allForms) return undefined;

		if (allForms.results.length) {
			const f =
				allForms.results.find(
					(_f) => _f.version + "" === searchParams.get("v"),
				) ?? allForms.results[0];

			return f.id;
		}

		return null;
	}, [allForms, searchParams]);

	const queryClient = useQueryClient();
	const { data: form, isLoading: isLoadingSelectedForm } = useQuery({
		queryKey: ["form", params.slug, selectedFormId],
		queryFn: ({ queryKey }) =>
			queryKey[2]
				? getForm(queryKey[2] as string)
				: saveForm({ slug: queryKey[1] as string }).then((f) => {
						setSearchParams((p) => {
							p.set("v", f.version + "");
							return p;
						});
						queryClient.invalidateQueries({queryKey: ["form", queryKey[1]]});
						return f;
				  }),
		enabled: selectedFormId !== undefined,
	});

	useEffect(() => {
		dispatch({
			type: "SET_ACTIVE_FORM",
			payload: form,
		});
	}, [form, dispatch]);

	return (
		<div>
			<Form
				form={form}
				isBuilding={true}
				readOnly={true}
				isLoading={
					selectedFormId !== null &&
					(isLoadingAllForms || isLoadingSelectedForm)
				}
				versions={allForms?.results.map((f) => f.version)}
				mediaUploadUrl=""
			/>
		</div>
	);
};

export default withRequirePermissions(FormBuilder, {
	permissions: [LEVEL.ADMIN, WRITE.FORMS],
});
