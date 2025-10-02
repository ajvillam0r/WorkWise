import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';

export default function StartConversationModal({ isOpen, onClose, users = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        receiver_id: '',
        message: '',
    });

    const filteredUsers = users.filter(user =>
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.professional_title && user.professional_title.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setData('receiver_id', user.id);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        post('/messages', {
            onSuccess: () => {
                reset();
                setSelectedUser(null);
                setSearchTerm('');
                onClose();
                // Redirect to the conversation
                window.location.href = `/messages/${selectedUser.id}`;
            },
        });
    };

    const handleClose = () => {
        reset();
        setSelectedUser(null);
        setSearchTerm('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                    Start New Conversation
                                </h3>

                                {!selectedUser ? (
                                    <div>
                                        <div className="mb-4">
                                            <input
                                                type="text"
                                                placeholder="Search users..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div className="max-h-60 overflow-y-auto">
                                            {filteredUsers.length === 0 ? (
                                                <p className="text-gray-500 text-center py-4">
                                                    {searchTerm ? 'No users found' : 'No users available'}
                                                </p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {filteredUsers.map((user) => (
                                                        <button
                                                            key={user.id}
                                                            onClick={() => handleUserSelect(user)}
                                                            className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                                        >
                                                            <div className="flex items-center space-x-3">
                                                                <div className="flex-shrink-0">
                                                                    {user.profile_photo ? (
                                                                        <img
                                                                            src={`/storage/${user.profile_photo}`}
                                                                            alt={`${user.first_name} ${user.last_name}`}
                                                                            className="h-8 w-8 rounded-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                                                                            {user.first_name[0]}{user.last_name[0]}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                                        {user.first_name} {user.last_name}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 truncate">
                                                                        {user.professional_title || user.user_type}
                                                                    </p>
                                                                </div>
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                    user.user_type === 'employer'
                                                                        ? 'bg-blue-100 text-blue-800'
                                                                        : 'bg-green-100 text-green-800'
                                                                }`}>
                                                                    {user.user_type === 'employer' ? 'Employer' : 'Gig Worker'}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit}>
                                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <div className="flex-shrink-0">
                                                    {selectedUser.profile_photo ? (
                                                        <img
                                                            src={`/storage/${selectedUser.profile_photo}`}
                                                            alt={`${selectedUser.first_name} ${selectedUser.last_name}`}
                                                            className="h-10 w-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                                                            {selectedUser.first_name[0]}{selectedUser.last_name[0]}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {selectedUser.first_name} {selectedUser.last_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {selectedUser.professional_title || selectedUser.user_type}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedUser(null)}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Your Message
                                            </label>
                                            <textarea
                                                value={data.message}
                                                onChange={(e) => setData('message', e.target.value)}
                                                rows={4}
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Type your message..."
                                                required
                                            />
                                            {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
                                        </div>

                                        <div className="flex justify-end space-x-3">
                                            <button
                                                type="button"
                                                onClick={handleClose}
                                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                            >
                                                {processing ? 'Sending...' : 'Send Message'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
