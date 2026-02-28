import React from 'react';

/**
 * "Did you mean X?" prompt shown when fuzzy matching finds a close candidate.
 */
export default function FuzzySkillPrompt({ prompt, onAccept, onReject, onDismiss, variant = 'light' }) {
    if (!prompt) return null;
    const isDark = variant === 'dark';

    return (
        <div className={`rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-in fade-in duration-200 ${isDark ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-amber-50 border border-amber-200'}`}>
            <div className="flex-1">
                <p className={`text-sm font-medium ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                    Did you mean <strong className={isDark ? 'text-amber-100' : 'text-amber-900'}>"{prompt.match}"</strong> instead
                    of "{prompt.original}"?
                </p>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-amber-400/90' : 'text-amber-600'}`}>
                    {prompt.confidence}% similarity detected
                </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <button
                    type="button"
                    onClick={onAccept}
                    className={`px-3 py-1.5 text-white text-xs font-bold rounded-lg transition-colors ${isDark ? 'bg-amber-600 hover:bg-amber-500' : 'bg-amber-600 hover:bg-amber-700'}`}
                >
                    Use "{prompt.match}"
                </button>
                <button
                    type="button"
                    onClick={onReject}
                    className={isDark ? 'px-3 py-1.5 bg-white/5 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-lg hover:bg-white/10 transition-colors' : 'px-3 py-1.5 bg-white border border-amber-300 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors'}
                >
                    Add "{prompt.original}" anyway
                </button>
                <button
                    type="button"
                    onClick={onDismiss}
                    className={`p-1.5 transition-colors ${isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-400 hover:text-amber-600'}`}
                    title="Cancel"
                >
                    <span className="material-icons text-sm">close</span>
                </button>
            </div>
        </div>
    );
}
