import { useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';

// ─── Glass Card Component ─────────────────────────────────────────────────────
function GlassCard({ children, className = '' }) {
    return (
        <div className={`bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/80 dark:border-white/5 rounded-3xl shadow-soft ${className}`}>
            {children}
        </div>
    );
}

// ─── Step 1: Welcome ─────────────────────────────────────────────────────────
function EmployerStep1Welcome({ onNext, onSkip }) {
    return (
        <main className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
            {/* Left Panel - Hero Branding */}
            <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative overflow-hidden flex-col justify-end p-12 text-white"
                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)' }}>
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full translate-x-1/4 translate-y-1/4 blur-3xl" />
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        Empower Your Business
                    </div>
                    <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">
                        Find the perfect talent for your next big project.
                    </h2>
                    <p className="text-lg text-blue-100 max-w-md font-light leading-relaxed mb-8">
                        Connect with verified gig workers, manage payments easily, and scale your operations with WorkWise.
                    </p>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 max-w-sm">
                        <div className="flex text-yellow-400 text-sm mb-3">
                            {[...Array(5)].map((_, i) => <span key={i} className="material-icons text-base">star</span>)}
                        </div>
                        <p className="text-sm italic text-gray-200 mb-4 leading-relaxed">
                            "WorkWise helped us find a designer in 24 hours. The onboarding was seamless and the results were exceptional."
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">JD</div>
                            <div>
                                <p className="text-xs font-bold text-white uppercase tracking-wider">James D.</p>
                                <p className="text-[10px] text-blue-200">Tech Lead @ ByteCorp</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Onboarding Progress */}
            <div className="w-full lg:w-7/12 xl:w-1/2 bg-slate-50 dark:bg-slate-950 flex flex-col overflow-y-auto relative">
                {/* Visual Background Elements */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0" />

                <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 xl:px-24 max-w-4xl mx-auto w-full relative z-10">
                    <div className="mb-12">
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                            Build your employer <span className="text-primary">presence.</span>
                        </h1>
                        <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
                            Complete your profile to unlock full access to our talent pool. Verified employers see <span className="text-primary font-bold">45% higher reply rates</span> from top gig workers.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mb-12">
                        {[
                            { step: 1, icon: 'business', title: 'Company Identity', desc: 'Tell us who you are and what you do.' },
                            { step: 2, icon: 'history_edu', title: 'Company Bio', desc: 'Add a description to attract top talent.' },
                            { step: 3, icon: 'analytics', title: 'Hiring Preferences', desc: 'Set your typical budget and duration.' },
                        ].map((item) => (
                            <div key={item.step} className="group flex items-center gap-5 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary/30 hover:shadow-xl transition-all duration-300">
                                <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                    <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{item.title}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                                </div>
                                <div className="ml-auto flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-400">
                                    {item.step}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <button onClick={onNext} className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-primary hover:bg-blue-700 shadow-[0_10px_20px_-5px_rgba(59,130,246,0.3)] text-white font-bold text-base transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3">
                            Get Started
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                        <button onClick={onSkip} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold text-sm transition-colors decoration-2 underline-offset-4 hover:underline">
                            Skip for now
                        </button>
                    </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute top-10 right-10 hidden xl:flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Verified Professionals Online
                </div>
            </div>
        </main>
    );
}

// ─── Step 2: Company Identity ────────────────────────────────────────────────
function EmployerStep2Identity({ data, setData, errors, industries, onNext, onBack }) {
    const fileRef = useRef(null);
    const [preview, setPreview] = useState(data.profile_picture_preview || null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setData('profile_picture_file', file);
        setPreview(URL.createObjectURL(file));
    };

    const companySizes = [
        { value: 'individual', label: 'Individual' },
        { value: '2-10', label: '2-10 employees' },
        { value: '11-50', label: '11-50 employees' },
        { value: '51-200', label: '51-200 employees' },
        { value: '200+', label: '200+ employees' },
    ];

    return (
        <main className="flex-grow container mx-auto px-4 py-10 max-w-5xl relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 rounded-full blur-[100px] -z-10" />

            <div className="mb-10 max-w-3xl mx-auto text-center">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Company Identity</h1>
                <p className="text-slate-500 dark:text-slate-400">Tell us about your business or individual practice.</p>

                <div className="mt-8 flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${s === 2 ? 'w-12 bg-primary' : s < 2 ? 'w-4 bg-primary/40' : 'w-4 bg-slate-200 dark:bg-slate-800'}`} />
                    ))}
                </div>
            </div>

            <GlassCard className="max-w-4xl mx-auto overflow-hidden">
                <div className="p-8 md:p-12">
                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Right Side: Photo Upload (Positioned for Desktop flow) */}
                        <div className="lg:order-2 w-full lg:w-72 flex-shrink-0 flex flex-col items-center">
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-6">Logo / Avatar</h3>
                            <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
                                <div className="w-48 h-48 rounded-full border-2 border-slate-200 dark:border-slate-800 p-2 bg-white dark:bg-slate-900 shadow-xl overflow-hidden relative transition-all group-hover:scale-[1.02]">
                                    {preview ? (
                                        <img src={preview} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-700">business</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="bg-white text-primary px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">Upload</span>
                                    </div>
                                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                </div>
                                <div className="absolute bottom-4 right-4 bg-primary text-white p-3 rounded-2xl shadow-lg pointer-events-none group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-xl leading-none">add_a_photo</span>
                                </div>
                            </div>
                            <div className="mt-6 text-center">
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                                    JPG, PNG or WEBP. Max 2MB.
                                </p>
                                {errors.profile_picture && <p className="text-xs text-rose-500 mt-2 font-bold">{errors.profile_picture}</p>}
                            </div>
                        </div>

                        {/* Left Side: Form Fields */}
                        <div className="lg:order-1 flex-1 space-y-8">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]" htmlFor="company_name">
                                    Company Name <span className="text-slate-400 font-normal">(Optional)</span>
                                </label>
                                <input
                                    id="company_name"
                                    type="text"
                                    value={data.company_name}
                                    onChange={e => setData('company_name', e.target.value)}
                                    placeholder="Your Business Name"
                                    className="block w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 text-sm p-4 transition-all shadow-sm"
                                />
                                {errors.company_name && <p className="text-xs text-rose-500 font-bold">{errors.company_name}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]" htmlFor="industry">
                                        Industry <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        id="industry"
                                        value={data.industry}
                                        onChange={e => setData('industry', e.target.value)}
                                        className="block w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 text-sm p-4 transition-all shadow-sm"
                                    >
                                        <option value="">Select Industry</option>
                                        {industries.map(ind => (
                                            <option key={ind} value={ind}>{ind}</option>
                                        ))}
                                    </select>
                                    {errors.industry && <p className="text-xs text-rose-500 font-bold">{errors.industry}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]" htmlFor="company_size">
                                        Team Size <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        id="company_size"
                                        value={data.company_size}
                                        onChange={e => setData('company_size', e.target.value)}
                                        className="block w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 text-sm p-4 transition-all shadow-sm"
                                    >
                                        <option value="">Select Size</option>
                                        {companySizes.map(size => (
                                            <option key={size.value} value={size.value}>{size.label}</option>
                                        ))}
                                    </select>
                                    {errors.company_size && <p className="text-xs text-rose-500 font-bold">{errors.company_size}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fixed Footer for this step */}
                <div className="border-t border-slate-100 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                    <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold text-sm transition-all">
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        Back
                    </button>
                    <button onClick={onNext} className="px-10 py-3 rounded-xl bg-primary hover:bg-blue-700 text-white font-bold text-sm transition-all hover:shadow-lg active:scale-95 flex items-center gap-2">
                        Next Step
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>
                </div>
            </GlassCard>
        </main>
    );
}

export { EmployerStep1Welcome, EmployerStep2Identity };
