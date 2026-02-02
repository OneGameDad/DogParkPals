import { useState, useEffect } from 'react';
import { useDebounce } from '../../hooks';
import InputText from '../common/InputText';

interface SearchBarProps {
    onSearch: (query: string) => void;
    placeholder?: string;
    delay?: number;
}

const SearchBar = ({ onSearch, placeholder = "Search...", delay = 500 }: SearchBarProps) => {
    const [inputValue, setInputValue] = useState('');
    const debouncedValue = useDebounce(inputValue, delay);

    useEffect(() => {
        onSearch(debouncedValue);
    }, [debouncedValue, onSearch]);

    return (
        <div className="w-full">
            <InputText
                value={inputValue}
                onChange={setInputValue}
                placeholder={placeholder}
            />
        </div>
    );
};

export default SearchBar;