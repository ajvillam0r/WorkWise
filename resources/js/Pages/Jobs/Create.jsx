import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';

export default function JobCreate({ auth }) {
    const [skillInput, setSkillInput] = useState('');
    
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        required_skills: [],
        budget_type: 'fixed',
        budget_min: '',
        budget_max: '',
        experience_level: 'intermediate',
        estimated_duration_days: '',
        deadline: '',
        location: '',
        is_remote: true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('jobs.store'));
    };

    const addSkill = () => {
        if (skillInput.trim() && !data.required_skills.includes(skillInput.trim())) {
            setData('required_skills', [...data.required_skills, skillInput.trim()]);
            setSkillInput('');
        }
    };

    const removeSkill = (skillToRemove) => {
        setData('required_skills', data.required_skills.filter(skill => skill !== skillToRemove));
    };

    const handleSkillKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill();
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Post a New Job
                    </h2>
                    <Link
                        href={route('jobs.index')}
                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Cancel
                    </Link>
                </div>
            }
        >
            <Head title="Post a Job" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Job Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Job Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., React Frontend Developer"
                                        required
                                    />
                                    {errors.title && (
                                        <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                                    )}
                                </div>

                                {/* Job Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Job Description *
                                    </label>
                                    <textarea
                                        rows={6}
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Describe the job requirements, responsibilities, and what you're looking for..."
                                        required
                                    />
                                    {errors.description && (
                                        <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                                    )}
                                </div>

                                {/* Required Skills */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Required Skills *
                                    </label>
                                    <div className="flex space-x-2 mb-2">
                                        <input
                                            type="text"
                                            value={skillInput}
                                            onChange={(e) => setSkillInput(e.target.value)}
                                            onKeyPress={handleSkillKeyPress}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Add a skill and press Enter"
                                        />
                                        <button
                                            type="button"
                                            onClick={addSkill}
                                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {data.required_skills.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center"
                                            >
                                                {skill}
                                                <button
                                                    type="button"
                                                    onClick={() => removeSkill(skill)}
                                                    className="ml-2 text-blue-600 hover:text-blue-800"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    {errors.required_skills && (
                                        <p className="text-red-500 text-sm mt-1">{errors.required_skills}</p>
                                    )}
                                </div>

                                {/* Budget Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Budget Type *
                                    </label>
                                    <select
                                        value={data.budget_type}
                                        onChange={(e) => setData('budget_type', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="fixed">Fixed Price</option>
                                        <option value="hourly">Hourly Rate</option>
                                    </select>
                                </div>

                                {/* Budget Range */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {data.budget_type === 'fixed' ? 'Minimum Budget ($)' : 'Minimum Hourly Rate ($)'} *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={data.budget_min}
                                            onChange={(e) => setData('budget_min', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                        {errors.budget_min && (
                                            <p className="text-red-500 text-sm mt-1">{errors.budget_min}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {data.budget_type === 'fixed' ? 'Maximum Budget ($)' : 'Maximum Hourly Rate ($)'}
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={data.budget_max}
                                            onChange={(e) => setData('budget_max', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {errors.budget_max && (
                                            <p className="text-red-500 text-sm mt-1">{errors.budget_max}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Experience Level */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Experience Level *
                                    </label>
                                    <select
                                        value={data.experience_level}
                                        onChange={(e) => setData('experience_level', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="expert">Expert</option>
                                    </select>
                                </div>

                                {/* Duration and Deadline */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Estimated Duration (days)
                                        </label>
                                        <input
                                            type="number"
                                            value={data.estimated_duration_days}
                                            onChange={(e) => setData('estimated_duration_days', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Deadline
                                        </label>
                                        <input
                                            type="date"
                                            value={data.deadline}
                                            onChange={(e) => setData('deadline', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Location */}
                                <div>
                                    <div className="flex items-center mb-2">
                                        <input
                                            type="checkbox"
                                            id="is_remote"
                                            checked={data.is_remote}
                                            onChange={(e) => setData('is_remote', e.target.checked)}
                                            className="mr-2"
                                        />
                                        <label htmlFor="is_remote" className="text-sm font-medium text-gray-700">
                                            This is a remote job
                                        </label>
                                    </div>
                                    {!data.is_remote && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Location
                                            </label>
                                            <input
                                                type="text"
                                                value={data.location}
                                                onChange={(e) => setData('location', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="e.g., New York, NY"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end space-x-3">
                                    <Link
                                        href={route('jobs.index')}
                                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                    >
                                        {processing ? 'Posting...' : 'Post Job'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
