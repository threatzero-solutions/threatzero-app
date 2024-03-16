import { AssessmentStatus, TipStatus } from "./entities";

export interface ThreatAssessmentStats {
	total: number;
	subtotals: {
		newSince: {
			days7: number;
		};
		statuses: {
			[key in AssessmentStatus]: number;
		};
	};
}

export interface TipSubmissionStats {
	total: number;
	subtotals: {
		newSince: {
			days7: number;
			days30: number;
		};
		statuses: {
			[key in TipStatus]: number;
		};
	};
}

export interface TrainingCheckpointStats {
	total: number;
	totalComplete: number;
	totalNotComplete: number;
	totalsByAudience: {
		[key: string]: {
			complete: number;
			notComplete: number;
		};
	};
}
