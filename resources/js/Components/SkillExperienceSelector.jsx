import React, { useState, useCallback, useMemo } from 'react';
import taxonomy from '../../../full_freelance_services_taxonomy.json';

export default function SkillExperienceSelector({
    label = 'Required Skills',
    description = 'Select the skills and experience levels required for this job',
    skills = [],
    onChange = () => {},
    type = 'required',
    maxSkills = 10,
    showImportance = true
}) {
    const [input, setInput] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [selectedLevel, setSelectedLevel] = useState('intermediate');
    const [selectedImportance, setSelectedImportance] = useState(type === 'nice_to_have' ? 'preferred' : 'required');

    // Get all available skills from taxonomy
    const ALL_SKILLS = useMemo(() => {
        const skillsSet = new Set();
        (taxonomy.services || []).forEach(service => {
            (service.categories || []).forEach(cat => {
                (cat.skills || []).forEach(s => skillsSet.add(s));
            });
        });
        return Array.from(skillsSet).sort();
    }, []);

    const experienceLevels = ['beginner', 'intermediate', 'expert'];
    const importanceOptions = ['required', 'preferred'];

    // Filter suggestions as user types
    const handleInputChange = useCallback((e) => {
        const value = e.target.value;
        setInput(value);

        if (value.trim().length < 1) {
            setSuggestions([]);
            return;
        }

        const filtered = ALL_SKILLS.filter(skill =>
            skill.toLowerCase().includes(value.toLowerCase()) &&
            !skills.some(s => s.skill.toLowerCase() === skill.toLowerCase())
        );

        setSuggestions(filtered.slice(0, 8));
    }, [ALL_SKILLS, skills]);

    // Add a new skill
    const addSkill = useCallback(() => {
        if (!selectedSkill || skills.length >= maxSkills) return;

        // Check if skill already exists
        if (skills.some(s => s.skill.toLowerCase() === selectedSkill.toLowerCase())) {
            alert('This skill is already added');
            return;
        }

        const newSkill = {
            skill: selectedSkill,
            experience_level: selectedLevel,
            importance: type === 'nice_to_have' ? 'preferred' : selectedImportance
        };

        onChange([...skills, newSkill]);

        // Reset form
        setInput('');
        setSelectedSkill(null);
        setSuggestions([]);
        setSelectedLevel('intermediate');
        setSelectedImportance(type === 'nice_to_have' ? 'preferred' : 'required');
    }, [selectedSkill, selectedLevel, selectedImportance, skills, onChange, maxSkills, type]);

    // Remove a skill
    const removeSkill = useCallback((index) => {
        onChange(skills.filter((_, i) => i !== index));
    }, [skills, onChange]);

    // Update a skill's experience level
    const updateSkillLevel = useCallback((index, newLevel) => {
        const updated = [...skills];
        updated[index].experience_level = newLevel;
        onChange(updated);
    }, [skills, onChange]);

    // Update a skill's importance
    const updateSkillImportance = useCallback((index, newImportance) => {
        const updated = [...skills];
        updated[index].importance = newImportance;
        onChange(updated);
    }, [skills, onChange]);

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-300">
            <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {label}
                </label>
                {description && (
                    <p className="text-sm text-gray-600 mb-3">{description}</p>
                )}
            </div>

            {/* Add Skill Form */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {/* Skill Input */}
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Skill Name
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={handleInputChange}
                                placeholder="Type skill name..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                list="skill-suggestions"
                            />
                            {suggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {suggestions.map((skill, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                setSelectedSkill(skill);
                                                setInput(skill);
                                                setSuggestions([]);
                                            }}
                                            className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm text-gray-700"
                                        >
                                            {skill}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Experience Level Select */}
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Experience Level
                        </label>
                        <select
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {experienceLevels.map(level => (
                                <option key={level} value={level}>
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Importance Select (only for required skills) */}
                    {showImportance && type !== 'nice_to_have' && (
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Importance
                            </label>
                            <select
                                value={selectedImportance}
                                onChange={(e) => setSelectedImportance(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {importanceOptions.map(imp => (
                                    <option key={imp} value={imp}>
                                        {imp.charAt(0).toUpperCase() + imp.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Add Button */}
                    <div className="md:col-span-1 flex items-end">
                        <button
                            type="button"
                            onClick={addSkill}
                            disabled={!selectedSkill || skills.length >= maxSkills}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                        >
                            + Add Skill
                        </button>
                    </div>
                </div>

                {skills.length >= maxSkills && (
                    <p className="text-sm text-amber-600 mt-2">Maximum {maxSkills} skills reached</p>
                )}
            </div>

            {/* Selected Skills List */}
            {skills.length > 0 && (
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Added Skills ({skills.length})
                    </label>
                    <div className="space-y-2">
                        {skills.map((skill, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                            >
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">{skill.skill}</p>
                                    <p className="text-xs text-gray-600">
                                        {skill.experience_level.charAt(0).toUpperCase() + skill.experience_level.slice(1)}
                                        {showImportance && ` • ${skill.importance.charAt(0).toUpperCase() + skill.importance.slice(1)}`}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Experience Level Dropdown */}
                                    <select
                                        value={skill.experience_level}
                                        onChange={(e) => updateSkillLevel(idx, e.target.value)}
                                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {experienceLevels.map(level => (
                                            <option key={level} value={level}>
                                                {level.charAt(0).toUpperCase() + level.slice(1)}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Importance Dropdown */}
                                    {showImportance && type !== 'nice_to_have' && (
                                        <select
                                            value={skill.importance}
                                            onChange={(e) => updateSkillImportance(idx, e.target.value)}
                                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {importanceOptions.map(imp => (
                                                <option key={imp} value={imp}>
                                                    {imp.charAt(0).toUpperCase() + imp.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {/* Remove Button */}
                                    <button
                                        type="button"
                                        onClick={() => removeSkill(idx)}
                                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded font-medium text-sm"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {skills.length === 0 && (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">No skills added yet. Add at least one skill above.</p>
                </div>
            )}
        </div>
    );
}
