import React, { memo } from 'react';
import EditableField from '@/Components/EditableField';
import SectionHeader from '@/Components/SectionHeader';
import { Link } from '@inertiajs/react';

const BasicInfoTab = memo(function BasicInfoTab({
    data,
    setData,
    errors,
    user,
    mustVerifyEmail,
    isGigWorker,
    isEditing,
    processing,
    hasChanges,
    onEdit,
    onCancel,
    onSave,
}) {
    return (
        <div className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-lg sm:rounded-xl border border-gray-200">
            <div className="p-8">
                <SectionHeader
                    title="Basic Information"
                    description="Update your personal information and contact details"
                    isEditing={isEditing}
                    hasChanges={hasChanges}
                    processing={processing}
                    onEdit={onEdit}
                    onCancel={onCancel}
                    onSave={onSave}
                />

                <div className="space-y-6">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <EditableField
                            label="First Name"
                            id="first_name"
                            type="text"
                            value={data.first_name}
                            onChange={(e) => setData('first_name', e.target.value)}
                            disabled={!isEditing}
                            required
                            error={errors.first_name}
                            debounceMs={300}
                        />
                        <EditableField
                            label="Last Name"
                            id="last_name"
                            type="text"
                            value={data.last_name}
                            onChange={(e) => setData('last_name', e.target.value)}
                            disabled={!isEditing}
                            required
                            error={errors.last_name}
                            debounceMs={300}
                        />
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <EditableField
                            label="Email Address"
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            disabled={!isEditing}
                            required
                            error={errors.email}
                            helpText={mustVerifyEmail && user.email_verified_at === null 
                                ? "Your email address is unverified. Please check your inbox."
                                : null
                            }
                        />
                        <EditableField
                            label="Phone Number"
                            id="phone"
                            type="tel"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            disabled={!isEditing}
                            placeholder="+63 912 345 6789"
                            error={errors.phone}
                        />
                    </div>

                    {/* Location (Auto-Detected) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Location (Auto-detected via IP)
                        </label>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-900 font-medium">{user.country || 'Not detected'}</p>
                            {user.city && <p className="text-sm text-gray-600 mt-1">City: {user.city}</p>}
                            <p className="text-xs text-gray-500 mt-2">
                                📍 Location automatically verified during registration
                            </p>
                        </div>
                    </div>

                    {/* Complete Address from KYC */}
                    <div className="border-t border-gray-200 pt-6 mt-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-4">
                            Verified Address (from ID Verification)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <EditableField
                                                            label="Street Address"
                                                            id="street_address"
                                                            type="text"
                                                            value={data.street_address}
                                                            onChange={(e) => setData('street_address', e.target.value)}
                                                            disabled={!isEditing || !!user.address_verified_at}
                                                            placeholder="123 Main Street"
                                                            error={errors.street_address}
                                                            debounceMs={300}
                                                        />
                                                        <EditableField
                                                            label="City"
                                                            id="city"
                                                            type="text"
                                                            value={data.city}
                                                            onChange={(e) => setData('city', e.target.value)}
                                                            disabled={!isEditing || !!user.address_verified_at}
                                                            placeholder="Lapu-Lapu City"
                                                            error={errors.city}
                                                            debounceMs={300}
                                                        />
                                                        <EditableField
                                                            label="Postal Code"
                                                            id="postal_code"
                                                            type="text"
                                                            value={data.postal_code}
                                                            onChange={(e) => setData('postal_code', e.target.value)}
                                                            disabled={!isEditing || !!user.address_verified_at}
                                                            placeholder="6015"
                                                            error={errors.postal_code}
                                                            debounceMs={300}
                                                        />
                                                        <EditableField
                                                            label="Country"
                                                            id="country"
                                                            type="text"
                                                            value={data.country}
                                                            onChange={(e) => setData('country', e.target.value)}
                                                            disabled={!isEditing || !!user.address_verified_at}
                                                            placeholder="Philippines"
                                                            error={errors.country}
                                                            debounceMs={300}
                                                        />
                        </div>
                        {user.address_verified_at && (
                            <p className="mt-2 text-xs text-green-600">
                                ✓ Address verified on {new Date(user.address_verified_at).toLocaleDateString()}. Contact support to update.
                            </p>
                        )}
                    </div>

                    {/* Bio */}
                    <EditableField
                        label="Professional Bio"
                        id="bio"
                        type="textarea"
                        value={data.bio}
                        onChange={(e) => setData('bio', e.target.value)}
                        disabled={!isEditing}
                        rows={4}
                        placeholder={isGigWorker
                            ? "Tell employers about your experience, skills, and what makes you unique..."
                            : "Describe your company, the type of projects you work on, and what you're looking for..."
                        }
                        error={errors.bio}
                        helpText={`${data.bio?.length || 0}/1000 characters. This will be visible on your profile.`}
                        debounceMs={400}
                    />

                    {/* Verification Status Section */}
                    <div className="border-t border-gray-200 pt-6 mt-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h4>
                        <div className="space-y-4">
                            {/* Email Verification */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">📧</span>
                                    <div>
                                        <p className="font-medium text-gray-900">Email Verification</p>
                                        <p className="text-sm text-gray-600">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {user.email_verified_at ? (
                                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                            ✓ Verified
                                        </span>
                                    ) : (
                                        <Link
                                            href={route('verification.send')}
                                            method="post"
                                            as="button"
                                            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                        >
                                            Verify Email
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* ID Verification */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🆔</span>
                                    <div>
                                        <p className="font-medium text-gray-900">Valid ID Verification</p>
                                        <p className="text-sm text-gray-600">
                                            {user.id_verification_status === 'pending' && 'Under review'}
                                            {user.id_verification_status === 'verified' && 'Verified by admin'}
                                            {user.id_verification_status === 'rejected' && 'Rejected - Resubmission needed'}
                                            {!user.id_verification_status && 'Not submitted'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {user.id_verification_status === 'verified' ? (
                                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                            ✓ Verified
                                        </span>
                                    ) : user.id_verification_status === 'pending' ? (
                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                                            ⏳ Pending
                                        </span>
                                    ) : (
                                        <Link
                                            href="/id-verification"
                                            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                        >
                                            {user.id_verification_status === 'rejected' ? 'Resubmit ID' : 'Upload ID'}
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Address Verification */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">📍</span>
                                    <div>
                                        <p className="font-medium text-gray-900">Address Verification</p>
                                        <p className="text-sm text-gray-600">
                                            {user.address_verified_at 
                                                ? `Verified via ID submission on ${new Date(user.address_verified_at).toLocaleDateString()}`
                                                : (user.country ? `Location auto-detected (${user.country}). Submit ID to verify address.` : 'Location not detected')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {user.address_verified_at ? (
                                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                            ✓ Verified
                                        </span>
                                    ) : user.country ? (
                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                            📍 Auto-detected
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-sm">
                                            Not detected
                                        </span>
                                    )}
                                </div>
                            </div>

                            {user.id_verification_status === 'rejected' && user.id_verification_notes && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm font-medium text-red-900 mb-1">Rejection Reason:</p>
                                    <p className="text-sm text-red-700">{user.id_verification_notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default BasicInfoTab;
