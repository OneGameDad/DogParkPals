import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatLevel, getLevelBadge, LEVEL_THRESHOLDS, getProgressToNextLevel } from '../../utils/profileUtils';

interface UserLevelDisplayProps {
	expPoints: number;
}

const UserLevelDisplay: React.FC<UserLevelDisplayProps> = ({ expPoints }) => {
	const { t } = useTranslation();
	const level = formatLevel(expPoints);
	const levelIndex = Math.max(0, Math.min(level - 1, LEVEL_THRESHOLDS.length - 1));
	
	return (
		<div className="border-b pb-3">
			<div className="flex justify-between items-center mb-2">
				<span className="font-semibold text-gray-700">{t('profile.experiencePoints')}:</span>
				{getLevelBadge(level, t)}
			</div>
			<div className="w-full bg-gray-200 rounded-full h-2">
				<div 
					className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-300" 
					style={{ width: `${getProgressToNextLevel(expPoints)}%` }}
				/>
			</div>
			<div className="text-right mt-1">
				<span className="text-xs text-gray-600">
					{expPoints} / {LEVEL_THRESHOLDS[levelIndex].max} XP
				</span>
			</div>
		</div>
	);
};

export default UserLevelDisplay;
