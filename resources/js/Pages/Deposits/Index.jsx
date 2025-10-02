import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '@/Components/CheckoutForm';



export default function Deposits({ deposits, stripe_key, currency }) {
    const [showAmountModal, setShowAmountModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [stripePromise, setStripePromise] = useState(null);
    const [clientSecret, setClientSecret] = useState(null);
    const [depositId, setDepositId] = useState(null);
    const [isCreatingIntent, setIsCreatingIntent] = useState(false);
    const [intentError, setIntentError] = useState(null);
    const [forceConfirmLoading, setForceConfirmLoading] = useState({});
    const [forceConfirmResults, setForceConfirmResults] = useState({});
    const { flash, auth } = usePage().props;

    useEffect(() => {
        if (stripe_key) {
            setStripePromise(loadStripe(stripe_key));
        }
    }, [stripe_key]);

    const handleDeposit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            return;
        }

        setIsCreatingIntent(true);
        setIntentError(null);
        setClientSecret(null);

        try {
            // Get CSRF token safely
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            if (!csrfToken) {
                throw new Error('CSRF token not found. Please refresh the page and try again.');
            }

            // Create payment intent first
            const response = await fetch('/deposits/create-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ amount }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create payment intent');
            }

            const { clientSecret, deposit_id } = await response.json();

            // Validate that we received a proper client secret
            if (!clientSecret || typeof clientSecret !== 'string' || !clientSecret.startsWith('pi_')) {
                throw new Error('Invalid payment intent received from server');
            }

            setClientSecret(clientSecret);
            setDepositId(deposit_id);
            setShowAmountModal(false); // Close amount modal
            setShowPaymentModal(true); // Open payment modal
        } catch (err) {
            console.error('Error creating payment intent:', err);
            setIntentError(err.message || 'Failed to create payment intent. Please try again.');
        } finally {
            setIsCreatingIntent(false);
        }
    };

    const handleSuccess = async (paymentIntent = null) => {
        console.log('handleSuccess called with:', { depositId, paymentIntent });

        try {
            if (depositId) {
                // Confirm the deposit payment
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

                console.log('Confirming deposit:', depositId);
                const response = await fetch(`/deposits/${depositId}/confirm`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                });

                const result = await response.json();
                console.log('Confirmation result:', result);

                if (response.ok && result.success) {
                    console.log('Deposit confirmed successfully via frontend');
                } else {
                    console.warn('Frontend confirmation failed:', result);
                }
            }
        } catch (err) {
            console.error('Error confirming deposit:', err);
        } finally {
            // Always clean up and reload
            setShowPaymentModal(false);
            setShowAmountModal(false);
            setClientSecret(null);
            setDepositId(null);
            setIntentError(null);
            setAmount('');

            // Add a small delay to ensure backend processing completes
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    };

    const handleCancel = () => {
        setShowPaymentModal(false);
        setShowAmountModal(false);
        setClientSecret(null);
        setDepositId(null);
        setIntentError(null);
        setAmount('');
    };

    const forceConfirm = async (depositId) => {
        setForceConfirmLoading(prev => ({ ...prev, [depositId]: true }));

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
            setForceConfirmResults(prev => ({ ...prev, [depositId]: data }));

            if (data.success) {
                // Reload page to show updated status
                setTimeout(() => window.location.reload(), 1000);
            }
        } catch (err) {
            setForceConfirmResults(prev => ({
                ...prev,
                [depositId]: { error: err.message }
            }));
        } finally {
            setForceConfirmLoading(prev => ({ ...prev, [depositId]: false }));
        }
    };

    const formatAmount = (value) => {
        const number = Number(value ?? 0);
        return number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight"> Wallet</h2>}
        >
            <Head title="Wallet" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                            {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                            {flash.error}
                        </div>
                    )}

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        {/* Balance Summary */}
                        <div className="mb-8 p-6 bg-green-50 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Escrow Balance</h3>
                                    <div className="text-3xl font-bold text-green-600">
                                        ₱{auth?.user?.escrow_balance ? formatAmount(auth.user.escrow_balance) : '0.00'}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">Available for project payments</p>
                                </div>
                                <div className="text-right">
                                    <button
                                        onClick={() => setShowAmountModal(true)}
                                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                                    >
                                        Add Funds
                                    </button>
                                </div>
                            </div>
                        </div>



                        {/* Recent Deposits */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Recent Deposits</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
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
                                                    {new Date(deposit.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {currency.symbol}{formatAmount(deposit.amount)}
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
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {deposit.status === 'pending' && (
                                                        <div>
                                                            <button
                                                                onClick={() => forceConfirm(deposit.id)}
                                                                disabled={forceConfirmLoading[deposit.id]}
                                                                className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                                                            >
                                                                {forceConfirmLoading[deposit.id] ? 'Confirming...' : 'Force Confirm'}
                                                            </button>

                                                            {forceConfirmResults[deposit.id] && (
                                                                <div className="mt-1 text-xs">
                                                                    {forceConfirmResults[deposit.id].success ? (
                                                                        <span className="text-green-600">✓ Confirmed</span>
                                                                    ) : (
                                                                        <span className="text-red-600">✗ {forceConfirmResults[deposit.id].error}</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {(!deposits?.data || deposits.data.length === 0) && (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                                                    No deposits found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Amount Input Modal */}
            {showAmountModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Add Funds to Wallet</h3>
                            <button
                                onClick={() => {
                                    setShowAmountModal(false);
                                    setAmount('');
                                    setIntentError(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Amount to Deposit
                            </label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">{currency.symbol}</span>
                                </div>
                                <input
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="focus:ring-green-500 focus:border-green-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                                Minimum deposit: {currency.symbol}50.00
                            </p>
                        </div>

                        {intentError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                <div className="text-sm text-red-600">
                                    {intentError}
                                </div>
                            </div>
                        )}

                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    setShowAmountModal(false);
                                    setAmount('');
                                    setIntentError(null);
                                }}
                                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeposit}
                                disabled={!amount || parseFloat(amount) <= 0 || isCreatingIntent}
                                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                            >
                                {isCreatingIntent ? 'Creating...' : 'Continue to Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium mb-4">Complete Your Deposit</h3>
                        {(() => {
                            // Triple validation to ensure we never render Elements without proper clientSecret
                            const isValidClientSecret = clientSecret &&
                                                      typeof clientSecret === 'string' &&
                                                      clientSecret.length > 0 &&
                                                      clientSecret.indexOf('pi_') === 0;

                            const isStripeReady = stripePromise && !isCreatingIntent;

                            if (isValidClientSecret && isStripeReady) {
                                return (
                                    <Elements
                                        key={`stripe-elements-${clientSecret}`} // Unique key to force re-render
                                        stripe={stripePromise}
                                        options={{
                                            clientSecret: clientSecret,
                                            appearance: {
                                                theme: 'stripe',
                                            },
                                        }}
                                    >
                                        <CheckoutForm
                                            amount={amount}
                                            currency={currency}
                                            clientSecret={clientSecret}
                                            onSuccess={handleSuccess}
                                            onCancel={handleCancel}
                                        />
                                    </Elements>
                                );
                            } else {
                                return (
                                    <div className="text-center py-4">
                                        <div className="text-gray-600">
                                            {isCreatingIntent ? 'Creating payment...' : 'Loading payment form...'}
                                        </div>
                                        {intentError && (
                                            <div className="mt-2 text-sm text-red-600">
                                                {intentError}
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                        })()}
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}