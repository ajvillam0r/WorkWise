import React, { useState, useMemo } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDistanceToNow } from 'date-fns';
import Pagination from '@/Components/Pagination';
import usePagination from '@/Hooks/usePagination';
import { MagnifyingGlassIcon, FunnelIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

function safeRoute(name, fallback = '/') {
    try {
        return route(name);
    } catch {
        return fallback;
    }
}

export default function JobsIndex({ jobs, availableSkills = [] }) {
    const { auth } = usePage().props;
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        experience: 'all',
        budgetMin: '',
        budgetMax: '',
        skills: [],
    });
    const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        jobId: null,
        action: null,
        title: '',
        message: '',
        confirmText: '',
        confirmColor: 'red'
    });

    const isEmployer = auth.user?.user_type === 'employer';

    const experienceOptions = [
        { label: 'All experience levels', value: 'all' },
        { label: 'Beginner', value: 'beginner' },
        { label: 'Intermediate', value: 'intermediate' },
        { label: 'Expert', value: 'expert' },
    ];

    const normalizedSelectedSkills = useMemo(
        () => filters.skills.map((skill) => skill.toLowerCase()),
        [filters.skills]
    );

    const budgetFilter = useMemo(() => {
        const parseBudgetValue = (value) => {
            if (value === '' || value === null || value === undefined) {
                return null;
            }
            if (typeof value === 'number') {
                return Number.isFinite(value) ? value : null;
            }
            const numeric = parseFloat(value);
            return Number.isFinite(numeric) ? numeric : null;
        };
        return {
            min: parseBudgetValue(filters.budgetMin),
            max: parseBudgetValue(filters.budgetMax),
        };
    }, [filters.budgetMin, filters.budgetMax]);

    const [processing, setProcessing] = useState(false);

    // Parse legacy comma-separated skills
    const parseSkills = (skillsReq) => {
        if (!skillsReq) return [];
        if (Array.isArray(skillsReq)) return skillsReq;
        if (typeof skillsReq === 'string') {
            try {
                // Try to parse as JSON first (to catch arrays stored as strings)
                const parsed = JSON.parse(skillsReq);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {
                // Not JSON, treat as comma-separated string
                return skillsReq.split(',').map(s => s.trim()).filter(Boolean);
            }
        }
        return [];
    };

    // Safe parsing for structured skills
    const getStructuredSkills = (skillsRaw) => {
        if (!skillsRaw) return [];
        if (Array.isArray(skillsRaw)) return skillsRaw;
        if (typeof skillsRaw === 'string') {
            try {
                const parsed = JSON.parse(skillsRaw);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                return [];
            }
        }
        return [];
    };

    // Client-side filtering functions (fast, no API calls)
    const matchesSearch = (job) => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        const titleMatch = job.title?.toLowerCase().includes(searchLower);
        const descMatch = job.description?.toLowerCase().includes(searchLower);

        // Check structured skills first, then fallback to legacy
        let skillsMatch = false;
        const structuredSkills = getStructuredSkills(job.skills_requirements);
        if (structuredSkills.length > 0) {
            skillsMatch = structuredSkills.some(s =>
                s.skill?.toLowerCase().includes(searchLower)
            );
        } else {
            skillsMatch = parseSkills(job.required_skills).some(skill =>
                skill.toLowerCase().includes(searchLower)
            );
        }

        return titleMatch || descMatch || skillsMatch;
    };

    const matchesExperience = (value) => {
        if (filters.experience === 'all') return true;
        if (!value) return false;
        return value.toLowerCase() === filters.experience;
    };

    const matchesSkillFilter = (skillSet) => {
        if (!normalizedSelectedSkills.length) return true;
        const jobSkills = parseSkills(skillSet);
        if (!Array.isArray(jobSkills) || jobSkills.length === 0) return false;

        const normalizedJobSkills = jobSkills
            .map((skill) => typeof skill === 'string' ? skill.toLowerCase() : '')
            .filter((skill) => skill.length > 0);

        if (normalizedJobSkills.length === 0) return false;

        return normalizedSelectedSkills.every((skill) =>
            normalizedJobSkills.includes(skill)
        );
    };

    const jobBudgetMatches = (minValue, maxValue) => {
        if (budgetFilter.min === null && budgetFilter.max === null) return true;

        const jobMin = minValue !== undefined ? minValue : null;
        const jobMax = maxValue !== undefined ? maxValue : null;

        const normalizedMin = jobMin === null || jobMin === '' || jobMin === undefined
            ? null
            : Number.isFinite(jobMin) ? jobMin : Number.isFinite(parseFloat(jobMin)) ? parseFloat(jobMin) : null;

        const normalizedMax = jobMax === null || jobMax === '' || jobMax === undefined
            ? null
            : Number.isFinite(jobMax) ? jobMax : Number.isFinite(parseFloat(jobMax)) ? parseFloat(jobMax) : null;

        if (normalizedMin === null && normalizedMax === null) return true;

        const rangeMin = normalizedMin ?? normalizedMax;
        const rangeMax = normalizedMax ?? normalizedMin;

        if (rangeMin === null && rangeMax === null) return true;

        if (budgetFilter.min !== null && rangeMax !== null && rangeMax < budgetFilter.min) {
            return false;
        }

        if (budgetFilter.max !== null && rangeMin !== null && rangeMin > budgetFilter.max) {
            return false;
        }

        return true;
    };

    const handleBudgetChange = (key) => (event) => {
        const { value } = event.target;
        setFilters((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const toggleSkillSelection = (skill) => {
        setFilters((current) => {
            const alreadySelected = current.skills.some(
                (selectedSkill) => selectedSkill.toLowerCase() === skill.toLowerCase()
            );
            return {
                ...current,
                skills: alreadySelected
                    ? current.skills.filter((selectedSkill) => selectedSkill.toLowerCase() !== skill.toLowerCase())
                    : [...current.skills, skill],
            };
        });
    };

    const clearFilters = () => {
        setSearch('');
        setFilters({
            experience: 'all',
            budgetMin: '',
            budgetMax: '',
            skills: [],
        });
        setIsSkillDropdownOpen(false);
    };

    const hasActiveFilters = useMemo(
        () =>
            search !== '' ||
            filters.experience !== 'all' ||
            filters.budgetMin !== '' ||
            filters.budgetMax !== '' ||
            filters.skills.length > 0,
        [search, filters]
    );

    // Fast client-side filtering with useMemo
    const filteredJobs = useMemo(() => {
        if (!jobs.data) return [];

        return jobs.data.filter((job) => {
            if (!matchesSearch(job)) return false;
            if (!matchesExperience(job.experience_level)) return false;
            if (!jobBudgetMatches(job.budget_min, job.budget_max)) return false;
            if (!matchesSkillFilter(job.required_skills)) return false;
            return true;
        });
    }, [jobs.data, search, filters, normalizedSelectedSkills, budgetFilter]);

    // Pagination for filtered jobs (5 items per page)
    const {
        currentPage,
        totalPages,
        currentItems: paginatedJobs,
        goToPage,
        shouldShowPagination,
        totalItems,
        itemsPerPage,
    } = usePagination(filteredJobs, 5);

    const formatAmount = (value) => {
        const number = Number(value ?? 0);
        return number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const getBudgetDisplay = (job) => {
        if (job.budget_type === 'fixed') {
            return `₱${formatAmount(job.budget_min)} - ₱${formatAmount(job.budget_max)}`;
        }
        return `₱${formatAmount(job.budget_min)} - ₱${formatAmount(job.budget_max)}/hr`;
    };

    const getExperienceBadge = (level) => {
        const badges = {
            beginner: 'bg-green-100 text-green-800',
            intermediate: 'bg-blue-100 text-blue-800',
            expert: 'bg-purple-100 text-purple-800'
        };
        return badges[level] || 'bg-gray-100 text-gray-800';
    };

    const getStatusBadge = (status) => {
        const badges = {
            open: 'bg-green-100 text-green-800',
            in_progress: 'bg-blue-100 text-blue-800',
            completed: 'bg-gray-100 text-gray-800',
            cancelled: 'bg-red-100 text-red-800',
            closed: 'bg-gray-100 text-gray-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    const handleDeleteJob = (jobId) => {
        setConfirmModal({
            isOpen: true,
            jobId: jobId,
            action: 'delete',
            title: 'Delete Job',
            message: 'Are you sure you want to delete this job? This action cannot be undone and all proposals will be lost.',
            confirmText: 'Delete Job',
            confirmColor: 'red'
        });
    };

    const handleCloseJob = (jobId) => {
        setConfirmModal({
            isOpen: true,
            jobId: jobId,
            action: 'close',
            title: 'Close Job',
            message: 'Are you sure you want to close this job? This will prevent new proposals from being submitted.',
            confirmText: 'Close Job',
            confirmColor: 'yellow'
        });
    };

    const confirmAction = () => {
        setProcessing(true);
        if (confirmModal.action === 'delete') {
            router.delete(route('jobs.destroy', confirmModal.jobId), {
                onSuccess: () => {
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    setProcessing(false);
                    router.reload();
                },
                onError: () => {
                    setProcessing(false);
                }
            });
        } else if (confirmModal.action === 'close') {
            router.patch(route('jobs.update', confirmModal.jobId),
                { status: 'closed' },
                {
                    onSuccess: () => {
                        setConfirmModal({ ...confirmModal, isOpen: false });
                        setProcessing(false);
                        router.reload();
                    },
                    onError: () => {
                        setProcessing(false);
                    }
                }
            );
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            {isEmployer ? 'My Posted Jobs' : 'Browse Jobs'}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {isEmployer
                                ? 'Manage your job postings and review proposals'
                                : 'Find your next gig work opportunity'
                            }
                        </p>
                    </div>
                    {isEmployer && (
                        <Link
                            href={route('jobs.create')}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        >
                            + Post New Job
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={isEmployer ? 'My Jobs' : 'Browse Jobs'} />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&display=swap" rel="stylesheet" />

            <div className="relative py-12 bg-white overflow-x-hidden">
                {/* Animated Background Shapes */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

                <div className="relative z-20 max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Gig Worker View: search bar + filters (same style as employer dashboard), no sidebar */}
                    {!isEmployer ? (
                        <>
                            {/* Search and filters bar - one line next to search */}
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6 w-full box-border overflow-visible">
                                <form
                                    onSubmit={(e) => e.preventDefault()}
                                    className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center"
                                >
                                    {/* Search + filters on one line */}
                                    <div className="flex-1 min-w-0 relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <MagnifyingGlassIcon className="h-5 w-5 flex-shrink-0" />
                                        </div>
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Title, skills, description..."
                                            className="block w-full min-w-0 pl-10 pr-3 py-2.5 h-11 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
                                        {/* Experience Level */}
                                        <select
                                            value={filters.experience}
                                            onChange={(e) => setFilters((current) => ({ ...current, experience: e.target.value }))}
                                            className="h-11 rounded-lg border border-gray-300 pl-3 pr-8 py-2 text-sm text-gray-700 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[13rem]"
                                        >
                                            {experienceOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {/* Skills dropdown */}
                                        <div className="relative z-[60]">
                                            <button
                                                type="button"
                                                onClick={() => setIsSkillDropdownOpen((open) => !open)}
                                                className="inline-flex items-center h-11 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap"
                                            >
                                                <FunnelIcon className="h-5 w-5 mr-2 text-gray-500 flex-shrink-0" />
                                                Skills
                                                {filters.skills.length > 0 && (
                                                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                                                        {filters.skills.length}
                                                    </span>
                                                )}
                                                <ChevronDownIcon className="h-4 w-4 ml-2 text-gray-400 flex-shrink-0" />
                                            </button>
                                            {isSkillDropdownOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-[55]" onClick={() => setIsSkillDropdownOpen(false)} aria-hidden="true" />
                                                    <div className="absolute left-0 top-full mt-1 w-64 max-h-72 overflow-auto bg-white rounded-lg border border-gray-200 shadow-lg z-[60] py-2">
                                                        {filters.skills.length > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setFilters((current) => ({ ...current, skills: [] }))}
                                                                className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                                                            >
                                                                Clear skills
                                                            </button>
                                                        )}
                                                        {availableSkills.length === 0 ? (
                                                            <p className="px-4 py-2 text-sm text-gray-500">No skills available yet</p>
                                                        ) : (
                                                            availableSkills.map((skill) => {
                                                                const isSelected = filters.skills.some(
                                                                    (s) => s.toLowerCase() === skill.toLowerCase()
                                                                );
                                                                return (
                                                                    <button
                                                                        key={skill}
                                                                        type="button"
                                                                        onClick={() => toggleSkillSelection(skill)}
                                                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center truncate ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                                                                    >
                                                                        {isSelected && (
                                                                            <span className="mr-2 text-blue-600 flex-shrink-0">✓</span>
                                                                        )}
                                                                        <span className="truncate">{skill}</span>
                                                                    </button>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        {hasActiveFilters && (
                                            <button
                                                type="button"
                                                onClick={clearFilters}
                                                className="inline-flex items-center h-11 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                            >
                                                Reset
                                            </button>
                                        )}
                                        <Link
                                            href={safeRoute('ai.recommendations.gigworker', safeRoute('ai.recommendations', '/ai/recommendations'))}
                                            className="inline-flex items-center h-11 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            AI Recommendations
                                        </Link>
                                    </div>
                                </form>
                            </div>

                            {/* Main content: jobs list (no sidebar) */}
                            <div>
                                {/* Jobs List */}
                                {filteredJobs.length === 0 ? (
                                    <div className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-lg sm:rounded-xl border border-gray-200">
                                        <div className="p-16 text-center">
                                            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM16 10h.01M12 14h.01M8 14h.01M8 10h.01" />
                                                </svg>
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                                No Jobs Found
                                            </h3>
                                            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto leading-relaxed">
                                                Try adjusting your search criteria or check back later for new opportunities.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {paginatedJobs.map((job) => (
                                            <div key={job.id} className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-lg sm:rounded-xl border border-gray-200">
                                                <div className="p-8">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center space-x-4 mb-4">
                                                                <h3 className="text-xl font-bold text-gray-900">
                                                                    <Link
                                                                        href={`/jobs/${job.id}`}
                                                                        className="hover:text-blue-600 transition-colors duration-300"
                                                                    >
                                                                        {job.title}
                                                                    </Link>
                                                                </h3>
                                                                <span className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold shadow-md ${getStatusBadge(job.status)}`}>
                                                                    {job.status === 'open' ? 'Open' : job.status.replace('_', ' ')}
                                                                </span>
                                                            </div>

                                                            <p className="text-gray-700 text-lg mb-6 line-clamp-3 break-all leading-relaxed">
                                                                {job.description}
                                                            </p>

                                                            <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100 mb-6">
                                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                                                    <div>
                                                                        <div className="text-sm font-medium text-blue-600 mb-1">Budget</div>
                                                                        <div className="font-bold text-green-600 text-lg">
                                                                            {getBudgetDisplay(job)}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-medium text-blue-600 mb-1">Duration</div>
                                                                        <div className="font-bold text-gray-900 text-lg">
                                                                            {job.estimated_duration_days} days
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-medium text-blue-600 mb-1">Experience</div>
                                                                        <span className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold shadow-md ${getExperienceBadge(job.experience_level)}`}>
                                                                            {job.experience_level}
                                                                        </span>
                                                                    </div>
                                                                    {(job.is_remote || job.location) && (
                                                                        <div>
                                                                            <div className="text-sm font-medium text-blue-600 mb-1">Location</div>
                                                                            <div className="font-bold text-gray-900 text-lg">
                                                                                {job.is_remote ? '🌐 Remote' : `📍 ${job.location}`}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="mb-6">
                                                                <div className="text-sm font-medium text-blue-600 mb-3">Required Skills</div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {/* Show structured skills if available */}
                                                                    {getStructuredSkills(job?.skills_requirements).length > 0 ? (
                                                                        <>
                                                                            {getStructuredSkills(job.skills_requirements)
                                                                                .filter(s => s.importance === 'required')
                                                                                .slice(0, 5)
                                                                                .map((skill, index) => (
                                                                                    <div key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 shadow-sm hover:shadow-md transition-all duration-200">
                                                                                        <span>{skill.skill}</span>
                                                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getExperienceBadge(skill.experience_level)}`}>
                                                                                            {skill.experience_level?.charAt(0).toUpperCase() || ''}
                                                                                        </span>
                                                                                    </div>
                                                                                ))}
                                                                            {getStructuredSkills(job.skills_requirements).filter(s => s.importance === 'required').length > 5 && (
                                                                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600" title={`+${getStructuredSkills(job.skills_requirements).filter(s => s.importance === 'required').length - 5} more skills`}>
                                                                                    +{getStructuredSkills(job.skills_requirements).filter(s => s.importance === 'required').length - 5} more
                                                                                </span>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        /* Fallback to legacy required_skills */
                                                                        parseSkills(job?.required_skills || []).slice(0, 5).map((skill, index) => (
                                                                            <span key={index} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 shadow-sm hover:shadow-md transition-all duration-200">
                                                                                {skill}
                                                                            </span>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                                    <span>
                                                                        Posted by:
                                                                        <span className="font-medium ml-1">
                                                                            {job.employer ? `${job.employer.first_name} ${job.employer.last_name}` : 'Employer'}
                                                                        </span>
                                                                    </span>
                                                                    <span>•</span>
                                                                    <span>{formatDistanceToNow(new Date(job.created_at))} ago</span>
                                                                    {job.bids_count !== undefined && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <span>{job.bids_count} proposal{job.bids_count !== 1 ? 's' : ''}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <Link
                                                                        href={`/jobs/${job.id}`}
                                                                        className="text-sm text-blue-600 hover:text-blue-800"
                                                                    >
                                                                        View Details
                                                                    </Link>
                                                                    {job.status === 'open' && (
                                                                        <Link
                                                                            href={`/jobs/${job.id}`}
                                                                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                                                                        >
                                                                            Submit Proposal
                                                                        </Link>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Pagination */}
                                        {shouldShowPagination && (
                                            <Pagination
                                                currentPage={currentPage}
                                                totalPages={totalPages}
                                                onPageChange={goToPage}
                                                itemsPerPage={itemsPerPage}
                                                totalItems={totalItems}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        /* Employer View - No Sidebar, just jobs list */
                        <div className="mb-8">
                            {/* Jobs List */}
                            {jobs.data && jobs.data.length === 0 ? (
                                <div className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-lg sm:rounded-xl border border-gray-200">
                                    <div className="p-16 text-center">
                                        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM16 10h.01M12 14h.01M8 14h.01M8 10h.01" />
                                            </svg>
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                            No Jobs Posted Yet
                                        </h3>
                                        <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto leading-relaxed">
                                            Start by posting your first job to find talented gig workers.
                                        </p>
                                        <Link
                                            href={route('jobs.create')}
                                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 inline-flex items-center"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            Post Your First Job
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {jobs.data && jobs.data.map((job) => (
                                        <div key={job.id} className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-lg sm:rounded-xl border border-gray-200">
                                            <div className="p-8">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-4 mb-4">
                                                            <h3 className="text-xl font-bold text-gray-900">
                                                                <Link
                                                                    href={`/jobs/${job.id}`}
                                                                    className="hover:text-blue-600 transition-colors duration-300"
                                                                >
                                                                    {job.title}
                                                                </Link>
                                                            </h3>
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold shadow-md ${getStatusBadge(job.status)}`}>
                                                                {job.status === 'open' ? 'Open' : job.status.replace('_', ' ')}
                                                            </span>
                                                        </div>

                                                        <p className="text-gray-700 text-lg mb-6 line-clamp-3 break-all leading-relaxed">
                                                            {job.description}
                                                        </p>

                                                        <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100 mb-6">
                                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                                                <div>
                                                                    <div className="text-sm font-medium text-blue-600 mb-1">Budget</div>
                                                                    <div className="font-bold text-green-600 text-lg">
                                                                        {getBudgetDisplay(job)}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-medium text-blue-600 mb-1">Duration</div>
                                                                    <div className="font-bold text-gray-900 text-lg">
                                                                        {job.estimated_duration_days} days
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-medium text-blue-600 mb-1">Experience</div>
                                                                    <span className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold shadow-md ${getExperienceBadge(job.experience_level)}`}>
                                                                        {job.experience_level}
                                                                    </span>
                                                                </div>
                                                                {(job.is_remote || job.location) && (
                                                                    <div>
                                                                        <div className="text-sm font-medium text-blue-600 mb-1">Location</div>
                                                                        <div className="font-bold text-gray-900 text-lg">
                                                                            {job.is_remote ? '🌐 Remote' : `📍 ${job.location}`}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="mb-6">
                                                            <div className="text-sm font-medium text-blue-600 mb-3">Required Skills</div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {/* Show structured skills if available */}
                                                                {getStructuredSkills(job?.skills_requirements).length > 0 ? (
                                                                    <>
                                                                        {getStructuredSkills(job.skills_requirements)
                                                                            .filter(s => s.importance === 'required')
                                                                            .slice(0, 5)
                                                                            .map((skill, index) => (
                                                                                <div key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 shadow-sm hover:shadow-md transition-all duration-200">
                                                                                    <span>{skill.skill}</span>
                                                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getExperienceBadge(skill.experience_level)}`}>
                                                                                        {skill.experience_level?.charAt(0).toUpperCase() || ''}
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                        {getStructuredSkills(job.skills_requirements).filter(s => s.importance === 'required').length > 5 && (
                                                                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600" title={`+${getStructuredSkills(job.skills_requirements).filter(s => s.importance === 'required').length - 5} more skills`}>
                                                                                +{getStructuredSkills(job.skills_requirements).filter(s => s.importance === 'required').length - 5} more
                                                                            </span>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    /* Fallback to legacy required_skills */
                                                                    parseSkills(job?.required_skills || []).slice(0, 5).map((skill, index) => (
                                                                        <span key={index} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 shadow-sm hover:shadow-md transition-all duration-200">
                                                                            {skill}
                                                                        </span>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                                <span>
                                                                    Posted by:
                                                                    <span className="font-medium ml-1">
                                                                        {job.employer ? `${job.employer.first_name} ${job.employer.last_name}` : 'Employer'}
                                                                    </span>
                                                                </span>
                                                                <span>•</span>
                                                                <span>{formatDistanceToNow(new Date(job.created_at))} ago</span>
                                                                {job.bids_count !== undefined && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span>{job.bids_count} proposal{job.bids_count !== 1 ? 's' : ''}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <Link
                                                                    href={`/jobs/${job.id}/edit`}
                                                                    className="text-sm text-blue-600 hover:text-blue-800"
                                                                >
                                                                    Edit
                                                                </Link>
                                                                {job.status === 'open' && (
                                                                    <button
                                                                        onClick={() => handleCloseJob(job.id)}
                                                                        className="text-sm text-yellow-600 hover:text-yellow-800"
                                                                    >
                                                                        Close
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDeleteJob(job.id)}
                                                                    className="text-sm text-red-600 hover:text-red-800"
                                                                >
                                                                    Delete
                                                                </button>
                                                                {job.status === 'open' && (
                                                                    <Link
                                                                        href={`/aimatch/employer?job_id=${job.id}`}
                                                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-300 bg-indigo-50 hover:bg-indigo-100 py-2 px-4 rounded-xl transition-all duration-200"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                                        AI Match
                                                                    </Link>
                                                                )}
                                                                <Link
                                                                    href={`/jobs/${job.id}`}
                                                                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                                                                >
                                                                    View Proposals ({job.bids_count || 0})
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Pagination */}
                                    {jobs.links && jobs.links.length > 3 && (
                                        <div className="bg-white/70 backdrop-blur-sm px-6 py-4 flex items-center justify-between border border-gray-200 sm:px-8 rounded-xl shadow-lg">
                                            <div className="flex-1 flex justify-between sm:hidden">
                                                {jobs.prev_page_url && (
                                                    <Link
                                                        href={jobs.prev_page_url}
                                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                    >
                                                        Previous
                                                    </Link>
                                                )}
                                                {jobs.next_page_url && (
                                                    <Link
                                                        href={jobs.next_page_url}
                                                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                    >
                                                        Next
                                                    </Link>
                                                )}
                                            </div>
                                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-700">
                                                        Showing <span className="font-medium">{jobs.from}</span> to{' '}
                                                        <span className="font-medium">{jobs.to}</span> of{' '}
                                                        <span className="font-medium">{jobs.total}</span> results
                                                    </p>
                                                </div>
                                                <div>
                                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                        {jobs.links.map((link, index) => (
                                                            <Link
                                                                key={index}
                                                                href={link.url || '#'}
                                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${link.active
                                                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                                    } ${index === 0 ? 'rounded-l-md' : ''} ${index === jobs.links.length - 1 ? 'rounded-r-md' : ''
                                                                    }`}
                                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                            />
                                                        ))}
                                                    </nav>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Quick Stats for Gig Workers */}
                    {!isEmployer && filteredJobs.length > 0 && (
                        <div className="mt-12 bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-8 shadow-lg">
                            <h3 className="text-2xl font-bold text-blue-900 mb-6">Market Insights</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-blue-800">
                                <div className="text-center">
                                    <div className="font-semibold text-blue-700 mb-2">Filtered Jobs</div>
                                    <div className="text-3xl font-bold text-blue-600">{filteredJobs.length}</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-semibold text-blue-700 mb-2">Average Budget</div>
                                    <div className="text-3xl font-bold text-green-600">
                                        ₱{formatAmount(Math.round(filteredJobs.reduce((sum, job) => sum + ((job.budget_min + job.budget_max) / 2), 0) / filteredJobs.length) || 0)}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="font-semibold text-blue-700 mb-2">Remote Opportunities</div>
                                    <div className="text-3xl font-bold text-purple-600">
                                        {Math.round((filteredJobs.filter(job => job.is_remote).length / filteredJobs.length) * 100) || 0}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer for Gig Worker Dashboard (same as Welcome page) */}
                    {!isEmployer && (
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
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 bg-gray-600/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-6 border border-gray-200 w-96 shadow-2xl rounded-xl bg-white/90 backdrop-blur-sm">
                        <div className="mt-3 text-center">
                            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${confirmModal.confirmColor === 'red' ? 'bg-red-100' : 'bg-yellow-100'
                                }`}>
                                <svg className={`h-6 w-6 ${confirmModal.confirmColor === 'red' ? 'text-red-600' : 'text-yellow-600'
                                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                                {confirmModal.title}
                            </h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    {confirmModal.message}
                                </p>
                            </div>
                            <div className="items-center px-6 py-4">
                                <button
                                    onClick={confirmAction}
                                    disabled={processing}
                                    className={`px-6 py-3 ${confirmModal.confirmColor === 'red'
                                        ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                                        : 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
                                        } text-white font-semibold rounded-xl w-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none`}
                                >
                                    {processing ? 'Processing...' : confirmModal.confirmText}
                                </button>
                                <button
                                    onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                                    className="mt-4 px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-semibold rounded-xl w-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                body {
                    background: white;
                    color: #333;
                    font-family: 'Inter', sans-serif;
                }
            `}</style>
        </AuthenticatedLayout>
    );
}
