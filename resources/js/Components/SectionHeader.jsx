import React from 'react';

/**
 * Reusable section header with edit/save/cancel buttons
 */
export default function SectionHeader({
    title,
    description,
    isEditing = false,
    hasChanges = false,
    processing = false,
    onEdit,
    onCancel,
    onSave,
    className = '',
}) {
    return (
        <div className={`mb-8 flex justify-between items-start ${className}`}>
            <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
                {description && <p className="text-gray-600 text-lg">{description}</p>}
            </div>
            <div className="flex gap-2">
                {!isEditing ? (
                    <button
                        type="button"
                        onClick={onEdit}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                        Edit
                    </button>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onSave}
                            disabled={processing || !hasChanges}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                            {processing ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : 'Save'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
