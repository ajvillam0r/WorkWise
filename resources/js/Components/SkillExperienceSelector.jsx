import React, { useState, useCallback, useEffect, useRef } from 'react';
import useSkillPipeline from '@/hooks/useSkillPipeline';
import FuzzySkillPrompt from '@/Components/FuzzySkillPrompt';

export default function SkillExperienceSelector({
    label = 'Required Skills',
    description = 'Select the skills and experience levels required for this job',
    skills = [],
    onChange = () => {},
    type = 'required',
    maxSkills = 10,
    showImportance = true,
    defaultExperienceLevel = null,
    showCategoryChips = true,
}) {
    const useJobLevelOnly = defaultExperienceLevel != null && defaultExperienceLevel !== '';
    const effectiveLevel = useJobLevelOnly ? defaultExperienceLevel : null;

    const [input, setInput] = useState('');
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [selectedLevel, setSelectedLevel] = useState('intermediate');
    const [selectedImportance, setSelectedImportance] = useState(type === 'nice_to_have' ? 'preferred' : 'required');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categorySkills, setCategorySkills] = useState([]);
    const debounceRef = useRef(null);

    const {
        suggestions, categories, loadSuggestions, loadCategorySkills,
        validateAndAdd, isValidating, validationError, setValidationError,
        fuzzyPrompt, acceptFuzzy, rejectFuzzy, dismissFuzzy,
    } = useSkillPipeline();

    const experienceLevels = ['beginner', 'intermediate', 'expert'];
    const importanceOptions = ['required', 'preferred'];

    // Debounced typeahead search
    useEffect(() => {
        clearTimeout(debounceRef.current);
        if (input.trim().length >= 1) {
            debounceRef.current = setTimeout(() => loadSuggestions(input.trim()), 250);
        }
        return () => clearTimeout(debounceRef.current);
    }, [input, loadSuggestions]);

    // Load category-specific skills when category changes
    useEffect(() => {
        if (selectedCategory) {
            loadCategorySkills(selectedCategory).then(setCategorySkills);
        } else {
            setCategorySkills([]);
        }
    }, [selectedCategory, loadCategorySkills]);

    const filteredSuggestions = input.trim()
        ? suggestions.filter(s =>
            s.toLowerCase().includes(input.toLowerCase()) &&
            !skills.some(sk => sk.skill.trim().toLowerCase() === s.trim().toLowerCase())
          ).slice(0, 8)
        : [];

    const addVerifiedSkill = useCallback((name) => {
        const trimmed = (name || '').trim();
        if (!trimmed || skills.length >= maxSkills) return;
        if (skills.some(s => s.skill.trim().toLowerCase() === trimmed.toLowerCase())) return;

        onChange([...skills, {
            skill: trimmed,
            experience_level: useJobLevelOnly ? effectiveLevel : selectedLevel,
            importance: type === 'nice_to_have' ? 'preferred' : selectedImportance,
        }]);
        setInput('');
        setSelectedSkill(null);
        setSelectedLevel('intermediate');
        setSelectedImportance(type === 'nice_to_have' ? 'preferred' : 'required');
    }, [skills, maxSkills, onChange, useJobLevelOnly, effectiveLevel, selectedLevel, selectedImportance, type]);

    const addSkillWithPipeline = useCallback(async () => {
        const name = (selectedSkill || input).trim();
        if (!name || skills.length >= maxSkills) return;
        if (skills.some(s => s.skill.trim().toLowerCase() === name.toLowerCase())) return;

        // If it's a known verified suggestion, skip the full pipeline
        const isVerified = suggestions.some(s => s.toLowerCase() === name.toLowerCase());
        if (isVerified) {
            const canonical = suggestions.find(s => s.toLowerCase() === name.toLowerCase()) || name;
            addVerifiedSkill(canonical);
            return;
        }

        const result = await validateAndAdd(name);
        if (result) {
            addVerifiedSkill(result.skill);
        }
    }, [selectedSkill, input, skills, maxSkills, suggestions, addVerifiedSkill, validateAndAdd]);

    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkillWithPipeline();
        }
    }, [addSkillWithPipeline]);

    const removeSkill = useCallback((index) => {
        onChange(skills.filter((_, i) => i !== index));
    }, [skills, onChange]);

    const updateSkillLevel = useCallback((index, newLevel) => {
        const updated = [...skills];
        updated[index] = { ...updated[index], experience_level: newLevel };
        onChange(updated);
    }, [skills, onChange]);

    const updateSkillImportance = useCallback((index, newImportance) => {
        const updated = [...skills];
        updated[index] = { ...updated[index], importance: newImportance };
        onChange(updated);
    }, [skills, onChange]);

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-300">
            <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                {description && <p className="text-sm text-gray-600 mb-3">{description}</p>}
            </div>

            {/* Fuzzy prompt */}
            {fuzzyPrompt && (
                <div className="mb-4">
                    <FuzzySkillPrompt prompt={fuzzyPrompt} onAccept={acceptFuzzy} onReject={rejectFuzzy} onDismiss={dismissFuzzy} />
                </div>
            )}

            {/* Validation error */}
            {validationError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <span className="text-red-500 text-sm">&#9888;</span>
                    <p className="text-sm text-red-700 flex-1">{validationError}</p>
                    <button onClick={() => setValidationError(null)} className="text-red-400 hover:text-red-600 text-xs">&#10005;</button>
                </div>
            )}

            {/* Category Chips */}
            {showCategoryChips && categories.length > 0 && (
                <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Filter by Category</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('')}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${!selectedCategory ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}
                        >
                            All
                        </button>
                        {categories.slice(0, 20).map(cat => (
                            <button
                                type="button"
                                key={cat}
                                onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
                                className={`px-3 py-1 rounded-full text-xs font-medium border transition ${selectedCategory === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Top skills for selected category */}
                    {selectedCategory && categorySkills.length > 0 && (
                        <div className="mb-3">
                            <p className="text-xs text-gray-500 mb-2">Top skills in <strong>{selectedCategory}</strong>:</p>
                            <div className="flex flex-wrap gap-2">
                                {categorySkills.map(s => {
                                    const isAdded = skills.some(sk => sk.skill.toLowerCase() === s.toLowerCase());
                                    return (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => !isAdded && addVerifiedSkill(s)}
                                            disabled={isAdded}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${isAdded ? 'bg-green-50 text-green-700 border-green-200 cursor-default' : 'bg-indigo-50 text-blue-700 border-blue-200 hover:bg-blue-100'}`}
                                        >
                                            {isAdded ? '✓ ' : '+ '}{s}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Add Skill Form */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className={`grid grid-cols-1 gap-3 ${useJobLevelOnly ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
                    {/* Skill Input */}
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Skill Name</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => { setInput(e.target.value); setSelectedSkill(e.target.value); }}
                                onKeyPress={handleKeyPress}
                                placeholder="Type or add custom skill..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isValidating}
                            />
                            {filteredSuggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {filteredSuggestions.map((skill, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => { setSelectedSkill(skill); setInput(skill); addVerifiedSkill(skill); }}
                                            className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm text-gray-700"
                                        >
                                            {skill}
                                        </button>
                                    ))}
                                    {input.trim() && !filteredSuggestions.some(s => s.toLowerCase() === input.trim().toLowerCase()) && (
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedSkill(input.trim()); addSkillWithPipeline(); }}
                                            className="w-full text-left px-3 py-2 hover:bg-green-50 text-sm text-green-700 border-t border-gray-200 font-medium"
                                        >
                                            + Add "{input.trim()}" as custom skill
                                        </button>
                                    )}
                                </div>
                            )}
                            {input.trim() && filteredSuggestions.length === 0 && !isValidating && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedSkill(input.trim()); addSkillWithPipeline(); }}
                                        className="w-full text-left px-3 py-2 hover:bg-green-50 text-sm text-green-700 font-medium"
                                    >
                                        + Add "{input.trim()}" as custom skill
                                    </button>
                                </div>
                            )}
                            <p className="text-xs text-gray-500 mt-1">Press Enter to add skill</p>
                        </div>
                    </div>

                    {/* Experience Level */}
                    {!useJobLevelOnly && (
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                            <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                {experienceLevels.map(level => (
                                    <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Importance */}
                    {showImportance && type !== 'nice_to_have' && (
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Importance</label>
                            <select value={selectedImportance} onChange={(e) => setSelectedImportance(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                {importanceOptions.map(imp => (
                                    <option key={imp} value={imp}>{imp.charAt(0).toUpperCase() + imp.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Add Button */}
                    <div className="md:col-span-1 flex items-end">
                        <button
                            type="button"
                            onClick={addSkillWithPipeline}
                            disabled={!selectedSkill || skills.length >= maxSkills || isValidating}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                        >
                            {isValidating ? 'Checking...' : '+ Add Skill'}
                        </button>
                    </div>
                </div>

                {skills.length >= maxSkills && (
                    <p className="text-sm text-amber-600 mt-2">Maximum {maxSkills} skills reached</p>
                )}
            </div>

            {/* Selected Skills */}
            {skills.length > 0 && (
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Added Skills ({skills.length})</label>
                    <div className="space-y-2">
                        {skills.map((skill, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">{skill.skill}</p>
                                    <p className="text-xs text-gray-600">
                                        {(skill.experience_level || effectiveLevel || 'intermediate').charAt(0).toUpperCase() + (skill.experience_level || effectiveLevel || 'intermediate').slice(1)}
                                        {showImportance && ` • ${(skill.importance || 'required').charAt(0).toUpperCase() + (skill.importance || 'required').slice(1)}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!useJobLevelOnly && (
                                        <select value={skill.experience_level} onChange={(e) => updateSkillLevel(idx, e.target.value)} className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            {experienceLevels.map(level => (
                                                <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                                            ))}
                                        </select>
                                    )}
                                    {showImportance && type !== 'nice_to_have' && (
                                        <select value={skill.importance} onChange={(e) => updateSkillImportance(idx, e.target.value)} className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            {importanceOptions.map(imp => (
                                                <option key={imp} value={imp}>{imp.charAt(0).toUpperCase() + imp.slice(1)}</option>
                                            ))}
                                        </select>
                                    )}
                                    <button type="button" onClick={() => removeSkill(idx)} className="px-3 py-1 text-red-600 hover:bg-red-50 rounded font-medium text-sm">&#10005;</button>
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
