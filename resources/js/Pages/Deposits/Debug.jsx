import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function DepositDebug({ deposits }) {
    const [loading, setLoading] = useState({});
    const [results, setResults] = useState({});

    const forceConfirm = async (depositId) => {
        setLoading(prev => ({ ...prev, [depositId]: true }));
        
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            const response = await fetch(`/deposits/${depositId}/force-confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
            });
            
            const data = await response.json();
            setResults(prev => ({ ...prev, [depositId]: data }));
            
            if (data.success) {
                // Reload page to show updated status
                setTimeout(() => window.location.reload(), 1000);
            }
        } catch (err) {
            setResults(prev => ({ 
                ...prev, 
                [depositId]: { error: err.message } 
            }));
        } finally {
            setLoading(prev => ({ ...prev, [depositId]: false }));
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Deposit Debug</h2>}
        >
            <Head title="Deposit Debug" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-medium mb-4">Debug Deposits</h3>
                        
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            ID
                                        </th>
                                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Payment Intent ID
                                        </th>
                                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {deposits?.data?.map((deposit) => (
                                        <tr key={deposit.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {deposit.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                ₱{parseFloat(deposit.amount).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    deposit.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    deposit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                                {deposit.stripe_payment_intent_id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {deposit.status === 'pending' && (
                                                    <button
                                                        onClick={() => forceConfirm(deposit.id)}
                                                        disabled={loading[deposit.id]}
                                                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        {loading[deposit.id] ? 'Confirming...' : 'Force Confirm'}
                                                    </button>
                                                )}
                                                
                                                {results[deposit.id] && (
                                                    <div className="mt-2 text-xs">
                                                        {results[deposit.id].success ? (
                                                            <span className="text-green-600">✓ Confirmed</span>
                                                        ) : (
                                                            <span className="text-red-600">✗ {results[deposit.id].error}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
