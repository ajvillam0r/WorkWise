import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import IdImageViewer from '@/Components/IdImageViewer';

export default function Show({ user }) {
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);

    const approveForm = useForm({
        notes: '',
    });

    const rejectForm = useForm({
        reason: '',
        notes: '',
    });

    const requestForm = useForm({
        reason: '',
    });

    const handleApprove = (e) => {
        e.preventDefault();
        approveForm.post(route('admin.id-verifications.approve', user.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowApproveModal(false);
            },
        });
    };

    const handleReject = (e) => {
        e.preventDefault();
        rejectForm.post(route('admin.id-verifications.reject', user.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowRejectModal(false);
            },
        });
    };

    const handleRequestResubmit = (e) => {
        e.preventDefault();
        requestForm.post(route('admin.id-verifications.requestResubmit', user.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowRequestModal(false);
            },
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Review' },
            verified: { bg: 'bg-green-100', text: 'text-green-800', label: 'Verified' },
            rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
        };
        const badge = badges[status] || badges.pending;

        return (
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        );
    };

    return (
        <AdminLayout>
            <Head title={`ID Verification - ${user.first_name} ${user.last_name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <Link
                                href={route('admin.id-verifications.index')}
                                className="text-sm text-indigo-600 hover:text-indigo-900 mb-2 inline-block"
                            >
                                ← Back to ID Verifications
                            </Link>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {user.first_name} {user.last_name}
                            </h1>
                            <p className="mt-2 text-sm text-gray-600">{user.email}</p>
                        </div>
                        <div>
                            {getStatusBadge(user.id_verification_status)}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content - ID Images */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* ID Images */}
                            <div className="bg-white shadow-sm sm:rounded-lg p-6">
                                <h2 className="text-xl font-semibold mb-4">ID Images</h2>
                                <div className="mb-4">
                                    <span className="text-sm font-medium text-gray-700">ID Type: </span>
                                    <span className="text-sm text-gray-900">{user.id_type_label}</span>
                                </div>

                                <IdImageViewer
                                    frontImage={user.id_front_image_url}
                                    backImage={user.id_back_image_url}
                                />
                            </div>

                            {/* Action Buttons */}
                            {user.id_verification_status === 'pending' && (
                                <div className="bg-white shadow-sm sm:rounded-lg p-6">
                                    <h2 className="text-xl font-semibold mb-4">Actions</h2>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowApproveModal(true)}
                                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                                        >
                                            ✓ Approve ID
                                        </button>
                                        <button
                                            onClick={() => setShowRejectModal(true)}
                                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
                                        >
                                            ✗ Reject ID
                                        </button>
                                        <button
                                            onClick={() => setShowRequestModal(true)}
                                            className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors font-medium"
                                        >
                                            🔄 Request Resubmit
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Verification Notes */}
                            {user.id_verification_notes && (
                                <div className="bg-white shadow-sm sm:rounded-lg p-6">
                                    <h2 className="text-xl font-semibold mb-4">Verification Notes</h2>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{user.id_verification_notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Sidebar - User Info */}
                        <div className="space-y-6">
                            {/* Profile Info */}
                            <div className="bg-white shadow-sm sm:rounded-lg p-6">
                                <h2 className="text-lg font-semibold mb-4">User Information</h2>
                                <div className="space-y-3">
                                    {user.profile_photo_url && (
                                        <div className="flex justify-center">
                                            <img
                                                src={user.profile_photo_url}
                                                alt="Profile"
                                                className="w-24 h-24 rounded-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-xs text-gray-500">Name</div>
                                        <div className="text-sm font-medium">{user.first_name} {user.last_name}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Email</div>
                                        <div className="text-sm">{user.email}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Professional Title</div>
                                        <div className="text-sm">{user.professional_title || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Hourly Rate</div>
                                        <div className="text-sm">₱{user.hourly_rate ? parseFloat(user.hourly_rate).toFixed(2) : '0.00'}/hour</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Profile Status</div>
                                        <div className="text-sm capitalize">{user.profile_status}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Member Since</div>
                                        <div className="text-sm">{new Date(user.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Address Information */}
                            <div className="bg-white shadow-sm sm:rounded-lg p-6">
                                <h2 className="text-lg font-semibold mb-4">Address Information</h2>
                                <div className="space-y-3">
                                    {user.country && (
                                        <div>
                                            <div className="text-xs text-gray-500">Registration Country</div>
                                            <div className="text-sm font-medium">{user.country}</div>
                                        </div>
                                    )}
                                    
                                    {user.street_address && (
                                        <>
                                            <div className="border-t pt-3">
                                                <div className="text-xs text-gray-500 font-semibold mb-2">KYC Address</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500">Street Address</div>
                                                <div className="text-sm">{user.street_address}</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <div className="text-xs text-gray-500">City</div>
                                                    <div className="text-sm">{user.city}</div>
                                                </div>
                                                {user.barangay && (
                                                    <div>
                                                        <div className="text-xs text-gray-500">Barangay</div>
                                                        <div className="text-sm">{user.barangay}</div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <div className="text-xs text-gray-500">Postal Code</div>
                                                    <div className="text-sm">{user.postal_code}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500">Country</div>
                                                    <div className="text-sm">{user.country}</div>
                                                </div>
                                            </div>
                                            {user.address_verified_at && (
                                                <div>
                                                    <div className="text-xs text-gray-500">Verified On</div>
                                                    <div className="text-sm">{new Date(user.address_verified_at).toLocaleDateString()}</div>
                                                </div>
                                            )}
                                            
                                            {/* Country Mismatch Warning */}
                                            {user.country && user.street_address && (
                                                (() => {
                                                    // Extract country from full address or compare with registration country
                                                    const registrationCountry = user.country;
                                                    // In a real scenario, you might parse city/country differently
                                                    // For now, we're showing a warning if needed
                                                    return null; // Can add conditional logic here if needed
                                                })()
                                            )}
                                        </>
                                    )}
                                    
                                    {!user.street_address && (
                                        <div className="text-sm text-gray-500 italic">
                                            No complete address provided yet
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Skills */}
                            {user.skills_with_experience && user.skills_with_experience.length > 0 && (
                                <div className="bg-white shadow-sm sm:rounded-lg p-6">
                                    <h2 className="text-lg font-semibold mb-4">Skills</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {user.skills_with_experience.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                            >
                                                {skill.skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Portfolio */}
                            {user.portfolio_items && user.portfolio_items.length > 0 && (
                                <div className="bg-white shadow-sm sm:rounded-lg p-6">
                                    <h2 className="text-lg font-semibold mb-4">Portfolio</h2>
                                    <div className="text-sm text-gray-600">
                                        {user.portfolio_items.length} project{user.portfolio_items.length !== 1 ? 's' : ''} uploaded
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Approve Modal */}
            {showApproveModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Approve ID Verification</h3>
                        <form onSubmit={handleApprove}>
                            <p className="text-sm text-gray-600 mb-4">
                                Are you sure you want to approve this ID? The user will be notified via email.
                            </p>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={approveForm.data.notes}
                                    onChange={(e) => approveForm.setData('notes', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows="3"
                                    placeholder="Add any internal notes..."
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowApproveModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                    disabled={approveForm.processing}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                                    disabled={approveForm.processing}
                                >
                                    {approveForm.processing ? 'Approving...' : 'Approve'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Reject ID Verification</h3>
                        <form onSubmit={handleReject}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rejection Reason *
                                </label>
                                <textarea
                                    value={rejectForm.data.reason}
                                    onChange={(e) => rejectForm.setData('reason', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows="3"
                                    placeholder="e.g., Image is blurry, ID expired, etc."
                                    required
                                />
                                {rejectForm.errors.reason && (
                                    <p className="mt-1 text-sm text-red-600">{rejectForm.errors.reason}</p>
                                )}
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Internal Notes (Optional)
                                </label>
                                <textarea
                                    value={rejectForm.data.notes}
                                    onChange={(e) => rejectForm.setData('notes', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows="2"
                                    placeholder="Add any internal notes..."
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowRejectModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                    disabled={rejectForm.processing}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                                    disabled={rejectForm.processing}
                                >
                                    {rejectForm.processing ? 'Rejecting...' : 'Reject'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Request Resubmit Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Request ID Resubmission</h3>
                        <form onSubmit={handleRequestResubmit}>
                            <p className="text-sm text-gray-600 mb-4">
                                Request the user to submit a new ID with corrections.
                            </p>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for Resubmission *
                                </label>
                                <textarea
                                    value={requestForm.data.reason}
                                    onChange={(e) => requestForm.setData('reason', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows="3"
                                    placeholder="e.g., Please upload a clearer image, Ensure all corners are visible, etc."
                                    required
                                />
                                {requestForm.errors.reason && (
                                    <p className="mt-1 text-sm text-red-600">{requestForm.errors.reason}</p>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowRequestModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                    disabled={requestForm.processing}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
                                    disabled={requestForm.processing}
                                >
                                    {requestForm.processing ? 'Sending...' : 'Send Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

