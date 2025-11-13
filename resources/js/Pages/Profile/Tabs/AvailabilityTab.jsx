import React, { memo } from 'react';
import EditableField from '@/Components/EditableField';
import SectionHeader from '@/Components/SectionHeader';

const AvailabilityTab = memo(function AvailabilityTab({
    data,
    setData,
    errors,
    isEditing,
    processing,
    hasChanges,
    onEdit,
    onCancel,
    onSave,
}) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    return (
        <div className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-lg sm:rounded-xl border border-gray-200 p-8">
            <SectionHeader
                title="Availability & Communication"
                isEditing={isEditing}
                hasChanges={hasChanges}
                processing={processing}
                onEdit={onEdit}
                onCancel={onCancel}
                onSave={onSave}
            />

            <div className="space-y-6">
                {/* Working Hours */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Working Hours
                    </label>
                    <div className="space-y-2">
                        {days.map((day) => (
                            <div key={day} className="flex items-center gap-4">
                                <input
                                    type="checkbox"
                                    checked={data.working_hours[day].enabled}
                                    onChange={(e) => {
                                        setData('working_hours', {
                                            ...data.working_hours,
                                            [day]: { ...data.working_hours[day], enabled: e.target.checked }
                                        });
                                    }}
                                    disabled={!isEditing}
                                    className="w-5 h-5 text-blue-600 rounded"
                                />
                                <span className="w-24 capitalize font-medium">{day}</span>
                                {data.working_hours[day].enabled && (
                                    <>
                                        <input
                                            type="time"
                                            value={data.working_hours[day].start}
                                            onChange={(e) => {
                                                setData('working_hours', {
                                                    ...data.working_hours,
                                                    [day]: { ...data.working_hours[day], start: e.target.value }
                                                });
                                            }}
                                            disabled={!isEditing}
                                            className="px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                                        />
                                        <span className="text-gray-600">to</span>
                                        <input
                                            type="time"
                                            value={data.working_hours[day].end}
                                            onChange={(e) => {
                                                setData('working_hours', {
                                                    ...data.working_hours,
                                                    [day]: { ...data.working_hours[day], end: e.target.value }
                                                });
                                            }}
                                            disabled={!isEditing}
                                            className="px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                                        />
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timezone */}
                <EditableField
                    label="Timezone"
                    id="timezone"
                    type="select"
                    value={data.timezone}
                    onChange={(e) => setData('timezone', e.target.value)}
                    disabled={!isEditing}
                    options={[
                        { value: 'Asia/Manila', label: 'Asia/Manila (PHT)' },
                        { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
                        { value: 'America/New_York', label: 'America/New_York (EST)' },
                        { value: 'Europe/London', label: 'Europe/London (GMT)' },
                    ]}
                    error={errors.timezone}
                />

                {/* Preferred Communication */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Communication Methods
                    </label>
                    <div className="space-y-2">
                        {['email', 'chat', 'video_call', 'phone'].map((method) => (
                            <label key={method} className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={data.preferred_communication.includes(method)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setData('preferred_communication', [...data.preferred_communication, method]);
                                        } else {
                                            setData('preferred_communication', 
                                                data.preferred_communication.filter(m => m !== method)
                                            );
                                        }
                                    }}
                                    disabled={!isEditing}
                                    className="w-5 h-5 text-blue-600 rounded"
                                />
                                <span className="capitalize">{method.replace('_', ' ')}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Availability Notes */}
                <EditableField
                    label="Availability Notes"
                    id="availability_notes"
                    type="textarea"
                    value={data.availability_notes}
                    onChange={(e) => setData('availability_notes', e.target.value)}
                    disabled={!isEditing}
                    rows={4}
                    placeholder="Any additional notes about your availability..."
                    error={errors.availability_notes}
                    debounceMs={400}
                />
            </div>
        </div>
    );
});

export default AvailabilityTab;
