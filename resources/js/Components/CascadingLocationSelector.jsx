import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function CascadingLocationSelector({
    value = {},
    onChange,
    errors = {},
    disabled = false,
    required = false,
    className = ''
}) {
    const [countries, setCountries] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [municipalities, setMunicipalities] = useState([]);
    const [loading, setLoading] = useState({
        countries: false,
        provinces: false,
        cities: false,
        municipalities: false,
    });

    const [selectedValues, setSelectedValues] = useState({
        country: value.country || '',
        province: value.province || '',
        city: value.city || '',
        municipality: value.municipality || '',
    });

    // Load countries on mount
    useEffect(() => {
        loadCountries();
    }, []);

    // Load dependent data when selections change
    useEffect(() => {
        if (selectedValues.country) {
            loadProvinces(selectedValues.country);
        } else {
            setProvinces([]);
            setCities([]);
            setMunicipalities([]);
        }
    }, [selectedValues.country]);

    useEffect(() => {
        if (selectedValues.province) {
            loadCities(selectedValues.province);
        } else {
            setCities([]);
            setMunicipalities([]);
        }
    }, [selectedValues.province]);

    useEffect(() => {
        if (selectedValues.city) {
            loadMunicipalities(selectedValues.city);
        } else {
            setMunicipalities([]);
        }
    }, [selectedValues.city]);

    const loadCountries = async () => {
        try {
            setLoading(prev => ({ ...prev, countries: true }));
            const response = await axios.get('/api/location/countries');
            setCountries(response.data);
        } catch (error) {
            console.error('Error loading countries:', error);
        } finally {
            setLoading(prev => ({ ...prev, countries: false }));
        }
    };

    const loadProvinces = async (country) => {
        try {
            setLoading(prev => ({ ...prev, provinces: true }));
            const response = await axios.get(`/api/location/provinces/${encodeURIComponent(country)}`);
            setProvinces(response.data);
        } catch (error) {
            console.error('Error loading provinces:', error);
            setProvinces([]);
        } finally {
            setLoading(prev => ({ ...prev, provinces: false }));
        }
    };

    const loadCities = async (province) => {
        try {
            setLoading(prev => ({ ...prev, cities: true }));
            const response = await axios.get(`/api/location/cities/${encodeURIComponent(province)}`);
            setCities(response.data);
        } catch (error) {
            console.error('Error loading cities:', error);
            setCities([]);
        } finally {
            setLoading(prev => ({ ...prev, cities: false }));
        }
    };

    const loadMunicipalities = async (city) => {
        try {
            setLoading(prev => ({ ...prev, municipalities: true }));
            const response = await axios.get(`/api/location/municipalities/${encodeURIComponent(city)}`);
            setMunicipalities(response.data);
        } catch (error) {
            console.error('Error loading municipalities:', error);
            setMunicipalities([]);
        } finally {
            setLoading(prev => ({ ...prev, municipalities: false }));
        }
    };

    const handleChange = (field, newValue) => {
        const updatedValues = { ...selectedValues };
        updatedValues[field] = newValue;

        // Clear dependent fields when parent changes
        if (field === 'country') {
            updatedValues.province = '';
            updatedValues.city = '';
            updatedValues.municipality = '';
        } else if (field === 'province') {
            updatedValues.city = '';
            updatedValues.municipality = '';
        } else if (field === 'city') {
            updatedValues.municipality = '';
        }

        setSelectedValues(updatedValues);
        onChange(updatedValues);
    };

    const renderSelect = (field, label, options, loadingState, dependsOn = null) => {
        const isDisabled = disabled || loadingState || (dependsOn && !selectedValues[dependsOn]);
        const fieldError = errors[field];

        return (
            <div>
                <label 
                    htmlFor={field} 
                    className="block text-sm font-medium text-gray-700 mb-2"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="relative">
                    <select
                        id={field}
                        value={selectedValues[field]}
                        onChange={(e) => handleChange(field, e.target.value)}
                        disabled={isDisabled}
                        className={`w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                            isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                        } ${fieldError ? 'border-red-500' : ''}`}
                        required={required}
                    >
                        <option value="">
                            {loadingState 
                                ? 'Loading...' 
                                : dependsOn && !selectedValues[dependsOn]
                                    ? `Select ${dependsOn} first`
                                    : `Select ${label}`
                            }
                        </option>
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    {loadingState && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg 
                                className="animate-spin h-4 w-4 text-gray-400" 
                                xmlns="http://www.w3.org/2000/svg" 
                                fill="none" 
                                viewBox="0 0 24 24"
                            >
                                <circle 
                                    className="opacity-25" 
                                    cx="12" 
                                    cy="12" 
                                    r="10" 
                                    stroke="currentColor" 
                                    strokeWidth="4"
                                />
                                <path 
                                    className="opacity-75" 
                                    fill="currentColor" 
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                        </div>
                    )}
                </div>
                {fieldError && (
                    <p className="mt-2 text-sm text-red-600">{fieldError}</p>
                )}
            </div>
        );
    };

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderSelect('country', 'Country', countries, loading.countries)}
                {renderSelect('province', 'Province', provinces, loading.provinces, 'country')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderSelect('city', 'City', cities, loading.cities, 'province')}
                {renderSelect('municipality', 'Municipality / Barangay', municipalities, loading.municipalities, 'city')}
            </div>
        </div>
    );
}

/**
 * Compact variant - single column layout
 */
export function CascadingLocationSelectorCompact({ value, onChange, errors, disabled, required, className }) {
    return (
        <div className={`space-y-4 ${className}`}>
            <CascadingLocationSelector 
                value={value} 
                onChange={onChange} 
                errors={errors} 
                disabled={disabled} 
                required={required}
            />
        </div>
    );
}




