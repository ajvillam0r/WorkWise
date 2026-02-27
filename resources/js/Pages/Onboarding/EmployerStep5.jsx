import { Head } from '@inertiajs/react';

// ─── Glass Card Component ─────────────────────────────────────────────────────
function GlassCard({ children, className = '' }) {
    return (
        <div className={`bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/80 dark:border-white/5 rounded-3xl shadow-soft ${className}`}>
            {children}
        </div>
    );
}

// ─── Stat Item (Reusable for review) ──────────────────────────────────────────
function ReviewItem({ label, value, icon }) {
    return (
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-primary flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-xl">{icon}</span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{value || 'Not specified'}</p>
            </div>
        </div>
    );
}

export default function EmployerStep5Review({ data, onSubmit, onBack, submitting, goToStep }) {
    return (
        <main className="flex-grow container mx-auto px-4 py-10 max-w-6xl relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 rounded-full blur-[100px] -z-10" />

            <div className="mb-10 max-w-3xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-[10px] font-black text-green-600 uppercase tracking-widest mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Ready to launch
                </div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Review Your Profile</h1>
                <p className="text-slate-500 dark:text-slate-400">Everything looks great! Take a quick look before we finalize.</p>

                <div className="mt-8 flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className="h-1.5 rounded-full transition-all duration-500 w-12 bg-primary" />
                    ))}
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Left: General Info & Bio */}
                <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-6">
                    <GlassCard className="p-8 md:p-10">
                        <div className="flex flex-col md:flex-row gap-8 items-start mb-10 pb-10 border-b border-slate-100 dark:border-slate-800">
                            <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden bg-white dark:bg-slate-900 shrink-0">
                                {data.profile_picture_preview ? (
                                    <img src={data.profile_picture_preview} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-300">
                                        <span className="material-symbols-outlined text-4xl">business</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-grow">
                                <div className="flex justify-between items-start mb-2">
                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {data.company_name || 'Individual Employer'}
                                    </h2>
                                    <button onClick={() => goToStep(2)} className="text-primary hover:text-blue-700 font-bold text-xs flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-all">
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                        Edit
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-3 mt-4">
                                    <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-sm">category</span> {data.industry}
                                    </span>
                                    <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-sm">groups</span> {data.company_size}
                                    </span>
                                    {data.company_website && (
                                        <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-sm">link</span> Website Provided
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">description</span>
                                    Company Description
                                </h3>
                                <button onClick={() => goToStep(3)} className="text-slate-400 hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined">edit</span>
                                </button>
                            </div>
                            <div className="p-6 rounded-3xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                                {data.company_description}
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">work</span>
                                Targeted Services
                            </h3>
                            <button onClick={() => goToStep(4)} className="text-slate-400 hover:text-primary transition-colors">
                                <span className="material-symbols-outlined">edit</span>
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {(data.primary_hiring_needs || []).map((need, idx) => (
                                <span key={idx} className="px-4 py-2 bg-primary/5 text-primary text-xs font-bold rounded-xl border border-primary/10">
                                    {need}
                                </span>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                {/* Right: Hiring Preferences Summary */}
                <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-6">
                    <GlassCard className="p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Hiring Stats</h3>
                            <button onClick={() => goToStep(4)} className="text-slate-400 hover:text-primary transition-colors">
                                <span className="material-symbols-outlined">edit</span>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <ReviewItem
                                icon="payments"
                                label="Typical Budget"
                                value={data.typical_project_budget?.replace('_', ' ')}
                            />
                            <ReviewItem
                                icon="schedule"
                                label="Project Duration"
                                value={data.typical_project_duration?.replace('_', ' ')}
                            />
                            <ReviewItem
                                icon="stars"
                                label="Exp. Level"
                                value={data.preferred_experience_level}
                            />
                            <ReviewItem
                                icon="event_repeat"
                                label="Frequency"
                                value={data.hiring_frequency?.replace('_', ' ')}
                            />
                        </div>
                    </GlassCard>

                    <GlassCard className="p-8 bg-primary/5 border-primary/20">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
                                <span className="material-symbols-outlined">verified_user</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-primary text-sm">Verification Status</h4>
                                <p className="text-[10px] text-primary/60 font-black uppercase tracking-wider">Auto-Approved</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            As an employer, your profile is auto-approved upon completion. You can start posting jobs immediately.
                        </p>
                    </GlassCard>
                </div>
            </div>

            {/* Footer Nav */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-6 px-6 z-40 shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.1)]">
                <div className="container mx-auto max-w-6xl flex items-center justify-between">
                    <button onClick={onBack} disabled={submitting} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold text-sm transition-all px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-50">
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        Back
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={submitting}
                        className="px-12 py-4 rounded-2xl bg-primary hover:bg-blue-700 text-white font-bold text-base transition-all shadow-[0_10px_20px_-5px_rgba(59,130,246,0.3)] hover:-translate-y-1 active:scale-95 flex items-center gap-3 disabled:opacity-50"
                    >
                        {submitting ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Processing...
                            </>
                        ) : (
                            <>
                                Complete Profile
                                <span className="material-symbols-outlined">rocket_launch</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
            <div className="h-32" />
        </main>
    );
}
