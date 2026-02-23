import React, { memo } from 'react';
import EditableField from '@/Components/EditableField';
import SectionHeader from '@/Components/SectionHeader';
import PortfolioGrid from '@/Components/PortfolioGrid';
import { extractFileName } from '@/utils/fileHelpers';

const PortfolioTab = memo(function PortfolioTab({
    data,
    setData,
    errors,
    isEditing,
    processing,
    hasChanges,
    onEdit,
    onCancel,
    onSave,
    user,
}) {
    // Handle file change for resume
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('resume_file', file);
        }
    };

    return (
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-8">
                <SectionHeader
                    title="Portfolio & Resume"
                    description="Showcase your work and experience to potential clients"
                    isEditing={isEditing}
                    hasChanges={hasChanges}
                    processing={processing}
                    onEdit={onEdit}
                    onCancel={onCancel}
                    onSave={onSave}
                />

                <div className="space-y-8">
                    {/* Portfolio Link */}
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Online Portfolio</h4>
                        <EditableField
                            label="Portfolio URL"
                            id="portfolio_link"
                            type="url"
                            value={data.portfolio_link}
                            onChange={(e) => setData('portfolio_link', e.target.value)}
                            disabled={!isEditing}
                            placeholder="https://your-portfolio.com"
                            error={errors.portfolio_link}
                            helpText="Link to your personal website, Behance, Dribbble, or GitHub profile"
                        />
                    </div>

                    {/* Resume Upload */}
                    <div className="border-t border-gray-200 pt-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Resume / CV</h4>

                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h5 className="font-medium text-gray-900">
                                        {data.resume_file instanceof File
                                            ? data.resume_file.name
                                            : (user.resume_file ? extractFileName(user.resume_file) : 'No resume uploaded')}
                                    </h5>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {user.resume_file && !data.resume_file && (
                                            <a
                                                href={user.resume_file}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline mr-2"
                                            >
                                                View Current Resume
                                            </a>
                                        )}
                                        Supported formats: PDF, DOC, DOCX (Max 5MB)
                                    </p>

                                    {isEditing && (
                                        <div className="mt-4">
                                            <label className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150 cursor-pointer">
                                                <span>{user.resume_file ? 'Replace Resume' : 'Upload Resume'}</span>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept=".pdf,.doc,.docx"
                                                    onChange={handleFileChange}
                                                />
                                            </label>
                                            {errors.resume_file && (
                                                <p className="mt-2 text-sm text-red-600">{errors.resume_file}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Portfolio Items Grid (Read Only / Manage Link) */}
                    <div className="border-t border-gray-200 pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-semibold text-gray-900">Portfolio Projects</h4>
                            {/* Future: Add button to manage portfolio items */}
                        </div>
                        <PortfolioGrid
                            portfolioLink={null} // Already handled above
                            resumeFile={null} // Already handled above
                            resumeFileName={null}
                            items={user.portfolio_items || []} // Assuming relationship is loaded
                        />
                        {(!user.portfolio_items || user.portfolio_items.length === 0) && (
                            <p className="text-gray-500 italic text-center py-8">
                                No portfolio projects added yet.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default PortfolioTab;
