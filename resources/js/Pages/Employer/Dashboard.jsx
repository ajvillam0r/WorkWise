import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import IDVerificationBanner from '@/Components/IDVerificationBanner';
import { Head, Link, router } from '@inertiajs/react';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    UserCircleIcon,
    ChevronDownIcon,
    SparklesIcon,
    ClockIcon,
    ChartBarIcon,
    LinkIcon,
    CurrencyDollarIcon,
    GlobeAltIcon,
    InformationCircleIcon,
} from '@heroicons/react/24/outline';

function safeRoute(name, fallback = '/') {
    try {
        return route(name);
    } catch {
        return fallback;
    }
}

const SORT_OPTIONS = [
    {
        value: 'best_match',
        label: 'Best for Me',
        icon: SparklesIcon,
        description: 'Workers who match skills from your posted jobs',
        detail: 'Ranked by how many of your job’s required skills they have in their profile.',
    },
    {
        value: 'latest_registered',
        label: 'Latest Registered',
        icon: ClockIcon,
        description: 'Newest gig workers first',
        detail: 'Sorted by registration date from the database.',
    },
    {
        value: 'most_relevant',
        label: 'Most Relevant',
        icon: ChartBarIcon,
        description: 'Top rated & most experienced',
        detail: 'Ranked by average review rating and completed projects.',
    },
];

export default function EmployerDashboard({ auth, workers, filterOptions = {}, filters = {}, bestMatchHasSkills = false }) {
    const skillOptions = filterOptions?.skills ?? [];
    const [search, setSearch] = useState(filters?.search ?? '');
    const [selectedSkills, setSelectedSkills] = useState(Array.isArray(filters?.skills) ? filters.skills : []);
    const [sort, setSort] = useState(filters?.sort ?? 'latest_registered');
    const [showSkillDropdown, setShowSkillDropdown] = useState(false);

    useEffect(() => {
        setSearch(filters?.search ?? '');
        setSelectedSkills(Array.isArray(filters?.skills) ? filters.skills : []);
        setSort(filters?.sort ?? 'latest_registered');
    }, [filters?.search, filters?.skills, filters?.sort]);

    const applyFilters = (overrides = {}) => {
        const params = {
            search: overrides.search !== undefined ? overrides.search : search,
            skills: overrides.skills !== undefined ? overrides.skills : selectedSkills,
            sort: overrides.sort !== undefined ? overrides.sort : sort,
        };
        router.get(route('employer.dashboard'), {
            search: params.search || undefined,
            'skills[]': params.skills?.length ? params.skills : undefined,
            sort: params.sort,
        }, { preserveState: true });
    };

    const handleSearchSubmit = (e) => {
        e?.preventDefault();
        applyFilters({ search });
    };

    const toggleSkill = (skillName) => {
        const next = selectedSkills.includes(skillName)
            ? selectedSkills.filter((s) => s !== skillName)
            : [...selectedSkills, skillName];
        setSelectedSkills(next);
        applyFilters({ skills: next });
    };

    const clearSkillFilter = () => {
        setSelectedSkills([]);
        applyFilters({ skills: [] });
    };

    const currentSort = filters?.sort ?? 'latest_registered';
    const activeOption = SORT_OPTIONS.find((o) => o.value === currentSort) ?? SORT_OPTIONS[1];
    const showBestMatchHint = currentSort === 'best_match' && !bestMatchHasSkills;

    return (
        <AuthenticatedLayout
            pageTheme="dark"
            header={
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-white tracking-tight">
                            Find Gig Workers
                        </h2>
                        <p className="text-sm text-white/60 mt-1">
                            Find talent by name, title, or skills
                        </p>
                    </div>
                    <Link
                        href={route('jobs.create')}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-600/20 transition-colors"
                    >
                        Post a Job
                    </Link>
                </div>
            }
        >
            <Head title="Browse Gig Workers - Employer Dashboard">
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            </Head>

            <div className="min-h-screen bg-[#05070A] font-sans" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-blue-600/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-blue-500/5 rounded-full blur-[100px]" />
                </div>

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
                    {auth?.user?.profile_completed && (auth?.user?.id_verification_status?.status ?? auth?.user?.id_verification_status) !== 'verified' && (
                        <IDVerificationBanner
                            message="Complete Valid ID verification to build trust with gig workers and use all platform features."
                            buttonText="Verify your ID"
                            linkUrl={route('id-verification.show')}
                            variant="info"
                            dismissible={true}
                        />
                    )}
                    {/* Global navigation: fixed-height container, content width */}
                    <div className="mb-6 w-full">
                        <nav
                            className="inline-flex flex-nowrap gap-1 p-1.5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm min-h-[3.25rem] box-border"
                            aria-label="Sort gig workers"
                        >
                            {SORT_OPTIONS.map((opt) => {
                                const isActive = currentSort === opt.value;
                                const Icon = opt.icon;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => router.get(route('employer.dashboard'), {
                                            search: filters?.search || undefined,
                                            'skills[]': (filters?.skills?.length && filters.skills) || undefined,
                                            sort: opt.value,
                                        }, { preserveState: true })}
                                        className={`flex items-center justify-center gap-2 min-h-[2.5rem] px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${isActive
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                                            : 'text-white/60 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <Icon className="h-4 w-4 flex-shrink-0" />
                                        <span>{opt.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                        <p className="mt-2 text-sm text-white/40 min-h-[1.25rem]">
                            {activeOption.detail}
                        </p>
                        {showBestMatchHint && (
                            <div className="mt-2 flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-sm text-blue-200 min-h-0 box-border w-full">
                                <InformationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5 text-blue-400" />
                                <p className="min-w-0">
                                    Post a job and add required skills to see workers ranked by how well they match your needs.
                                    <Link href={route('jobs.create')} className="ml-1 font-medium text-blue-400 hover:text-blue-300 transition-colors">
                                        Post a job
                                    </Link>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Search and filters bar: fixed-height container */}
                    <div className="bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm p-4 mb-6 w-full box-border min-h-[4.5rem]">
                        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-4 lg:items-center lg:min-h-[2.75rem]">
                            <div className="flex-1 min-w-0 w-full lg:max-w-xl">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                                        <MagnifyingGlassIcon className="h-5 w-5 flex-shrink-0" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by name, job title, or skills..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onBlur={() => search && applyFilters({ search })}
                                        className="block w-full min-w-0 pl-10 pr-3 py-2.5 h-11 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 min-h-[2.75rem]">
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowSkillDropdown(!showSkillDropdown)}
                                        className="inline-flex items-center h-11 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#05070A] whitespace-nowrap transition-colors"
                                    >
                                        <FunnelIcon className="h-5 w-5 mr-2 text-white/60 flex-shrink-0" />
                                        <span className="truncate">Skills</span>
                                        {selectedSkills.length > 0 && (
                                            <span className="ml-2 bg-blue-500/20 text-blue-300 text-xs px-2 py-0.5 rounded-full flex-shrink-0 border border-blue-500/30">
                                                {selectedSkills.length}
                                            </span>
                                        )}
                                        <ChevronDownIcon className="h-4 w-4 ml-2 text-white/40 flex-shrink-0" />
                                    </button>
                                    {showSkillDropdown && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowSkillDropdown(false)} />
                                            <div className="absolute left-0 mt-1 w-64 max-h-72 overflow-auto bg-[#0A0D12] rounded-xl border border-white/10 shadow-xl z-20 py-2 backdrop-blur-xl">
                                                {selectedSkills.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={clearSkillFilter}
                                                        className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-white/5 transition-colors"
                                                    >
                                                        Clear skills filter
                                                    </button>
                                                )}
                                                {skillOptions.length === 0 ? (
                                                    <p className="px-4 py-2 text-sm text-white/40">No skills in database yet</p>
                                                ) : (
                                                    skillOptions.map((name) => (
                                                        <button
                                                            key={name}
                                                            type="button"
                                                            onClick={() => toggleSkill(name)}
                                                            className={`w-full text-left px-4 py-2 text-sm flex items-center truncate transition-colors ${selectedSkills.includes(name) ? 'bg-blue-500/10 text-blue-300 font-medium' : 'text-white/70 hover:bg-white/5'}`}
                                                        >
                                                            {selectedSkills.includes(name) && (
                                                                <span className="mr-2 text-blue-400 flex-shrink-0">✓</span>
                                                            )}
                                                            <span className="truncate">{name}</span>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    className="inline-flex items-center justify-center h-11 px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-[#05070A] whitespace-nowrap min-w-[5rem] transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    Search
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Results count: single line */}
                    <div className="mb-4 h-5 flex items-center text-sm text-white/50">
                        {workers.total > 0
                            ? `Showing ${workers.data?.length ?? 0} of ${workers.total} gig workers`
                            : 'No gig workers found. Try adjusting search or filters.'}
                    </div>

                    {/* Worker cards grid: fixed card dimensions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
                        {(workers.data ?? []).map((worker) => (
                            <div
                                key={worker.id}
                                className="bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm overflow-hidden flex flex-col w-full h-[420px] min-h-[420px] max-h-[420px] hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-200"
                            >
                                <div className="p-5 flex flex-col flex-1 min-h-0 overflow-hidden">
                                    {/* Avatar + name: fixed height */}
                                    <div className="flex items-center gap-3 flex-shrink-0 h-16 min-h-[4rem]">
                                        {worker.profile_picture ? (
                                            <img
                                                src={worker.profile_picture}
                                                alt=""
                                                className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-white/10"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/10">
                                                <UserCircleIcon className="w-7 h-7 text-white/40" />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1 overflow-hidden">
                                            <h3 className="text-base font-semibold text-white truncate">
                                                {worker.full_name}
                                            </h3>
                                            {worker.professional_title ? (
                                                <p className="text-sm font-medium text-blue-400 truncate mt-0.5">
                                                    {worker.professional_title}
                                                </p>
                                            ) : (
                                                <div className="h-5" />
                                            )}
                                        </div>
                                    </div>
                                    {/* Bio: fixed height, clamped */}
                                    <div className="mt-3 flex-shrink-0 h-[4rem] overflow-hidden">
                                        {worker.bio ? (
                                            <p className="text-sm text-white/60 line-clamp-3 leading-relaxed break-all">
                                                {worker.bio}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-white/30 italic">No bio</p>
                                        )}
                                    </div>
                                    {/* Hourly + portfolio: fixed height */}
                                    <div className="mt-2 flex-shrink-0 h-6 overflow-hidden flex items-center">
                                        {(worker.hourly_rate != null && worker.hourly_rate !== '') || worker.portfolio_link ? (
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-0 text-sm text-white/60 min-w-0 overflow-hidden">
                                                {worker.hourly_rate != null && worker.hourly_rate !== '' && (
                                                    <span className="inline-flex items-center gap-1 flex-shrink-0">
                                                        <span>₱{Number(worker.hourly_rate).toLocaleString()}/hr</span>
                                                    </span>
                                                )}
                                                {worker.portfolio_link && (
                                                    <a
                                                        href={worker.portfolio_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 truncate max-w-[10rem] transition-colors"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <GlobeAltIcon className="h-4 w-4 flex-shrink-0" />
                                                        <span className="truncate">Portfolio</span>
                                                    </a>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-white/30">—</span>
                                        )}
                                    </div>
                                    {/* Skills: fixed height, wrap with overflow hidden */}
                                    <div className="mt-3 flex-shrink-0 min-h-[2.5rem] max-h-[3rem] flex flex-wrap gap-1.5 items-center overflow-hidden">
                                        {worker.skills?.length > 0 ? (
                                            <>
                                                {worker.skills.slice(0, 6).map((skill) => (
                                                    <span
                                                        key={skill}
                                                        className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20 truncate max-w-[8rem]"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                                {worker.skills.length > 6 && (
                                                    <span className="text-xs text-white/40 flex-shrink-0">+{worker.skills.length - 6}</span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-xs text-white/30">No skills listed</span>
                                        )}
                                    </div>
                                    {/* Spacer to push button down */}
                                    <div className="flex-1 min-h-2" />
                                    {/* Button: fixed at bottom, no overlap */}
                                    <div className="flex-shrink-0 pt-4 mt-auto border-t border-white/10">
                                        <Link
                                            href={worker.profile_url}
                                            className="inline-flex items-center justify-center w-full h-11 px-4 py-2.5 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-[#05070A] transition-colors shadow-lg shadow-blue-600/20"
                                        >
                                            <LinkIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                                            <span>View Profile</span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination: fixed height row */}
                    {workers.data?.length > 0 && (workers.prev_page_url || workers.next_page_url) && (
                        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 min-h-[2.75rem] py-2">
                            <p className="text-sm text-white/50">
                                Page {workers.current_page} of {workers.last_page}
                            </p>
                            <div className="flex gap-2">
                                {workers.prev_page_url && (
                                    <Link
                                        href={workers.prev_page_url}
                                        className="inline-flex items-center justify-center px-4 py-2 h-10 bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 min-w-[5rem] transition-colors"
                                    >
                                        Previous
                                    </Link>
                                )}
                                {workers.next_page_url && (
                                    <Link
                                        href={workers.next_page_url}
                                        className="inline-flex items-center justify-center px-4 py-2 h-10 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 min-w-[5rem] shadow-lg shadow-blue-600/20 transition-colors"
                                    >
                                        Next
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Footer (same as Find Jobs page) */}
                    <div className="mt-10 -mx-4 sm:-mx-6 lg:-mx-8">
                        <div className="bg-[#05070A] px-4 sm:px-6 lg:px-8 py-8">
                            <div className="max-w-7xl mx-auto">
                                <footer className="border-t border-white/5 pt-8">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                                        <div>
                                            <h3 className="text-xl font-black text-white mb-3">WorkWise</h3>
                                            <p className="text-white/40 text-sm leading-relaxed">
                                                The future of work, powered by elite intelligence and seamless collaboration.
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-white mb-3 uppercase tracking-widest text-xs">For Talent</h4>
                                            <ul className="space-y-2 text-white/40 text-sm">
                                                <li><Link href="/jobs" className="hover:text-blue-500 transition-colors">Browse Gigs</Link></li>
                                                <li><Link href="/ai/recommendations" className="hover:text-blue-500 transition-colors">AI Recommendations</Link></li>
                                                <li><Link href={safeRoute('role.selection')} className="hover:text-blue-500 transition-colors">Join as Expert</Link></li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-white mb-3 uppercase tracking-widest text-xs">For Companies</h4>
                                            <ul className="space-y-2 text-white/40 text-sm">
                                                <li><Link href="/freelancers" className="hover:text-blue-500 transition-colors">Find Experts</Link></li>
                                                <li><Link href="/jobs/create" className="hover:text-blue-500 transition-colors">Post a Project</Link></li>
                                                <li><Link href={safeRoute('role.selection')} className="hover:text-blue-500 transition-colors">Scale Your Team</Link></li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-white mb-3 uppercase tracking-widest text-xs">Platform</h4>
                                            <ul className="space-y-2 text-white/40 text-sm">
                                                <li><Link href="/help" className="hover:text-blue-500 transition-colors">Help Center</Link></li>
                                                <li><Link href="/about" className="hover:text-blue-500 transition-colors">Our Vision</Link></li>
                                                <li><Link href="/privacy" className="hover:text-blue-500 transition-colors">Privacy</Link></li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="border-t border-white/5 py-5 text-center text-white/20 text-sm font-medium">
                                        <p>&copy; 2024 WorkWise. Built for the Next Generation.</p>
                                    </div>
                                </footer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
