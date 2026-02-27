import React from 'react';
import SelectBase from './SelectBase';

interface FilterSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: readonly string[] | string[];
    allLabel?: string;
    className?: string;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
    value,
    onChange,
    options,
    allLabel = 'All',
    className
}) => {
    return (
        <SelectBase
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={className}
        >
            <option value="">{allLabel}</option>
            {options.map((option) => (
                <option key={option} value={option}>
                    {option.replace(/_/g, ' ').charAt(0).toUpperCase() + option.replace(/_/g, ' ').slice(1).toLowerCase()}
                </option>
            ))}
        </SelectBase>
    );
};

export default FilterSelect;
