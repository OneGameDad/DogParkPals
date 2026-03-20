import type { TFunction } from 'i18next';

type TranslateFunction = (key: string) => string;

// Level and XP utilities
export const LEVEL_THRESHOLDS = [
	{ min: 0, max: 250 },
	{ min: 250, max: 500 },
	{ min: 500, max: 1000 },
	{ min: 1000, max: 5000 },
	{ min: 5000, max: Infinity }
];

export const formatLevel = (expPoints: number): number => {
	if (expPoints < 250) return 1;
	if (expPoints < 500) return 2;
	if (expPoints < 1000) return 3;
	if (expPoints < 5000) return 4;
	return 5;
};

export const getLevelBadge = (level: number, t: TranslateFunction) => {
	const colors = ['bg-gray-400', 'bg-green-400', 'bg-blue-400', 'bg-purple-400', 'bg-yellow-400'];
	const index = level - 1;
	const badgeColor = colors[index] ?? colors[0];
	return (
		<span className={`ml-2 px-2 py-1 text-xs font-semibold text-white rounded ${badgeColor}`}>
			{t('profile.level')} {level}
		</span>
	);
};

export const getProgressToNextLevel = (expPoints: number): number => {
	const level = formatLevel(expPoints);
	const currentLevel = LEVEL_THRESHOLDS[level - 1];

	if (level === 5) return 100; // Max level

	const progress = ((expPoints - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100;
	return Math.min(progress, 100);
};

// Time formatting utilities
export const formatLastSeen = (lastSeenDate: Date | null, t: TFunction): string => {
	if (!lastSeenDate) return t('profile.neverOnline', 'Never online');

	const now = new Date();
	const then = new Date(lastSeenDate);
	const diffMs = now.getTime() - then.getTime();
	const diffMins = Math.floor(diffMs / 60000);

	if (diffMins < 1) return t('profile.justNow', 'Just now');
	if (diffMins < 60) return t('profile.minutesAgo', `${diffMins} minutes ago`, { count: diffMins });

	const diffHours = Math.floor(diffMins / 60);
	if (diffHours < 24) return t('profile.hoursAgo', `${diffHours} hours ago`, { count: diffHours });

	const diffDays = Math.floor(diffHours / 24);
	return t('profile.daysAgo', `${diffDays} days ago`, { count: diffDays });
};
