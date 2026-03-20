import React from 'react';
import { useTranslation } from 'react-i18next';
import SelectBase from './SelectBase';

interface FilterSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: readonly string[] | string[];
    allLabel?: string;
    optionLabelKeyPrefix?: string;
    className?: string;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
    value,
    onChange,
    options,
    allLabel = 'All',
    optionLabelKeyPrefix,
    className
}) => {
    const { t, i18n } = useTranslation();

    const formatOption = (option: string) => {
        const fallback = option.replace(/_/g, ' ').charAt(0).toUpperCase() + option.replace(/_/g, ' ').slice(1).toLowerCase();

        if (!optionLabelKeyPrefix) {
            return fallback;
        }

        const translationKey = `${optionLabelKeyPrefix}.${option}`;
        return i18n.exists(translationKey) ? t(translationKey) : fallback;
    };

    return (
        <SelectBase
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={className}
        >
            <option value="">{allLabel}</option>
            {options.map((option) => (
                <option key={option} value={option}>
                    {formatOption(option)}
                </option>
            ))}
        </SelectBase>
    );
};

export default FilterSelect;
