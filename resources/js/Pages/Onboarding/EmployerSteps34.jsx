import { useState } from 'react';

// ─── Glass Card Component ─────────────────────────────────────────────────────
function GlassCard({ children, className = '' }) {
    return (
        <div className={`bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/80 dark:border-white/5 rounded-3xl shadow-soft ${className}`}>
            {children}
        </div>
    );
}

// ─── Step 3: Company Bio & Website ───────────────────────────────────────────
function EmployerStep3Bio({ data, setData, errors, onNext, onBack }) {
    const [charCount, setCharCount] = useState((data.company_description || '').length);

    return (
        <main className="flex-grow container mx-auto px-4 py-10 max-w-5xl relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 rounded-full blur-[100px] -z-10" />

            <div className="mb-10 max-w-3xl mx-auto text-center">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Company Bio</h1>
                <p className="text-slate-500 dark:text-slate-400">Introduce your business to potential gig workers.</p>

                <div className="mt-8 flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${s === 3 ? 'w-12 bg-primary' : s < 3 ? 'w-4 bg-primary/40' : 'w-4 bg-slate-200 dark:bg-slate-800'}`} />
                    ))}
                </div>
            </div>

            <GlassCard className="max-w-3xl mx-auto overflow-hidden">
                <div className="p-8 md:p-12 space-y-8">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]" htmlFor="company_website">
                            Company Website <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-lg group-focus-within:text-primary transition-colors">link</span>
                            <input
                                id="company_website"
                                type="url"
                                value={data.company_website}
                                onChange={e => setData('company_website', e.target.value)}
                                placeholder="https://example.com"
                                className="block w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 text-sm p-4 pl-12 transition-all shadow-sm"
                            />
                        </div>
                        {errors.company_website && <p className="text-xs text-rose-500 font-bold">{errors.company_website}</p>}
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]" htmlFor="company_description">
                                Company Description <span className="text-rose-500">*</span>
                            </label>
                            <span className={`text-[10px] font-bold ${charCount < 50 ? 'text-slate-400' : 'text-green-500'}`}>
                                {charCount}/1000 characters
                            </span>
                        </div>
                        <div className="relative">
                            <textarea
                                id="company_description"
                                rows={10}
                                value={data.company_description}
                                onChange={e => { setData('company_description', e.target.value); setCharCount(e.target.value.length); }}
                                placeholder="Tell us about your company, what you do, and your typical project needs... (minimum 50 characters)"
                                className="block w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 text-sm p-5 transition-all shadow-sm min-h-[250px] leading-relaxed"
                            />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            {charCount < 50 ? (
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">error_outline</span>
                                    Minimum 50 characters required
                                </p>
                            ) : (
                                <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                    Perfect! This gives workers enough detail.
                                </p>
                            )}
                        </div>
                        {errors.company_description && <p className="text-xs text-rose-500 font-bold">{errors.company_description}</p>}
                    </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                    <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold text-sm transition-all">
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        Back
                    </button>
                    <button
                        onClick={onNext}
                        disabled={charCount < 50}
                        className={`px-10 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${charCount >= 50 ? 'bg-primary hover:bg-blue-700 text-white hover:shadow-lg active:scale-95' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
                    >
                        Next Step
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>
                </div>
            </GlassCard>
        </main>
    );
}

// ─── Step 4: Hiring Preferences ──────────────────────────────────────────────
function EmployerStep4Preferences({ data, setData, errors, serviceCategories, onNext, onBack }) {
    const toggleHiringNeed = (category) => {
        const current = data.primary_hiring_needs || [];
        if (current.includes(category)) {
            setData('primary_hiring_needs', current.filter(c => c !== category));
        } else {
            setData('primary_hiring_needs', [...current, category]);
        }
    };

    const budgetOptions = [
        { value: 'under_500', label: 'Under ₱500' },
        { value: '500-2000', label: '₱500 - ₱2,000' },
        { value: '2000-5000', label: '₱2,000 - ₱5,000' },
        { value: '5000-10000', label: '₱5,000 - ₱10,000' },
        { value: '10000+', label: '₱10,000+' },
    ];

    const durationOptions = [
        { value: 'short_term', label: 'Short-term (< 1 month)' },
        { value: 'medium_term', label: 'Medium-term (1-3 months)' },
        { value: 'long_term', label: 'Long-term (3-6 months)' },
        { value: 'ongoing', label: 'Ongoing (6+ months)' },
    ];

    const experienceOptions = [
        { value: 'any', label: 'Any level' },
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'expert', label: 'Expert' },
    ];

    const frequencyOptions = [
        { value: 'one_time', label: 'One-time project' },
        { value: 'occasional', label: 'Occasional' },
        { value: 'regular', label: 'Regular (Monthly)' },
        { value: 'ongoing', label: 'Ongoing simultaneous' },
    ];

    return (
        <main className="flex-grow container mx-auto px-4 py-10 max-w-6xl relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 rounded-full blur-[100px] -z-10" />

            <div className="mb-10 max-w-3xl mx-auto text-center">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Hiring Preferences</h1>
                <p className="text-slate-500 dark:text-slate-400">Match with the right talent by defining your typical needs.</p>

                <div className="mt-8 flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${s === 4 ? 'w-12 bg-primary' : s < 4 ? 'w-4 bg-primary/40' : 'w-4 bg-slate-200 dark:bg-slate-800'}`} />
                    ))}
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
                {/* Left: Services Selection (Larger) */}
                <div className="lg:col-span-8">
                    <GlassCard className="p-8">
                        <div className="mb-6 flex justify-between items-center">
                            <label className="block text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">
                                What services do you need? <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[10px] font-bold text-slate-400">SELECT AT LEAST ONE</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {serviceCategories.map((category) => (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => toggleHiringNeed(category)}
                                    className={`px-4 py-3 rounded-2xl border-2 text-xs font-bold transition-all duration-300 flex items-center justify-between gap-2 overflow-hidden ${(data.primary_hiring_needs || []).includes(category)
                                            ? 'border-primary bg-primary/5 text-primary shadow-sm scale-105'
                                            : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-primary/20 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <span className="truncate">{category}</span>
                                    {(data.primary_hiring_needs || []).includes(category) && (
                                        <span className="material-symbols-outlined text-[16px] shrink-0">check_circle</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        {errors.primary_hiring_needs && <p className="text-xs text-rose-500 font-bold mt-4">{errors.primary_hiring_needs}</p>}
                    </GlassCard>
                </div>

                {/* Right: Specifics (Sidebar) */}
                <div className="lg:col-span-4 space-y-6">
                    <GlassCard className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]" htmlFor="typical_project_budget">
                                Typical Budget <span className="text-rose-500">*</span>
                            </label>
                            <select
                                id="typical_project_budget"
                                value={data.typical_project_budget}
                                onChange={e => setData('typical_project_budget', e.target.value)}
                                className="block w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 text-xs p-4 shadow-sm"
                            >
                                <option value="">Select Range</option>
                                {budgetOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]" htmlFor="typical_project_duration">
                                Typical Duration <span className="text-rose-500">*</span>
                            </label>
                            <select
                                id="typical_project_duration"
                                value={data.typical_project_duration}
                                onChange={e => setData('typical_project_duration', e.target.value)}
                                className="block w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 text-xs p-4 shadow-sm"
                            >
                                <option value="">Select Duration</option>
                                {durationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]" htmlFor="preferred_experience_level">
                                Talent level <span className="text-rose-500">*</span>
                            </label>
                            <select
                                id="preferred_experience_level"
                                value={data.preferred_experience_level}
                                onChange={e => setData('preferred_experience_level', e.target.value)}
                                className="block w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 text-xs p-4 shadow-sm"
                            >
                                <option value="">Select Experience</option>
                                {experienceOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]" htmlFor="hiring_frequency">
                                frequency <span className="text-rose-500">*</span>
                            </label>
                            <select
                                id="hiring_frequency"
                                value={data.hiring_frequency}
                                onChange={e => setData('hiring_frequency', e.target.value)}
                                className="block w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 text-xs p-4 shadow-sm"
                            >
                                <option value="">Select Frequency</option>
                                {frequencyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* Footer Nav */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-6 px-6 z-40 shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.1)]">
                <div className="container mx-auto max-w-6xl flex items-center justify-between">
                    <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold text-sm transition-all px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900">
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        Back
                    </button>
                    <button
                        onClick={onNext}
                        disabled={(data.primary_hiring_needs || []).length === 0}
                        className={`px-10 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-primary/20 ${(data.primary_hiring_needs || []).length > 0 ? 'bg-primary hover:bg-blue-700 text-white hover:-translate-y-0.5 active:scale-95' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
                    >
                        Review Profile
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>
                </div>
            </div>
            <div className="h-32" />
        </main>
    );
}

export { EmployerStep3Bio, EmployerStep4Preferences };
