import React from 'react';

export interface SelectBaseProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    className?: string;
}

export const SelectBase: React.FC<SelectBaseProps> = ({ className = '', ...props }) => {
    return (
        <select
            className={`text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${className}`}
            {...props}
        />
    );
};

export default SelectBase;
