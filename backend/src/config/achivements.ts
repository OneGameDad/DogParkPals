import { AchievementType } from "@prisma/client";

export type XpAchievementThreshold = {
	name: string;
	minXp: number;
	type: AchievementType;
};

export const XP_ACHIEVEMENT_THRESHOLDS: XpAchievementThreshold[] = [
	{ name: "Level 2", minXp: 250, type: AchievementType.TROPHY },
	{ name: "Level 3", minXp: 500, type: AchievementType.TROPHY },
	{ name: "Level 4", minXp: 1000, type: AchievementType.TROPHY },
	{ name: "Level 5", minXp: 5000, type: AchievementType.TROPHY },
];