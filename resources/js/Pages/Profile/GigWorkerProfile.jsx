import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// ─── Skill color palette ───────────────────────────────────────────────────────
const SKILL_COLORS = [
    { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
    { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100' },
    { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
    { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-100' },
    { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' },
    { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100' },
    { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-100' },
];
const colorFor = (i) => SKILL_COLORS[i % SKILL_COLORS.length];

const proficiencyLabel = (p) => {
    if (!p) return null;
    return p.charAt(0).toUpperCase() + p.slice(1);
};

// ─── Avatar / initials helpers ────────────────────────────────────────────────
function Avatar({ user, size = 'lg' }) {
    const sizeClass = size === 'lg' ? 'w-32 h-32 text-4xl' : 'w-10 h-10 text-sm';
    const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'GW';

    if (user.profile_picture) {
        return (
            <img
                src={user.profile_picture}
                alt={user.name}
                className={`${sizeClass} rounded-full border-4 border-white shadow-md object-cover bg-white`}
            />
        );
    }

    return (
        <div className={`${sizeClass} rounded-full border-4 border-white shadow-md bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-bold`}>
            {initials}
        </div>
    );
}

// ─── Section Cards ─────────────────────────────────────────────────────────────
function Card({ children, className = '' }) {
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
            {children}
        </div>
    );
}

// ─── Stat Row ─────────────────────────────────────────────────────────────────
function StatRow({ icon, label, value, iconBg, iconColor }) {
    return (
        <div className="flex items-center gap-3">
            <div className={`p-2 ${iconBg} ${iconColor} rounded-lg`}>
                <span className="material-icons text-xl">{icon}</span>
            </div>
            <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
}

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ title, action }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">{title}</h3>
            {action}
        </div>
    );
}

function EditBtn({ onClick }) {
    return (
        <button
            onClick={onClick}
            className="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"
        >
            <span className="material-icons text-base">edit</span>
        </button>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GigWorkerProfile({ user, status }) {
    const skills = user.skills_with_experience || [];
    const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'GW';

    const [linkPreview, setLinkPreview] = useState({ data: null, loading: false, error: false });
    useEffect(() => {
        if (!user.portfolio_link) return;
        setLinkPreview((p) => ({ ...p, loading: true, error: false }));
        const url = encodeURIComponent(user.portfolio_link);
        fetch(`/api/link-preview?url=${url}`)
            .then((res) => res.json())
            .then((data) => setLinkPreview({ data, loading: false, error: !!data.error }))
            .catch(() => setLinkPreview((p) => ({ ...p, loading: false, error: true })));
    }, [user.portfolio_link]);

    const goToEdit = () => router.visit('/profile/gig-worker/edit');
    const goToOnboarding = () => router.visit(route('gig-worker.onboarding'));

    return (
        <AuthenticatedLayout>
            <Head title={`${user.name} – Profile`} />

            <div className="bg-slate-50 min-h-screen pb-16">
                {/* ─── Cover + Profile Hero ──────────────────────────────── */}
                <div className="bg-white border-b border-gray-100 shadow-sm mb-6">
                    {/* Cover banner */}
                    <div
                        className="h-48 relative"
                        style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #6366f1 100%)' }}
                    >
                        {/* Decorative circles */}
                        <div className="absolute top-6 right-12 w-32 h-32 rounded-full bg-white/5 border border-white/10" />
                        <div className="absolute -top-4 right-32 w-48 h-48 rounded-full bg-white/5 border border-white/10" />

                        {/* Public View toggle */}
                        {/* <div className="absolute top-4 right-4 flex items-center bg-black/30 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10 gap-2">
                            <span className="text-xs text-white font-medium">Public View</span>
                            <div className="w-8 h-4 bg-blue-500 rounded-full relative cursor-pointer">
                                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
                            </div>
                        </div> */}
                    </div>

                    {/* Profile info row */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 relative">
                        <div className="flex flex-col md:flex-row items-end md:items-center justify-between -mt-10 md:-mt-10 relative z-10">
                            {/* Left: avatar + name */}
                            <div className="flex flex-col md:flex-row items-center md:items-end gap-4">
                                <div className="relative">
                                    <Avatar user={user} size="lg" />
                                    <button
                                        onClick={goToEdit}
                                        className="absolute bottom-1 right-1 bg-white p-1.5 rounded-full shadow-sm border border-gray-100 text-gray-600 hover:text-blue-600 transition-colors"
                                    >
                                        <span className="material-icons text-base leading-none">photo_camera</span>
                                    </button>
                                </div>
                                <div className="text-center md:text-left mb-2 md:mb-0">
                                    <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center md:justify-start gap-2">
                                        {user.name}
                                        {user.profile_completed && (
                                            <span className="material-icons text-blue-500 text-xl" title="Verified">verified</span>
                                        )}
                                    </h1>
                                    <p className="text-gray-500 font-medium">
                                        {user.professional_title || 'Gig Worker'}
                                    </p>
                                    <p className="text-sm text-gray-400 flex items-center justify-center md:justify-start gap-1 mt-0.5">
                                        <span className="material-icons text-sm">mail_outline</span>
                                        {user.email}
                                    </p>
                                </div>
                            </div>

                            {/* Right: action buttons */}
                            <div className="flex gap-3 mt-4 md:mt-0">
                                <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2 shadow-sm">
                                    <span className="material-icons text-lg">share</span>
                                    Share
                                </button>
                                <button
                                    onClick={goToEdit}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm shadow-blue-500/30"
                                >
                                    <span className="material-icons text-lg">edit</span>
                                    Edit Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Main 3-column grid ─────────────────────────────────── */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* ── LEFT SIDEBAR ───────────────────────────────── */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Profile Stats */}
                            <Card className="p-5">
                                <SectionHeader title="Profile Stats" />
                                <div className="space-y-4">
                                    <StatRow icon="payments" label="Total Earned" value="₱0" iconBg="bg-green-50" iconColor="text-green-600" />
                                    <StatRow icon="work_history" label="Total Jobs" value="0" iconBg="bg-blue-50" iconColor="text-blue-600" />
                                    <StatRow icon="schedule" label="Total Hours" value="0" iconBg="bg-purple-50" iconColor="text-purple-600" />
                                </div>
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-500">Job Success</span>
                                        <span className="text-sm font-bold text-gray-900">—</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }} />
                                    </div>
                                </div>
                            </Card>

                            {/* Hourly Rate */}
                            <Card className="p-5">
                                <div className="mb-5">
                                    <SectionHeader
                                        title="Hourly Rate"
                                        action={<EditBtn onClick={goToEdit} />}
                                    />
                                    <p className="text-2xl font-bold text-gray-900">
                                        {user.hourly_rate
                                            ? <>₱{Number(user.hourly_rate).toFixed(2)} <span className="text-sm font-normal text-gray-500">/hr</span></>
                                            : <span className="text-gray-400 text-base font-normal">Not set</span>
                                        }
                                    </p>
                                </div>

                                <div>
                                    <SectionHeader
                                        title="Availability"
                                        action={<EditBtn onClick={goToEdit} />}
                                    />
                                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                                        <span className="material-icons text-lg">bolt</span>
                                        <span className="font-medium">Available for work</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Response time: &lt; 24 hours</p>
                                </div>
                            </Card>

                            {/* Resume */}
                            {user.resume_file && (
                                <Card className="p-5">
                                    <SectionHeader title="Resume / CV" />
                                    <a
                                        href={user.resume_file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                                    >
                                        <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100">
                                            <span className="material-icons text-blue-500">description</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate">Download CV</p>
                                            <p className="text-xs text-gray-500">PDF / DOC</p>
                                        </div>
                                        <span className="material-icons text-gray-400 group-hover:text-blue-600">download</span>
                                    </a>
                                </Card>
                            )}

                            {/* Boost Profile CTA (if not completed) */}
                            {!user.profile_completed && (
                                <div
                                    className="rounded-xl p-5 text-white"
                                    style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)' }}
                                >
                                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                                        <span className="material-icons text-yellow-400">star</span>
                                        Boost Profile
                                    </h3>
                                    <p className="text-sm text-blue-100 mb-4">Complete your portfolio to increase visibility by 25%.</p>
                                    <button
                                        onClick={goToOnboarding}
                                        className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium transition"
                                    >
                                        Complete Setup
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ── CENTER COLUMN ──────────────────────────────── */}
                        <div className="lg:col-span-6 space-y-6">
                            {/* About Me */}
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-gray-900">About Me</h2>
                                    <EditBtn onClick={goToEdit} />
                                </div>
                                {user.bio ? (
                                    <div className="text-gray-600 text-sm leading-relaxed space-y-2">
                                        {user.bio.split('\n').map((para, i) => (
                                            <p key={i}>{para}</p>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <span className="material-icons text-4xl text-gray-200 mb-2">person_outline</span>
                                        <p className="text-sm text-gray-400">No bio yet.</p>
                                        <button onClick={goToEdit} className="mt-3 text-sm text-blue-600 hover:underline font-medium">Add your bio</button>
                                    </div>
                                )}
                            </Card>

                            {/* Work History placeholder */}
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold text-gray-900">Work History</h2>
                                    <button className="p-1 text-gray-400 hover:text-gray-600 transition">
                                        <span className="material-icons">filter_list</span>
                                    </button>
                                </div>
                                <div className="text-center py-10">
                                    <span className="material-icons text-5xl text-gray-200 mb-3">work_outline</span>
                                    <p className="text-sm font-medium text-gray-500">No completed jobs yet</p>
                                    <p className="text-xs text-gray-400 mt-1">Your completed work history will appear here.</p>
                                    <Link href={route('jobs.index')} className="mt-4 inline-block text-sm text-blue-600 hover:underline font-medium">
                                        Browse available jobs →
                                    </Link>
                                </div>
                            </Card>

                            {/* Portfolio */}
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold text-gray-900">Portfolio</h2>
                                    {user.portfolio_link && (
                                        <a
                                            href={user.portfolio_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            <span className="material-icons text-base">open_in_new</span>
                                            View Site
                                        </a>
                                    )}
                                </div>

                                {user.portfolio_link ? (
                                    <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                                        {linkPreview.loading ? (
                                            <div className="p-6 flex items-center justify-center gap-3 text-gray-500">
                                                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                                                <span className="text-sm">Loading preview…</span>
                                            </div>
                                        ) : linkPreview.error || !linkPreview.data ? (
                                            <a
                                                href={user.portfolio_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-4 rounded-xl border-0 bg-gray-50 hover:bg-blue-50 transition-colors group"
                                            >
                                                <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100">
                                                    <span className="material-icons text-blue-500 text-2xl">language</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">Portfolio Website</p>
                                                    <p className="text-xs text-gray-500 truncate">{user.portfolio_link}</p>
                                                </div>
                                                <span className="material-icons text-gray-400 group-hover:text-blue-600">arrow_forward</span>
                                            </a>
                                        ) : (
                                            <a
                                                href={user.portfolio_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block group"
                                            >
                                                {linkPreview.data.image && (
                                                    <div className="aspect-[2/1] w-full bg-gray-200 overflow-hidden">
                                                        <img
                                                            src={linkPreview.data.image}
                                                            alt=""
                                                            className="w-full h-full object-cover group-hover:opacity-95 transition-opacity"
                                                        />
                                                    </div>
                                                )}
                                                <div className="p-4">
                                                    {linkPreview.data.site_name && (
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">
                                                            {linkPreview.data.site_name}
                                                        </p>
                                                    )}
                                                    <p className="text-base font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-2">
                                                        {linkPreview.data.title || 'Portfolio Website'}
                                                    </p>
                                                    {linkPreview.data.description && (
                                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                            {linkPreview.data.description}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-500 mt-2 truncate">{user.portfolio_link}</p>
                                                    <span className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium mt-2 group-hover:underline">
                                                        Open portfolio
                                                        <span className="material-icons text-base">open_in_new</span>
                                                    </span>
                                                </div>
                                            </a>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <span className="material-icons text-5xl text-gray-200 mb-3">folder_open</span>
                                        <p className="text-sm text-gray-400">No portfolio link added.</p>
                                        <button onClick={goToEdit} className="mt-3 text-sm text-blue-600 hover:underline font-medium">Add portfolio link</button>
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* ── RIGHT SIDEBAR ─────────────────────────────── */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Top Skills */}
                            <Card className="p-5">
                                <SectionHeader
                                    title="Top Skills"
                                    action={<EditBtn onClick={goToEdit} />}
                                />
                                {skills.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {skills.map((sk, i) => {
                                            const c = colorFor(i);
                                            return (
                                                <div key={i} className="group relative">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${c.bg} ${c.text} border ${c.border}`}>
                                                        {sk.skill}
                                                    </span>
                                                    {sk.proficiency && (
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-gray-900 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                            {proficiencyLabel(sk.proficiency)}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-xs text-gray-400">No skills added.</p>
                                        <button onClick={goToEdit} className="mt-2 text-xs text-blue-600 hover:underline">Add skills</button>
                                    </div>
                                )}
                            </Card>

                            {/* Skills with proficiency */}
                            {skills.length > 0 && (
                                <Card className="p-5">
                                    <SectionHeader title="Expertise Levels" />
                                    <div className="space-y-3">
                                        {skills.slice(0, 6).map((sk, i) => {
                                            const pct = sk.proficiency === 'expert' ? 95 : sk.proficiency === 'intermediate' ? 65 : 35;
                                            const barColor = sk.proficiency === 'expert' ? 'bg-blue-600' : sk.proficiency === 'intermediate' ? 'bg-blue-400' : 'bg-blue-200';
                                            return (
                                                <div key={i}>
                                                    <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                                                        <span>{sk.skill}</span>
                                                        <span className="text-gray-400 capitalize">{sk.proficiency}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                        <div className={`${barColor} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            )}

                            {/* Languages placeholder */}
                            <Card className="p-5">
                                <SectionHeader
                                    title="Languages"
                                    action={<EditBtn onClick={goToEdit} />}
                                />
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-700">English</span>
                                        <span className="text-gray-500 text-xs bg-gray-100 px-2 py-0.5 rounded">Native</span>
                                    </div>
                                </div>
                            </Card>

                            {/* Linked Accounts */}
                            <Card className="p-5">
                                <SectionHeader title="Linked Accounts" />
                                <div className="space-y-4">
                                    {/* Portfolio as linked account */}
                                    {user.portfolio_link ? (
                                        <div className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white">
                                                    <span className="material-icons text-sm">language</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">Portfolio</p>
                                                    <p className="text-xs text-green-600 flex items-center gap-0.5">
                                                        <span className="material-icons text-xs">check_circle</span> Linked
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}

                                    {/* Add account button */}
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                                                <span className="material-icons text-lg">add</span>
                                            </div>
                                            <span className="text-sm text-gray-500">Link Account</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
