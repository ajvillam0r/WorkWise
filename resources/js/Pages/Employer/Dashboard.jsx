import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
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
            header={
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Browse Gig Workers
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Find talent by name, title, or skills
                        </p>
                    </div>
                    <Link
                        href={route('jobs.create')}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                    >
                        Post a Job
                    </Link>
                </div>
            }
        >
            <Head title="Browse Gig Workers - Employer Dashboard" />

            <div className="py-6 sm:py-8 bg-gray-50/50">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
                    {/* Global navigation: fixed-height container, content width */}
                    <div className="mb-6 w-full">
                        <nav
                            className="inline-flex flex-nowrap gap-1 p-1.5 bg-white rounded-lg border border-gray-200 shadow-sm min-h-[3.25rem] box-border"
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
                                        className={`flex items-center justify-center gap-2 min-h-[2.5rem] px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 whitespace-nowrap ${isActive
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Icon className="h-4 w-4 flex-shrink-0" />
                                        <span>{opt.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                        <p className="mt-2 text-sm text-gray-600 min-h-[1.25rem]">
                            {activeOption.detail}
                        </p>
                        {showBestMatchHint && (
                            <div className="mt-2 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 min-h-0 box-border w-full">
                                <InformationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <p className="min-w-0">
                                    Post a job and add required skills to see workers ranked by how well they match your needs.
                                    <Link href={route('jobs.create')} className="ml-1 font-medium underline hover:no-underline">
                                        Post a job
                                    </Link>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Search and filters bar: fixed-height container */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6 w-full box-border min-h-[4.5rem]">
                        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-4 lg:items-center lg:min-h-[2.75rem]">
                            <div className="flex-1 min-w-0 w-full lg:max-w-xl">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <MagnifyingGlassIcon className="h-5 w-5 flex-shrink-0" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by name, job title, or skills..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onBlur={() => search && applyFilters({ search })}
                                        className="block w-full min-w-0 pl-10 pr-3 py-2.5 h-11 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 min-h-[2.75rem]">
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowSkillDropdown(!showSkillDropdown)}
                                        className="inline-flex items-center h-11 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 whitespace-nowrap"
                                    >
                                        <FunnelIcon className="h-5 w-5 mr-2 text-gray-500 flex-shrink-0" />
                                        <span className="truncate">Skills</span>
                                        {selectedSkills.length > 0 && (
                                            <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                                                {selectedSkills.length}
                                            </span>
                                        )}
                                        <ChevronDownIcon className="h-4 w-4 ml-2 text-gray-400 flex-shrink-0" />
                                    </button>
                                    {showSkillDropdown && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowSkillDropdown(false)} />
                                            <div className="absolute left-0 mt-1 w-64 max-h-72 overflow-auto bg-white rounded-lg border border-gray-200 shadow-lg z-20 py-2">
                                                {selectedSkills.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={clearSkillFilter}
                                                        className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50"
                                                    >
                                                        Clear skills filter
                                                    </button>
                                                )}
                                                {skillOptions.length === 0 ? (
                                                    <p className="px-4 py-2 text-sm text-gray-500">No skills in database yet</p>
                                                ) : (
                                                    skillOptions.map((name) => (
                                                        <button
                                                            key={name}
                                                            type="button"
                                                            onClick={() => toggleSkill(name)}
                                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center truncate ${selectedSkills.includes(name) ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'}`}
                                                        >
                                                            {selectedSkills.includes(name) && (
                                                                <span className="mr-2 text-indigo-600 flex-shrink-0">✓</span>
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
                                    className="inline-flex items-center justify-center h-11 px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 whitespace-nowrap min-w-[5rem]"
                                >
                                    Search
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Results count: single line */}
                    <div className="mb-4 h-5 flex items-center text-sm text-gray-600">
                        {workers.total > 0
                            ? `Showing ${workers.data?.length ?? 0} of ${workers.total} gig workers`
                            : 'No gig workers found. Try adjusting search or filters.'}
                    </div>

                    {/* Worker cards grid: fixed card dimensions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
                        {(workers.data ?? []).map((worker) => (
                            <div
                                key={worker.id}
                                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col w-full h-[420px] min-h-[420px] max-h-[420px] hover:shadow-md hover:border-gray-300 transition-all duration-200"
                            >
                                <div className="p-5 flex flex-col flex-1 min-h-0 overflow-hidden">
                                    {/* Avatar + name: fixed height */}
                                    <div className="flex items-center gap-3 flex-shrink-0 h-16 min-h-[4rem]">
                                        {worker.profile_picture ? (
                                            <img
                                                src={worker.profile_picture}
                                                alt=""
                                                className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-gray-200"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                                <UserCircleIcon className="w-7 h-7 text-gray-400" />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1 overflow-hidden">
                                            <h3 className="text-base font-semibold text-gray-900 truncate">
                                                {worker.full_name}
                                            </h3>
                                            {worker.professional_title ? (
                                                <p className="text-sm font-medium text-indigo-600 truncate mt-0.5">
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
                                            <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed break-all">
                                                {worker.bio}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">No bio</p>
                                        )}
                                    </div>
                                    {/* Hourly + portfolio: fixed height */}
                                    <div className="mt-2 flex-shrink-0 h-6 overflow-hidden flex items-center">
                                        {(worker.hourly_rate != null && worker.hourly_rate !== '') || worker.portfolio_link ? (
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-0 text-sm text-gray-600 min-w-0 overflow-hidden">
                                                {worker.hourly_rate != null && worker.hourly_rate !== '' && (
                                                    <span className="inline-flex items-center gap-1 flex-shrink-0">
                                                        {/* <CurrencyDollarIcon className="h-4 w-4 text-indigo-500" /> */}
                                                        <span>₱{Number(worker.hourly_rate).toLocaleString()}/hr</span>
                                                    </span>
                                                )}
                                                {worker.portfolio_link && (
                                                    <a
                                                        href={worker.portfolio_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 truncate max-w-[10rem]"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <GlobeAltIcon className="h-4 w-4 flex-shrink-0" />
                                                        <span className="truncate">Portfolio</span>
                                                    </a>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400">—</span>
                                        )}
                                    </div>
                                    {/* Skills: fixed height, wrap with overflow hidden */}
                                    <div className="mt-3 flex-shrink-0 min-h-[2.5rem] max-h-[3rem] flex flex-wrap gap-1.5 items-center overflow-hidden">
                                        {worker.skills?.length > 0 ? (
                                            <>
                                                {worker.skills.slice(0, 6).map((skill) => (
                                                    <span
                                                        key={skill}
                                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 truncate max-w-[8rem]"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                                {worker.skills.length > 6 && (
                                                    <span className="text-xs text-gray-400 flex-shrink-0">+{worker.skills.length - 6}</span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-xs text-gray-400">No skills listed</span>
                                        )}
                                    </div>
                                    {/* Spacer to push button down */}
                                    <div className="flex-1 min-h-2" />
                                    {/* Button: fixed at bottom, no overlap */}
                                    <div className="flex-shrink-0 pt-4 mt-auto border-t border-gray-100">
                                        <Link
                                            href={worker.profile_url}
                                            className="inline-flex items-center justify-center w-full h-11 px-4 py-2.5 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                            <p className="text-sm text-gray-600">
                                Page {workers.current_page} of {workers.last_page}
                            </p>
                            <div className="flex gap-2">
                                {workers.prev_page_url && (
                                    <Link
                                        href={workers.prev_page_url}
                                        className="inline-flex items-center justify-center px-4 py-2 h-10 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 min-w-[5rem]"
                                    >
                                        Previous
                                    </Link>
                                )}
                                {workers.next_page_url && (
                                    <Link
                                        href={workers.next_page_url}
                                        className="inline-flex items-center justify-center px-4 py-2 h-10 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 min-w-[5rem]"
                                    >
                                        Next
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
