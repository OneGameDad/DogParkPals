import React from 'react';
import SelectBase from './SelectBase';

export type SortOrder = 'az' | 'za';

interface SortSelectProps {
    value: SortOrder;
    onChange: (value: SortOrder) => void;
    className?: string;
}

export const SortSelect: React.FC<SortSelectProps> = ({ value, onChange, className }) => {
    return (
        <SelectBase
            value={value}
            onChange={(e) => onChange(e.target.value as SortOrder)}
            className={className}
        >
            <option value="az">Name A → Z</option>
            <option value="za">Name Z → A</option>
        </SelectBase>
    );
};

export default SortSelect;
