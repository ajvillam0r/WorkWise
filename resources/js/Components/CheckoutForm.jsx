import React, { useState } from 'react';
import {
    PaymentElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';

const CheckoutForm = ({ amount, clientSecret, currency, onSuccess, onCancel }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);
        setError(null);

        const { error: submitError } = await elements.submit();
        if (submitError) {
            setError(submitError.message);
            setProcessing(false);
            return;
        }

        const { error: confirmError } = await stripe.confirmPayment({
            elements,
            clientSecret,
            confirmParams: {
                return_url: window.location.origin + '/deposits/confirm',
            },
            redirect: 'if_required'
        });

        if (confirmError) {
            setError(confirmError.message);
            setProcessing(false);
        } else {
            // Payment succeeded
            if (onSuccess) {
                onSuccess();
            }
        }
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
                            Secure Payment
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <p>Your payment information is encrypted and secure.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Amount:</span>
                    {/* <span className="text-lg font-bold text-gray-900">
                        {currency.symbol}{parseFloat(amount).toFixed(2)}
                    </span> */}
                    <span className="text-lg font-bold text-gray-900">
                      ₱{parseFloat(amount).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>

                </div>
            </div>

            <PaymentElement 
                options={{
                    layout: 'tabs',
                    paymentMethodOrder: ['card'],
                }}
            />

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="text-sm text-red-600">
                        {error}
                    </div>
                </div>
            )}

            <div className="flex space-x-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!stripe || processing}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                    {/* {processing ? 'Processing...' : `Pay ${currency.symbol}${parseFloat(amount).toFixed(2)}`} */}
                    {processing 
                          ? 'Processing...' 
                          : `Pay ${currency.symbol}${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}

                </button>
            </div>
        </form>
    );
};

export default CheckoutForm;
