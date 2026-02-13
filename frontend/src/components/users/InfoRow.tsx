import React from 'react';

interface InfoRowProps {
	label: string;
	value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => {
	return (
		<div className="flex justify-between border-b pb-2">
			<span className="font-semibold text-gray-700">{label}:</span>
			<span className="text-gray-900">{value}</span>
		</div>
	);
};

export default InfoRow;
