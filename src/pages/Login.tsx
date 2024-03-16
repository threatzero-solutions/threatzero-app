import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { withAuthenticationRequired } from "../contexts/AuthProvider";

const Login: React.FC = () => {
	const navigate = useNavigate();

	useEffect(() => {
		navigate("/");
	}, [navigate]);

	return (
		<div className="flex flex-col items-center justify-center">
			<h1>Redirecting...</h1>
		</div>
	);
};

export default withAuthenticationRequired(Login);
