import React from 'react';

export interface TabOption<T extends string> {
    id: T;
    label: string;
    activeColorClass?: string;
}

interface FilterTabsProps<T extends string> {
    tabs: TabOption<T>[];
    activeTab: T;
    onChange: (tabId: T) => void;
    className?: string;
}

export const FilterTabs = <T extends string>({
    tabs,
    activeTab,
    onChange,
    className = ''
}: FilterTabsProps<T>) => {
    return (
        <div className={`flex justify-center mb-6 space-x-4 ${className}`}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const activeClasses = tab.activeColorClass || 'bg-blue-600 text-white shadow-md';
                const inactiveClasses = 'bg-gray-100 text-gray-600 hover:bg-gray-200';

                return (
                    <button
                        key={tab.id}
                        className={`py-2 px-4 rounded-full font-medium transition-colors ${isActive ? activeClasses : inactiveClasses}`}
                        onClick={() => onChange(tab.id)}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
};

export default FilterTabs;
