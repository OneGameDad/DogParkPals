import { useState, useEffect, useRef } from 'react';
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
    const onSearchRef = useRef(onSearch);

    useEffect(() => {
        onSearchRef.current = onSearch;
    }, [onSearch]);

    useEffect(() => {
        onSearchRef.current(debouncedValue);
    }, [debouncedValue]);

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