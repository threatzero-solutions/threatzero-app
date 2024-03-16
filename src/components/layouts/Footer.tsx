import { EnvelopeIcon, PhoneIcon } from "@heroicons/react/20/solid";
import { PropsWithChildren } from "react";
import {
	CONTACT_EMAIL,
	CONTACT_PHONE_NUMBER,
	CONTACT_PHONE_NUMBER_FORMATTED,
} from "../../constants/core";

interface SocialButtonProps {
	href: string;
}

const SocialButton: React.FC<PropsWithChildren<SocialButtonProps>> = ({
	href,
	children,
}) => {
	return (
		<a
			href={href}
			target="_blank"
			rel="noreferrer"
			className="bg-primary-400 hover:bg-primary-500 transition-colors cursor-pointer p-2 font-semibold text-white inline-flex items-center space-x-2 rounded"
		>
			{children}
		</a>
	);
};

const Footer: React.FC = () => {
	return (
		<div className="w-full h-min py-8 px-8 bg-stone-800 text-white">
			<div className="grid grid-cols-1 w-full">
				<div className="border-b border-current grid grid-cols-1 lg:grid-cols-3 gap-4 items-center justify-items-center pb-6 mb-6">
					<img
						className="w-auto h-20"
						src="https://content.threatzero.org/TZ_logo_white.png"
						alt="ThreatZero Logo"
					/>
					<h2 className="font-extrabold text-md xl:text-lg text-center">
						<span className="whitespace-nowrap">Empower Communities.</span>{" "}
						<span className="whitespace-nowrap">Mitigate Threats.</span>{" "}
						<span className="whitespace-nowrap">Save Lives.</span>
					</h2>
					<div className="flex flex-wrap justify-center gap-2">
						{/* FACEBOOK */}
						<SocialButton href="https://www.facebook.com/profile.php?id=61550666871393">
							<svg
								className="w-5 h-5 fill-current"
								role="img"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
							>
								<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
							</svg>
						</SocialButton>

						{/* INSTAGRAM */}
						<SocialButton href="https://www.instagram.com/threatzerosolutions/">
							<svg
								className="w-5 h-5 fill-current"
								viewBox="0 0 16 16"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z" />
							</svg>{" "}
						</SocialButton>

						{/* TWITTER */}
						<SocialButton href="https://twitter.com/ThreatZeroED">
							<svg
								className="w-5 h-5 fill-current"
								role="img"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
							>
								<path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
							</svg>
						</SocialButton>

						{/* LINKEDIN */}
						<SocialButton href="https://www.linkedin.com/company/threatzerosolutions/">
							<svg
								className="w-5 h-5 fill-current"
								role="img"
								viewBox="0 0 256 256"
								xmlns="http://www.w3.org/2000/svg"
							>
								<g>
									<path d="M218.123122,218.127392 L180.191928,218.127392 L180.191928,158.724263 C180.191928,144.559023 179.939053,126.323993 160.463756,126.323993 C140.707926,126.323993 137.685284,141.757585 137.685284,157.692986 L137.685284,218.123441 L99.7540894,218.123441 L99.7540894,95.9665207 L136.168036,95.9665207 L136.168036,112.660562 L136.677736,112.660562 C144.102746,99.9650027 157.908637,92.3824528 172.605689,92.9280076 C211.050535,92.9280076 218.138927,118.216023 218.138927,151.114151 L218.123122,218.127392 Z M56.9550587,79.2685282 C44.7981969,79.2707099 34.9413443,69.4171797 34.9391618,57.260052 C34.93698,45.1029244 44.7902948,35.2458562 56.9471566,35.2436736 C69.1040185,35.2414916 78.9608713,45.0950217 78.963054,57.2521493 C78.9641017,63.090208 76.6459976,68.6895714 72.5186979,72.8184433 C68.3913982,76.9473153 62.7929898,79.26748 56.9550587,79.2685282 M75.9206558,218.127392 L37.94995,218.127392 L37.94995,95.9665207 L75.9206558,95.9665207 L75.9206558,218.127392 Z M237.033403,0.0182577091 L18.8895249,0.0182577091 C8.57959469,-0.0980923971 0.124827038,8.16056231 -0.001,18.4706066 L-0.001,237.524091 C0.120519052,247.839103 8.57460631,256.105934 18.8895249,255.9977 L237.033403,255.9977 C247.368728,256.125818 255.855922,247.859464 255.999,237.524091 L255.999,18.4548016 C255.851624,8.12438979 247.363742,-0.133792868 237.033403,0.000790807055"></path>
								</g>
							</svg>
						</SocialButton>

						{/* TIK-TOK */}
						<SocialButton href="https://www.tiktok.com/@threatzero">
							<svg
								className="w-5 h-5 fill-current"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 32 32"
							>
								<path d="M16.656 1.029c1.637-0.025 3.262-0.012 4.886-0.025 0.054 2.031 0.878 3.859 2.189 5.213l-0.002-0.002c1.411 1.271 3.247 2.095 5.271 2.235l0.028 0.002v5.036c-1.912-0.048-3.71-0.489-5.331-1.247l0.082 0.034c-0.784-0.377-1.447-0.764-2.077-1.196l0.052 0.034c-0.012 3.649 0.012 7.298-0.025 10.934-0.103 1.853-0.719 3.543-1.707 4.954l0.020-0.031c-1.652 2.366-4.328 3.919-7.371 4.011l-0.014 0c-0.123 0.006-0.268 0.009-0.414 0.009-1.73 0-3.347-0.482-4.725-1.319l0.040 0.023c-2.508-1.509-4.238-4.091-4.558-7.094l-0.004-0.041c-0.025-0.625-0.037-1.25-0.012-1.862 0.49-4.779 4.494-8.476 9.361-8.476 0.547 0 1.083 0.047 1.604 0.136l-0.056-0.008c0.025 1.849-0.050 3.699-0.050 5.548-0.423-0.153-0.911-0.242-1.42-0.242-1.868 0-3.457 1.194-4.045 2.861l-0.009 0.030c-0.133 0.427-0.21 0.918-0.21 1.426 0 0.206 0.013 0.41 0.037 0.61l-0.002-0.024c0.332 2.046 2.086 3.59 4.201 3.59 0.061 0 0.121-0.001 0.181-0.004l-0.009 0c1.463-0.044 2.733-0.831 3.451-1.994l0.010-0.018c0.267-0.372 0.45-0.822 0.511-1.311l0.001-0.014c0.125-2.237 0.075-4.461 0.087-6.698 0.012-5.036-0.012-10.060 0.025-15.083z" />
							</svg>
						</SocialButton>
					</div>
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
					<div className="flex justify-center gap-6 text-sm flex-wrap">
						<span className="flex items-center">
							<EnvelopeIcon className="h-4 w-4 mr-2" aria-hidden="true" />
							<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
						</span>
						<span className="flex items-center">
							<PhoneIcon className="h-4 w-4 mr-2" aria-hidden="true" />
							<a href={`tel:${CONTACT_PHONE_NUMBER}`}>
								{CONTACT_PHONE_NUMBER_FORMATTED}{" "}
							</a>
						</span>
					</div>
					<div></div>
					<div className="text-center">
						ThreatZero Solutions | © {new Date().getFullYear()}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Footer;
