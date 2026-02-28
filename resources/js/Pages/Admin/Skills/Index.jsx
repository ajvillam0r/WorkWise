import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function SkillsIndex({ skills, allSkills, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [filter, setFilter] = useState(filters.filter || '');
    const [mergeFrom, setMergeFrom] = useState('');
    const [mergeTo, setMergeTo] = useState('');
    const [merging, setMerging] = useState(false);

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    const applyFilters = (overrides = {}) => {
        router.get(route('admin.skills.index'), {
            search: overrides.search ?? search,
            filter: overrides.filter ?? filter,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleMerge = async () => {
        if (!mergeFrom || !mergeTo || mergeFrom === mergeTo) return;
        if (!confirm(`Merge skill #${mergeFrom} into #${mergeTo}? This cannot be undone.`)) return;

        setMerging(true);
        router.post(route('admin.skills.merge'), {
            from_skill_id: mergeFrom,
            to_skill_id: mergeTo,
        }, {
            onFinish: () => {
                setMerging(false);
                setMergeFrom('');
                setMergeTo('');
            },
        });
    };

    return (
        <AdminLayout>
            <Head title="Skill Moderation" />

            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Skill Moderation</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage, merge, and moderate skills in the system.</p>
                    </div>
                    <Link href={route('admin.dashboard')} className="text-sm text-blue-600 hover:underline">
                        &larr; Back to Dashboard
                    </Link>
                </div>

                {/* Merge Tool */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Merge Duplicate Skills</h2>
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Merge FROM (will be deleted)</label>
                            <select
                                value={mergeFrom}
                                onChange={e => setMergeFrom(e.target.value)}
                                className="w-full rounded-lg border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select skill to remove...</option>
                                {Object.entries(allSkills).map(([id, name]) => (
                                    <option key={id} value={id}>{name} (#{id})</option>
                                ))}
                            </select>
                        </div>
                        <div className="text-gray-400 font-bold text-sm self-center pb-2">&rarr;</div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Merge INTO (will be kept)</label>
                            <select
                                value={mergeTo}
                                onChange={e => setMergeTo(e.target.value)}
                                className="w-full rounded-lg border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select target skill...</option>
                                {Object.entries(allSkills).map(([id, name]) => (
                                    <option key={id} value={id}>{name} (#{id})</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleMerge}
                            disabled={!mergeFrom || !mergeTo || mergeFrom === mergeTo || merging}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            {merging ? 'Merging...' : 'Merge Skills'}
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                placeholder="Search skills..."
                                className="w-full rounded-lg border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                            <select
                                value={filter}
                                onChange={e => { setFilter(e.target.value); applyFilters({ filter: e.target.value }); }}
                                className="rounded-lg border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All</option>
                                <option value="verified">Verified (Global)</option>
                                <option value="unverified">Unverified (User-added)</option>
                            </select>
                        </div>
                        <button onClick={() => applyFilters()} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition">
                            Search
                        </button>
                    </div>
                </div>

                {/* Skills Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Skill Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Source</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Usage</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Workers</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Employers</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {skills.data.map(skill => (
                                <tr key={skill.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-3 text-sm text-gray-400 font-mono">{skill.id}</td>
                                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{skill.name}</td>
                                    <td className="px-6 py-3">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${skill.source === 'taxonomy' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                                            {skill.source}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        {skill.source === 'taxonomy' || skill.promoted_at ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                Global
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                                Local
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-right text-sm font-semibold text-gray-700">{skill.usage_count}</td>
                                    <td className="px-6 py-3 text-right text-sm text-gray-500">{skill.pivot_count}</td>
                                    <td className="px-6 py-3 text-right text-sm text-gray-500">{skill.job_employer_count}</td>
                                </tr>
                            ))}
                            {skills.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">No skills found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {skills.last_page > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                Showing {skills.from}-{skills.to} of {skills.total}
                            </p>
                            <div className="flex gap-2">
                                {skills.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        preserveState
                                        preserveScroll
                                        className={`px-3 py-1 rounded text-sm font-medium transition ${link.active ? 'bg-blue-600 text-white' : link.url ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
