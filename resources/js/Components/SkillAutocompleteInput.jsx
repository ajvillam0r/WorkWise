import { useState, useEffect, useRef } from 'react';

export default function SkillAutocompleteInput({
    value = '',
    onChange,
    onSelect,
    skills = [],
    placeholder = 'Type to search skills...',
    className = '',
    maxSuggestions = 10
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredSkills, setFilteredSkills] = useState([]);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    // Filter skills based on input with debouncing
    useEffect(() => {
        if (value.length >= 2) {
            const filtered = skills
                .filter(skill => 
                    skill.toLowerCase().includes(value.toLowerCase())
                )
                .slice(0, maxSuggestions);
            setFilteredSkills(filtered);
            setIsOpen(filtered.length > 0);
            setHighlightedIndex(-1);
        } else {
            setIsOpen(false);
            setFilteredSkills([]);
        }
    }, [value, skills, maxSuggestions]);

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev => 
                    prev < filteredSkills.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < filteredSkills.length) {
                    handleSelect(filteredSkills[highlightedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setHighlightedIndex(-1);
                break;
        }
    };

    const handleSelect = (skill) => {
        onSelect(skill);
        onChange('');
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.focus();
    };

    return (
        <div ref={wrapperRef} className="relative">
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={`block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-base sm:text-sm min-h-[44px] ${className}`}
            />
            
            {isOpen && filteredSkills.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredSkills.map((skill, index) => (
                        <button
                            key={skill}
                            type="button"
                            onClick={() => handleSelect(skill)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            className={`w-full text-left px-4 py-3 sm:py-2 text-base sm:text-sm transition-colors min-h-[44px] sm:min-h-0 ${
                                index === highlightedIndex
                                    ? 'bg-blue-100 text-blue-900'
                                    : 'text-gray-900 hover:bg-gray-100 active:bg-gray-100'
                            }`}
                        >
                            {skill}
                        </button>
                    ))}
                </div>
            )}

            {isOpen && filteredSkills.length === 0 && value.length >= 2 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="px-4 py-3 text-sm text-gray-500">
                        No matching skills found. You can still add "{value}" manually.
                    </div>
                </div>
            )}
        </div>
    );
}
