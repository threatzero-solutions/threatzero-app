import { classNames } from "../../utils/core";
import { PropsWithChildren, ReactNode } from "react";

export interface Step {
	name: ReactNode;
	description: ReactNode;
	onClick: () => void;
}

interface StepsProps extends PropsWithChildren {
	steps: Step[];
	currentIdx: number;
}

const Steps: React.FC<StepsProps> = ({ steps, currentIdx, children }) => {
	// TODO: It would be nice if the page would autoscroll to the top of the next selected
	// step...

	return (
		<nav aria-label="Progress">
			<ol className="overflow-hidden">
				{steps.map((step, stepIdx) => (
					<li
						key={"step_" + stepIdx}
						className={classNames(
							stepIdx !== steps.length - 1 ? "pb-10" : "",
							"relative",
						)}
					>
						{stepIdx < currentIdx ? (
							<>
								{stepIdx !== steps.length - 1 ? (
									<div
										className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-secondary-600"
										aria-hidden="true"
									/>
								) : null}
								<div
									onClick={step.onClick}
									className="group relative flex items-start"
								>
									<span className="flex h-9 items-center cursor-pointer">
										<span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-secondary-600 group-hover:bg-secondary-800">
											<span className="h-2.5 w-2.5 rounded-full bg-white group-hover:bg-gray-300" />
										</span>
									</span>
									<span className="ml-4 flex min-w-0 flex-col">
										<span className="text-sm font-medium">{step.name}</span>
										<span className="text-sm text-gray-500">
											{step.description}
										</span>
									</span>
								</div>
							</>
						) : stepIdx === currentIdx ? (
							<>
								{stepIdx !== steps.length - 1 ? (
									<div
										className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300"
										aria-hidden="true"
									/>
								) : null}
								<div
									onClick={step.onClick}
									className="group relative flex items-start"
									aria-current="step"
								>
									<span className="flex h-9 items-center" aria-hidden="true">
										<span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-secondary-600 bg-white">
											<span className="h-2.5 w-2.5 rounded-full bg-secondary-600" />
										</span>
									</span>
									<span className="ml-4 flex min-w-0 flex-col">
										<span className="text-sm font-medium text-secondary-600">
											{step.name}
										</span>
										<span className="text-sm text-gray-500">
											{step.description}
										</span>
									</span>
								</div>
								<div className="ml-12 py-4">{children}</div>
							</>
						) : (
							<>
								{stepIdx !== steps.length - 1 ? (
									<div
										className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300"
										aria-hidden="true"
									/>
								) : null}
								<div
									onClick={step.onClick}
									className="group relative flex items-start"
								>
									<span
										className="flex h-9 items-center cursor-pointer"
										aria-hidden="true"
									>
										<span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white group-hover:border-gray-400">
											<span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300" />
										</span>
									</span>
									<span className="ml-4 flex min-w-0 flex-col">
										<span className="text-sm font-medium text-gray-500">
											{step.name}
										</span>
										<span className="text-sm text-gray-500">
											{step.description}
										</span>
									</span>
								</div>
							</>
						)}
					</li>
				))}
			</ol>
		</nav>
	);
};

export default Steps;
