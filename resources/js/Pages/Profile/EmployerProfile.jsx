import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// ─── Avatar / initials helpers ────────────────────────────────────────────────
function Avatar({ user, size = 'lg' }) {
    const sizeClass = size === 'lg' ? 'w-32 h-32 text-4xl' : 'w-10 h-10 text-sm';
    const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'E';

    if (user.profile_picture) {
        return (
            <div className={`${sizeClass} rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden bg-white`}>
                <img
                    src={user.profile_picture}
                    alt={user.name}
                    className="w-full h-full object-cover"
                />
            </div>
        );
    }

    return (
        <div className={`${sizeClass} rounded-full border-4 border-white dark:border-slate-800 shadow-xl bg-gradient-to-br from-primary to-blue-700 text-white flex items-center justify-center font-bold`}>
            {initials}
        </div>
    );
}

// ─── Glass Card Component ─────────────────────────────────────────────────────
function GlassCard({ children, className = '' }) {
    return (
        <div className={`bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/80 dark:border-white/5 rounded-3xl shadow-soft ${className}`}>
            {children}
        </div>
    );
}

// ─── Stat Item ────────────────────────────────────────────────────────────────
function StatItem({ icon, label, value, colorClass }) {
    return (
        <div className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl transition-all hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                    <span className="material-symbols-outlined text-lg">{icon}</span>
                </div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white">{value}</span>
        </div>
    );
}

export default function EmployerProfile({ user, stats, activeJobs, pastProjects, status }) {
    // #region agent log
    const goToEdit = () => {
        const resolved = route('employer.profile.edit');
        fetch('http://127.0.0.1:7501/ingest/c1ee8a40-5240-4871-b19a-db022ef79a5e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'224090'},body:JSON.stringify({sessionId:'224090',runId:'post-fix',hypothesisId:'H-A',location:'EmployerProfile.jsx:53',message:'goToEdit called',data:{resolvedRoute:resolved,typeofResolved:typeof resolved},timestamp:Date.now()})}).catch(()=>{});
        router.visit(resolved);
    };
    // #endregion

    return (
        <AuthenticatedLayout>
            <Head title={`WorkWise - ${user.company_name || user.name}`} />

            <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-8 relative">
                {/* Background Blobs */}
                <div className="absolute top-1/4 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 mix-blend-multiply dark:mix-blend-overlay animate-pulse"></div>
                <div className="absolute top-1/3 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10 mix-blend-multiply dark:mix-blend-overlay animate-pulse delay-700"></div>

                <div className="grid lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT SIDEBAR: Identity & Stats */}
                    <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
                        <GlassCard className="p-6 flex flex-col items-center text-center relative overflow-hidden">
                            <div className="relative mb-4 group">
                                <Avatar user={user} size="lg" />
                                <div className="absolute bottom-2 right-2 bg-green-500 border-4 border-white dark:border-slate-900 w-6 h-6 rounded-full z-10 shadow-sm" title="Online"></div>
                            </div>

                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                                {user.name}
                            </h2>
                            <p className="text-primary font-semibold text-sm mb-4">
                                {user.company_name || 'Individual Employer'}
                            </p>

                            <div className="flex flex-wrap justify-center gap-2 mb-6">
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-primary text-[10px] font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-800">
                                    <span className="material-symbols-outlined text-[14px]">verified</span> Verified
                                </span>
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 text-[10px] font-bold uppercase tracking-wider border border-purple-100 dark:border-purple-800">
                                    <span className="material-symbols-outlined text-[14px]">business_center</span> Employer
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-6">
                                <span className="material-symbols-outlined text-[18px]">location_on</span>
                                {user.location || 'Location not set'}
                            </div>

                            <button
                                onClick={goToEdit}
                                className="w-full bg-white dark:bg-slate-700 text-slate-900 dark:text-white border-2 border-slate-300 dark:border-slate-600 hover:border-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-primary dark:hover:text-blue-400 text-sm font-bold py-3 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                Edit Profile
                            </button>
                        </GlassCard>

                        <GlassCard className="p-6">
                            <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-4 opacity-50">Quick Stats</h3>
                            <div className="space-y-4">
                                <StatItem
                                    icon="work"
                                    label="Jobs Posted"
                                    value={stats.jobs_posted}
                                    colorClass="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                                />
                                <StatItem
                                    icon="payments"
                                    label="Total Spent"
                                    value={`₱${stats.total_spent}`}
                                    colorClass="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400"
                                />
                                <StatItem
                                    icon="handshake"
                                    label="Hire Rate"
                                    value={stats.hire_rate}
                                    colorClass="bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400"
                                />
                            </div>
                        </GlassCard>

                        <GlassCard className="p-6">
                            <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-4 opacity-50">Company Info</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                    <span className="material-symbols-outlined text-lg text-slate-400">category</span>
                                    <span>{user.industry || 'Industry not specified'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                    <span className="material-symbols-outlined text-lg text-slate-400">groups</span>
                                    <span>{user.company_size || 'Size not specified'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                    <span className="material-symbols-outlined text-lg text-slate-400">schedule</span>
                                    <span>Member since {user.joined_date}</span>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* MAIN CONTENT: Bio & Jobs */}
                    <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-8">
                        <GlassCard className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    About {user.company_name || user.name}
                                </h3>
                                <button onClick={goToEdit} className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-sm font-bold px-3 py-1.5 rounded-lg transition-all">Edit</button>
                            </div>
                            <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                                {user.company_description ? (
                                    <p>{user.company_description}</p>
                                ) : (
                                    <p className="italic opacity-60">No company description provided yet. Add one to attract better talent!</p>
                                )}
                                {user.bio && <p>{user.bio}</p>}
                            </div>
                        </GlassCard>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Active Jobs</h3>
                                <button
                                    onClick={() => router.visit(route('jobs.create'))}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-blue-600/25 transition-all hover:shadow-blue-700/30 active:scale-95 flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg text-white">add</span>
                                    Post a New Job
                                </button>
                            </div>

                            {activeJobs.length > 0 ? (
                                activeJobs.map((job) => (
                                    <GlassCard key={job.id} className="p-6 hover:shadow-md transition-all group border-l-4 border-l-primary">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors cursor-pointer">
                                                    {job.title}
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
                                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> Posted {new Date(job.created_at).toLocaleDateString()}</span>
                                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">attach_money</span> {job.budget_type === 'fixed' ? 'Fixed Price' : 'Hourly'}</span>
                                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">work_history</span> {job.experience_level || 'All Levels'}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {(job.required_skills || []).map((skill, idx) => (
                                                        <span key={idx} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700">
                                                            {typeof skill === 'string' ? skill : skill.skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 min-w-[120px]">
                                                <span className="text-2xl font-bold text-slate-900 dark:text-white">{job.bids_count || 0}</span>
                                                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Proposals</span>
                                                <Link
                                                    href={route('jobs.show', job.id)}
                                                    className="mt-2 text-primary text-sm font-bold hover:underline"
                                                >
                                                    View Details
                                                </Link>
                                            </div>
                                        </div>
                                    </GlassCard>
                                ))
                            ) : (
                                <GlassCard className="p-12 text-center text-slate-500">
                                    <span className="material-symbols-outlined text-4xl mb-2 opacity-20">work_off</span>
                                    <p className="text-sm font-medium">No active job posts found.</p>
                                    <button onClick={() => router.visit(route('jobs.create'))} className="mt-4 text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-4 py-2 rounded-lg transition-all">Start hiring now →</button>
                                </GlassCard>
                            )}
                        </div>

                        {/* PROJECT HISTORY */}
                        <GlassCard className="p-8">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Recent Projects</h3>
                            <div className="space-y-6">
                                {pastProjects.length > 0 ? (
                                    pastProjects.map((project) => (
                                        <div key={project.id} className="flex flex-col sm:flex-row gap-4 pb-6 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                                            <div className="w-full sm:w-48 h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden shrink-0 relative group flex items-center justify-center">
                                                <span className="material-symbols-outlined text-4xl text-slate-300 group-hover:scale-110 transition-transform">
                                                    {project.status === 'completed' ? 'task_alt' : 'rocket_launch'}
                                                </span>
                                            </div>
                                            <div className="flex-grow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{project.title}</h4>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${project.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {project.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Started {new Date(project.created_at).toLocaleDateString()}</p>
                                                <div className="flex items-center gap-3 mt-4">
                                                    <div className="size-8 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm bg-slate-100 flex items-center justify-center">
                                                        {project.gig_worker?.profile_picture ? (
                                                            <img src={project.gig_worker.profile_picture} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-slate-400">
                                                                {project.gig_worker?.first_name?.[0]}{project.gig_worker?.last_name?.[0]}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-500">
                                                        Gig Worker: <span className="text-slate-900 dark:text-white">{project.gig_worker?.name}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-slate-400">
                                        <span className="material-symbols-outlined text-4xl opacity-20 block mb-2">history</span>
                                        <p className="text-sm">No recent project activity.</p>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </main>
        </AuthenticatedLayout>
    );
}
