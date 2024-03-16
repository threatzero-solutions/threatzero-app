import { useNavigate } from "react-router-dom";
import { classNames } from "../../utils/core";

interface BackButtonProps {
	value?: string;
	className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ value, className }) => {
	const navigate = useNavigate();
	return (
		<button
			type="button"
			className={classNames(
				"block text-sm text-gray-900 hover:text-gray-600 mb-4 w-max",
				className ?? "",
			)}
			onClick={() => navigate(-1)}
		>
			&larr; {value ?? "Back"}
		</button>
	);
};

export default BackButton;
