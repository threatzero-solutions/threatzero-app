import { EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import {
	CONTACT_EMAIL,
	CONTACT_PHONE_NUMBER,
	CONTACT_PHONE_NUMBER_FORMATTED,
} from "../constants/core";
import { useScript } from "usehooks-ts";

const CONTACT_FORM_EMBED_SRC = "//js.hsforms.net/forms/embed/v2.js";

declare const hbspt: {
	forms: {
		create: (options: {
			region: string;
			portalId: string;
			formId: string;
			target: string;
		}) => void;
	};
};

const HelpCenter: React.FC = () => {
	const [hsFormsStatus] = useScript(CONTACT_FORM_EMBED_SRC);

	useEffect(() => {
		if (typeof hbspt !== "undefined") {
			hbspt.forms.create({
				region: "na1",
				portalId: "44192779",
				formId: "7ff2ed51-2b15-4afe-b501-7be2d3a4cce8",
				target: "#hbspt-form-7ff2ed51-2b15-4afe-b501-7be2d3a4cce8",
			});
		}
	}, [hsFormsStatus]);

	return (
		<div className="grid grid-cols-1 gap-6 sm:gap-12 xl:grid-cols-2">
			<section>
				<h1 className="text-3xl font-bold mb-4 text-transparent w-min whitespace-nowrap bg-clip-text bg-gradient-to-r from-secondary-800 to-secondary-500">
					Help Center
				</h1>
				<p>Questions? We're here for you.</p>
				<div className="mt-6 flex w-full flex-none gap-x-4 border-t border-gray-900/5 pt-6">
					<dt className="flex-none">
						<span className="sr-only">Email</span>
						<EnvelopeIcon
							className="h-6 w-5 text-gray-400"
							aria-hidden="true"
						/>
					</dt>
					<dd className="text-sm font-medium leading-6 text-gray-900">
						<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
					</dd>
				</div>
				<div className="mt-4 flex w-full flex-none gap-x-4">
					<dt className="flex-none">
						<span className="sr-only">Phone</span>
						<PhoneIcon className="h-6 w-5 text-gray-400" aria-hidden="true" />
					</dt>
					<dd className="text-sm font-mediumleading-6 text-gray-900">
						<a href={`tel:${CONTACT_PHONE_NUMBER}`}>
							{CONTACT_PHONE_NUMBER_FORMATTED}{" "}
						</a>
					</dd>
				</div>
			</section>
			<section>
				<div id="hbspt-form-7ff2ed51-2b15-4afe-b501-7be2d3a4cce8" />
			</section>
		</div>
	);
};

export default HelpCenter;
