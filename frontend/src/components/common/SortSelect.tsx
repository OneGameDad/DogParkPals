import React from 'react';
import { useTranslation } from 'react-i18next';
import SelectBase from './SelectBase';

export type SortOrder = 'az' | 'za';

interface SortSelectProps {
    value: SortOrder;
    onChange: (value: SortOrder) => void;
    className?: string;
}

export const SortSelect: React.FC<SortSelectProps> = ({ value, onChange, className }) => {
    const { t } = useTranslation();

    return (
        <SelectBase
            value={value}
            onChange={(e) => onChange(e.target.value as SortOrder)}
            className={className}
        >
            <option value="az">{t('sort.nameAsc', 'Name A → Z')}</option>
            <option value="za">{t('sort.nameDesc', 'Name Z → A')}</option>
        </SelectBase>
    );
};

export default SortSelect;
