/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{html,js,tsx}"],
	theme: {
		extend: {
			colors: {
				ss: {
					"threatzero-orange": "#F7941D",
				},
				primary: {
					50: "#fff7eb",
					100: "#fde9c8",
					200: "#fbd28c",
					300: "#f9b350",
					400: "#f7941d",
					500: "#f1750f",
					600: "#d5530a",
					700: "#b1360c",
					800: "#902b10",
					900: "#762311",
					950: "#440f04",
				},
				secondary: {
					50: "#f0f8fe",
					100: "#deedfb",
					200: "#c4e2f9",
					300: "#9bcff5",
					400: "#6cb4ee",
					500: "#589fe9",
					600: "#357bdb",
					700: "#2c66c9",
					800: "#2a53a3",
					900: "#274881",
					950: "#1c2e4f",
				},
			},
			gridTemplateColumns: {
				"video-card": "repeat(auto-fit, minmax(250px, 1fr))",
			},
			gridTemplateRows: {
				"video-card": "minmax(16rem, min-content) 1fr",
				"video-card-dense": "minmax(8rem, min-content) 1fr",
			},
		},
	},
	plugins: [require("@tailwindcss/forms")],
};
