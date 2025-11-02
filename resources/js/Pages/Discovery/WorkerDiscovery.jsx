import React, { useState, useCallback } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    StarIcon,
    MapPinIcon,
    SparklesIcon,
    CurrencyDollarIcon,
    BriefcaseIcon,
    ClockIcon,
    XMarkIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function WorkerDiscovery({ workers, filters, filter_options }) {
    const [showFilters, setShowFilters] = useState(false);
    const [localFilters, setLocalFilters] = useState(filters);
    const { get, setData } = useForm();

    // Update filters and search
    const handleFilterChange = useCallback((name, value) => {
        const newFilters = { ...localFilters, [name]: value };
        setLocalFilters(newFilters);
        
        // Build query string
        const queryParams = new URLSearchParams();
        Object.entries(newFilters).forEach(([key, value]) => {
            if (value) {
                if (Array.isArray(value)) {
                    value.forEach(v => queryParams.append(`${key}[]`, v));
                } else {
                    queryParams.append(key, value);
                }
            }
        });

        get(route('worker-discovery.index') + '?' + queryParams.toString());
    }, [localFilters]);

    const clearFilters = () => {
        setLocalFilters({
            search: '',
            skills: [],
            min_experience: '',
            min_rate: '',
            max_rate: '',
            category: '',
            location: '',
            timezone: '',
            min_rating: '',
            sort_by: 'recent'
        });
        get(route('worker-discovery.index'));
    };

    const WorkerCard = ({ worker }) => (
        <Link href={route('worker-discovery.show', worker.id)} className="block">
            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 h-full">
                {/* Header with Avatar and Match Score */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                        <img
                            src={worker.avatar || worker.profile_photo || 'https://via.placeholder.com/48'}
                            alt={`${worker.first_name} ${worker.last_name}`}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                                {worker.first_name} {worker.last_name}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">
                                {worker.professional_title || worker.broad_category}
                            </p>
                        </div>
                    </div>
                    {worker.match_score > 0 && (
                        <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded">
                            <SparklesIcon className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-600">
                                {worker.match_score}%
                            </span>
                        </div>
                    )}
                </div>

                {/* Bio */}
                {worker.bio && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {worker.bio}
                    </p>
                )}

                {/* Skills */}
                {worker.skills_with_experience && worker.skills_with_experience.length > 0 && (
                    <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Top Skills</p>
                        <div className="flex flex-wrap gap-1">
                            {worker.skills_with_experience.slice(0, 3).map((skill, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                    {skill.skill}
                                    <span className="ml-1 text-xs text-blue-600">
                                        ({skill.experience_level})
                                    </span>
                                </span>
                            ))}
                            {worker.skills_with_experience.length > 3 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    +{worker.skills_with_experience.length - 3} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Rating and Reviews */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                            <StarIcon
                                key={i}
                                className={`w-4 h-4 ${
                                    i < Math.round(worker.rating)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                }`}
                            />
                        ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                        {worker.rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-600">
                        ({worker.total_reviews} reviews)
                    </span>
                </div>

                {/* Bottom Info */}
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                        <CurrencyDollarIcon className="w-4 h-4 flex-shrink-0" />
                        <span>${worker.hourly_rate}/hr</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                        <span>{worker.city}, {worker.country}</span>
                    </div>
                    {worker.timezone && (
                        <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4 flex-shrink-0" />
                            <span>{worker.timezone}</span>
                        </div>
                    )}
                </div>

                {/* View Profile Button */}
                <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors">
                    View Profile
                </button>
            </div>
        </Link>
    );

    return (
        <AuthenticatedLayout>
            <Head title="Discover Workers" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Discover Workers</h1>
                    <p className="text-gray-600">
                        Browse and filter gig workers by skills, experience, and more
                    </p>
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {/* Search */}
                        <div className="md:col-span-2">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, title, or bio..."
                                    value={localFilters.search || ''}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Sort */}
                        <select
                            value={localFilters.sort_by || 'recent'}
                            onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="recent">Most Recent</option>
                            <option value="rating">Highest Rated</option>
                            <option value="completions">Most Completed</option>
                            <option value="rate_low">Lowest Rate</option>
                            <option value="rate_high">Highest Rate</option>
                        </select>
                    </div>

                    {/* Toggle Filters Button */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
                    >
                        <FunnelIcon className="w-5 h-5" />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>

                    {/* Filters Panel */}
                    {showFilters && (
                        <div className="border-t pt-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Category Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category
                                    </label>
                                    <select
                                        value={localFilters.category || ''}
                                        onChange={(e) => handleFilterChange('category', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">All Categories</option>
                                        {filter_options.categories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Experience Level */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Min. Experience
                                    </label>
                                    <select
                                        value={localFilters.min_experience || ''}
                                        onChange={(e) => handleFilterChange('min_experience', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Any Level</option>
                                        <option value="beginner">Beginner+</option>
                                        <option value="intermediate">Intermediate+</option>
                                        <option value="expert">Expert</option>
                                    </select>
                                </div>

                                {/* Minimum Rating */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Min. Rating
                                    </label>
                                    <select
                                        value={localFilters.min_rating || ''}
                                        onChange={(e) => handleFilterChange('min_rating', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Any Rating</option>
                                        <option value="3">3+ Stars</option>
                                        <option value="4">4+ Stars</option>
                                        <option value="4.5">4.5+ Stars</option>
                                    </select>
                                </div>

                                {/* Hourly Rate Range */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Min. Hourly Rate
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="$ 0"
                                        value={localFilters.min_rate || ''}
                                        onChange={(e) => handleFilterChange('min_rate', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Max. Hourly Rate
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="$ 9999"
                                        value={localFilters.max_rate || ''}
                                        onChange={(e) => handleFilterChange('max_rate', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Timezone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Timezone
                                    </label>
                                    <select
                                        value={localFilters.timezone || ''}
                                        onChange={(e) => handleFilterChange('timezone', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Any Timezone</option>
                                        {filter_options.timezones.map((tz) => (
                                            <option key={tz} value={tz}>{tz}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Location */}
                                <div className="md:col-span-2 lg:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="City, Country"
                                        value={localFilters.location || ''}
                                        onChange={(e) => handleFilterChange('location', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Clear Filters Button */}
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
                            >
                                <XMarkIcon className="w-5 h-5" />
                                Clear All Filters
                            </button>
                        </div>
                    )}
                </div>

                {/* Results */}
                {workers && workers.data && workers.data.length > 0 ? (
                    <>
                        <div className="mb-4 text-gray-600">
                            Found <span className="font-semibold">{workers.total}</span> worker{workers.total !== 1 ? 's' : ''}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {workers.data.map((worker) => (
                                <WorkerCard key={worker.id} worker={worker} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {workers.last_page > 1 && (
                            <div className="flex justify-center gap-2">
                                {workers.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        className={`px-3 py-2 rounded-lg ${
                                            link.active
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                            <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No workers found</h3>
                        <p className="text-gray-600 mb-4">
                            Try adjusting your filters to find the perfect match
                        </p>
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
