import React from 'react';
import { LinkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

// PortfolioLinkCard sub-component
function PortfolioLinkCard({ url }) {
    // Truncate URL for display (remove protocol and limit length)
    const truncateUrl = (url) => {
        if (!url) return '';
        let displayUrl = url.replace(/^https?:\/\//, '');
        if (displayUrl.length > 40) {
            displayUrl = displayUrl.substring(0, 37) + '...';
        }
        return displayUrl;
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                <LinkIcon className="w-6 h-6 text-blue-600" />
            </div>

            {/* Title */}
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Portfolio Website
            </h4>

            {/* Truncated URL */}
            <p className="text-sm text-gray-600 mb-4 break-all">
                {truncateUrl(url)}
            </p>

            {/* Visit Button */}
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
                Visit
            </a>
        </div>
    );
}

// ResumeCard sub-component
function ResumeCard({ url, fileName }) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                <DocumentTextIcon className="w-6 h-6 text-green-600" />
            </div>

            {/* Title */}
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Resume
            </h4>

            {/* File Name */}
            <p className="text-sm text-gray-600 mb-4 truncate" title={fileName}>
                {fileName || 'resume.pdf'}
            </p>

            {/* Download Button */}
            <a
                href={url}
                download
                className="inline-flex items-center justify-center w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
                Download
            </a>
        </div>
    );
}

// Main PortfolioGrid component
export default function PortfolioGrid({ portfolioLink, resumeFile, resumeFileName }) {
    const hasPortfolioItems = portfolioLink || resumeFile;

    // Empty state
    if (!hasPortfolioItems) {
        return (
            <div className="text-center py-8 px-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-600">No portfolio items yet</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolioLink && <PortfolioLinkCard url={portfolioLink} />}
            {resumeFile && <ResumeCard url={resumeFile} fileName={resumeFileName} />}
        </div>
    );
}
