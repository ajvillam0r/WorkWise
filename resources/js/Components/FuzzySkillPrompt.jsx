import React from 'react';

/**
 * "Did you mean X?" prompt shown when fuzzy matching finds a close candidate.
 */
export default function FuzzySkillPrompt({ prompt, onAccept, onReject, onDismiss }) {
    if (!prompt) return null;

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-in fade-in duration-200">
            <div className="flex-1">
                <p className="text-sm text-amber-800 font-medium">
                    Did you mean <strong className="text-amber-900">"{prompt.match}"</strong> instead
                    of "{prompt.original}"?
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                    {prompt.confidence}% similarity detected
                </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <button
                    type="button"
                    onClick={onAccept}
                    className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-colors"
                >
                    Use "{prompt.match}"
                </button>
                <button
                    type="button"
                    onClick={onReject}
                    className="px-3 py-1.5 bg-white border border-amber-300 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors"
                >
                    Add "{prompt.original}" anyway
                </button>
                <button
                    type="button"
                    onClick={onDismiss}
                    className="p-1.5 text-amber-400 hover:text-amber-600 transition-colors"
                    title="Cancel"
                >
                    <span className="material-icons text-sm">close</span>
                </button>
            </div>
        </div>
    );
}
