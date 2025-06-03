import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(window.stripeKey);

function PaymentForm({ project, onSuccess }) {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [clientSecret, setClientSecret] = useState(null);

    const { post } = useForm();

    useEffect(() => {
        // Create payment intent when component mounts
        fetch(`/projects/${project.id}/payment/intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                setClientSecret(data.client_secret);
            } else {
                setError(data.error);
            }
        })
        .catch(err => {
            setError('Failed to initialize payment');
        });
    }, [project.id]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements || !clientSecret) {
            return;
        }

        setProcessing(true);
        setError(null);

        const card = elements.getElement(CardElement);

        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: card,
                billing_details: {
                    name: `${project.client.first_name} ${project.client.last_name}`,
                    email: project.client.email,
                },
            }
        });

        if (stripeError) {
            setError(stripeError.message);
            setProcessing(false);
        } else {
            // Payment succeeded
            post('/payment/confirm', {
                payment_intent_id: paymentIntent.id,
                project_id: project.id
            });
        }
    };

    const cardElementOptions = {
        style: {
            base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                    color: '#aab7c4',
                },
                fontFamily: 'system-ui, -apple-system, sans-serif',
            },
            invalid: {
                color: '#9e2146',
            },
        },
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <span className="text-blue-400 text-xl">🔒</span>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                            Secure Escrow Payment
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <p>Your payment will be held securely in escrow until the project is completed to your satisfaction.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-md p-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    Card Information
                </label>
                <div className="p-3 border border-gray-300 rounded-md">
                    <CardElement options={cardElementOptions} />
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <span className="text-red-400 text-xl">❌</span>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                Payment Error
                            </h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>{error}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || processing || !clientSecret}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {processing ? (
                    <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing Payment...
                    </div>
                ) : (
                    `Pay $${project.agreed_amount.toLocaleString()} (Escrow)`
                )}
            </button>
        </form>
    );
}

export default function PaymentShow({ project, testCards, stripeKey }) {
    const [showTestCards, setShowTestCards] = useState(false);

    // Make stripe key available globally
    window.stripeKey = stripeKey;

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Payment for: {project.job.title}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Secure escrow payment with {project.freelancer.first_name} {project.freelancer.last_name}
                    </p>
                </div>
            }
        >
            <Head title={`Payment - ${project.job.title}`} />

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Payment Form */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold mb-6">Complete Payment</h3>
                                
                                <Elements stripe={stripePromise}>
                                    <PaymentForm project={project} />
                                </Elements>

                                {/* Test Cards for Demo */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <button
                                        onClick={() => setShowTestCards(!showTestCards)}
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        🧪 Show Test Cards for Demo
                                    </button>
                                    
                                    {showTestCards && (
                                        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                                            <h4 className="text-sm font-medium text-yellow-800 mb-2">
                                                Demo Test Cards (No Real Money)
                                            </h4>
                                            <div className="space-y-2 text-xs text-yellow-700">
                                                {testCards.map((card, index) => (
                                                    <div key={index} className="flex justify-between">
                                                        <span className="font-mono">{card.number}</span>
                                                        <span>{card.description}</span>
                                                    </div>
                                                ))}
                                                <p className="text-xs mt-2">
                                                    Use any future expiry date and any 3-digit CVC.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Project Summary */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold mb-6">Payment Summary</h3>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Project Value</span>
                                        <span className="font-semibold">${project.agreed_amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Platform Fee (5%)</span>
                                        <span className="font-semibold">${(project.agreed_amount * 0.05).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Freelancer Receives</span>
                                        <span className="font-semibold text-green-600">
                                            ${(project.agreed_amount * 0.95).toFixed(2)}
                                        </span>
                                    </div>
                                    <hr className="border-gray-200" />
                                    <div className="flex justify-between text-lg">
                                        <span className="font-semibold">Total Payment</span>
                                        <span className="font-bold text-blue-600">
                                            ${project.agreed_amount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h4 className="font-medium mb-3">Project Details</h4>
                                    <dl className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <dt className="text-gray-600">Freelancer</dt>
                                            <dd className="font-medium">
                                                {project.freelancer.first_name} {project.freelancer.last_name}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-gray-600">Duration</dt>
                                            <dd className="font-medium">{project.agreed_duration_days} days</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-gray-600">Deadline</dt>
                                            <dd className="font-medium">
                                                {project.deadline 
                                                    ? new Date(project.deadline).toLocaleDateString()
                                                    : 'Not set'
                                                }
                                            </dd>
                                        </div>
                                    </dl>
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h4 className="font-medium mb-3">How Escrow Works</h4>
                                    <div className="space-y-3 text-sm text-gray-600">
                                        <div className="flex items-start">
                                            <span className="text-blue-500 mr-2">1.</span>
                                            <span>Your payment is securely held in escrow</span>
                                        </div>
                                        <div className="flex items-start">
                                            <span className="text-blue-500 mr-2">2.</span>
                                            <span>Freelancer completes the work</span>
                                        </div>
                                        <div className="flex items-start">
                                            <span className="text-blue-500 mr-2">3.</span>
                                            <span>You approve the completed work</span>
                                        </div>
                                        <div className="flex items-start">
                                            <span className="text-blue-500 mr-2">4.</span>
                                            <span>Payment is released to freelancer</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <span className="text-green-400 text-xl">🛡️</span>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-green-800">
                                                100% Protected
                                            </h3>
                                            <div className="mt-2 text-sm text-green-700">
                                                <p>Your money is protected until you're completely satisfied with the work.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
