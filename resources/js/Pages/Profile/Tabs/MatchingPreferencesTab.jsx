import React, { memo } from 'react';
import EditableField from '@/Components/EditableField';
import SectionHeader from '@/Components/SectionHeader';
import ArrayFieldManager from '@/Components/ArrayFieldManager';

const MatchingPreferencesTab = memo(function MatchingPreferencesTab({
    data,
    setData,
    errors,
    isGigWorker,
    isEditing,
    processing,
    hasChanges,
    onEdit,
    onCancel,
    onSave,
}) {
    return (
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-8">
                <SectionHeader
                    title="Job Matching Preferences"
                    description="Customize how our AI matches you with opportunities or candidates"
                    isEditing={isEditing}
                    hasChanges={hasChanges}
                    processing={processing}
                    onEdit={onEdit}
                    onCancel={onCancel}
                    onSave={onSave}
                />

                <div className="space-y-6">
                    {isGigWorker ? (
                        <>
                            {/* Gig Worker Preferences */}
                            <div>
                                <h4 className="text-md font-medium text-gray-900 mb-4">Work Preferences</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <EditableField
                                        label="Preferred Timezone"
                                        id="timezone"
                                        type="select"
                                        value={data.timezone}
                                        onChange={(e) => setData('timezone', e.target.value)}
                                        disabled={!isEditing}
                                        options={[
                                            { value: 'Asia/Manila', label: 'Asia/Manila (PHT)' },
                                            { value: 'UTC', label: 'UTC' },
                                            { value: 'America/New_York', label: 'Eastern Time (ET)' },
                                            { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
                                            { value: 'Europe/London', label: 'London (GMT)' },
                                        ]}
                                        error={errors.timezone}
                                    />
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-6">
                                <h4 className="text-md font-medium text-gray-900 mb-4">Availability Notes</h4>
                                <EditableField
                                    label="Additional Notes"
                                    id="availability_notes"
                                    type="textarea"
                                    value={data.availability_notes}
                                    onChange={(e) => setData('availability_notes', e.target.value)}
                                    disabled={!isEditing}
                                    placeholder="e.g., I prefer short-term projects, or I am available for rush work on weekends."
                                    error={errors.availability_notes}
                                    rows={4}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Employer Preferences */}
                            <div>
                                <h4 className="text-md font-medium text-gray-900 mb-4">Hiring Preferences</h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <EditableField
                                        label="Typical Project Budget"
                                        id="typical_project_budget"
                                        type="select"
                                        value={data.typical_project_budget}
                                        onChange={(e) => setData('typical_project_budget', e.target.value)}
                                        disabled={!isEditing}
                                        options={[
                                            { value: 'under_500', label: 'Under ₱500' },
                                            { value: '500-2000', label: '₱500 - ₱2,000' },
                                            { value: '2000-5000', label: '₱2,000 - ₱5,000' },
                                            { value: '5000-10000', label: '₱5,000 - ₱10,000' },
                                            { value: '10000+', label: '₱10,000+' },
                                        ]}
                                        error={errors.typical_project_budget}
                                    />

                                    <EditableField
                                        label="Typical Project Duration"
                                        id="typical_project_duration"
                                        type="select"
                                        value={data.typical_project_duration}
                                        onChange={(e) => setData('typical_project_duration', e.target.value)}
                                        disabled={!isEditing}
                                        options={[
                                            { value: 'short_term', label: 'Short Term (< 1 week)' },
                                            { value: 'medium_term', label: 'Medium Term (1-4 weeks)' },
                                            { value: 'long_term', label: 'Long Term (1+ month)' },
                                            { value: 'ongoing', label: 'Ongoing / Indefinite' },
                                        ]}
                                        error={errors.typical_project_duration}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <EditableField
                                        label="Preferred Experience Level"
                                        id="preferred_experience_level"
                                        type="select"
                                        value={data.preferred_experience_level}
                                        onChange={(e) => setData('preferred_experience_level', e.target.value)}
                                        disabled={!isEditing}
                                        options={[
                                            { value: 'any', label: 'Any Level' },
                                            { value: 'beginner', label: 'Beginner' },
                                            { value: 'intermediate', label: 'Intermediate' },
                                            { value: 'expert', label: 'Expert' },
                                        ]}
                                        error={errors.preferred_experience_level}
                                    />

                                    <EditableField
                                        label="Hiring Frequency"
                                        id="hiring_frequency"
                                        type="select"
                                        value={data.hiring_frequency}
                                        onChange={(e) => setData('hiring_frequency', e.target.value)}
                                        disabled={!isEditing}
                                        options={[
                                            { value: 'one_time', label: 'One-time only' },
                                            { value: 'occasional', label: 'Occasional (as needed)' },
                                            { value: 'regular', label: 'Regular (monthly)' },
                                            { value: 'ongoing', label: 'Ongoing (always hiring)' },
                                        ]}
                                        error={errors.hiring_frequency}
                                    />
                                </div>

                                <div className="mt-6">
                                    <ArrayFieldManager
                                        label="Primary Hiring Needs"
                                        items={data.primary_hiring_needs || []}
                                        onUpdate={(updated) => setData('primary_hiring_needs', updated)}
                                        disabled={!isEditing}
                                        placeholder="e.g., Web Development, Graphic Design"
                                        addButtonText="+ Add Hiring Need"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
});

export default MatchingPreferencesTab;
