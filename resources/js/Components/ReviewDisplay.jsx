import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import InputError from './InputError';

const ReviewDisplay = ({ 
    review, 
    showReplyOption = false, 
    currentUser = null,
    onReplySubmitted = null 
}) => {
    const [showReplyForm, setShowReplyForm] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        reply: '',
    });

    const handleReplySubmit = (e) => {
        e.preventDefault();
        
        post(`/api/reviews/${review.id}/reply`, {
            onSuccess: () => {
                reset();
                setShowReplyForm(false);
                onReplySubmitted && onReplySubmitted();
            },
        });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const StarDisplay = ({ rating }) => {
        return (
            <div className="flex items-center">
                <div className="flex text-yellow-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>
                            ★
                        </span>
                    ))}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900">{rating}</span>
            </div>
        );
    };

    const canReply = showReplyOption && 
                    currentUser && 
                    currentUser.id === review.reviewee_id && 
                    currentUser.user_type === 'gig_worker' && 
                    !review.gig_worker_reply;

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            {/* Review Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                        <StarDisplay rating={review.rating} />
                        {review.review_title && (
                            <span className="text-gray-500">—</span>
                        )}
                        {review.review_title && (
                            <h3 className="font-medium text-gray-900">{review.review_title}</h3>
                        )}
                    </div>
                    
                    <div className="text-sm text-gray-600">
                        <span className="font-medium">
                            {review.reviewer_type === 'employer' ? 'Employer' : 'Gig Worker'}: 
                        </span>
                        <span className="ml-1">
                            {review.reviewer.first_name} {review.reviewer.last_name}
                        </span>
                        {review.reviewer.location && (
                            <span className="ml-1">
                                , {review.reviewer.location}
                            </span>
                        )}
                    </div>
                    
                    {review.project && (
                        <div className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Project:</span>
                            <span className="ml-1">{review.project.title}</span>
                            <span className="ml-2 text-gray-500">
                                ({formatDate(review.created_at)})
                            </span>
                        </div>
                    )}
                </div>
                
                {/* Review Status Indicator */}
                <div className="flex-shrink-0">
                    {review.mutual_review_completed ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Mutual Review
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Single Review
                        </span>
                    )}
                </div>
            </div>

            {/* Review Comment */}
            {review.comment && (
                <div className="mb-4">
                    <blockquote className="text-gray-700 italic border-l-4 border-gray-200 pl-4">
                        "{review.comment}"
                    </blockquote>
                </div>
            )}

            {/* Gig Worker Reply */}
            {review.gig_worker_reply && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                        <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">Gig Worker Reply</span>
                        <span className="ml-2 text-xs text-gray-500">
                            {formatDate(review.replied_at)}
                        </span>
                    </div>
                    <p className="text-sm text-gray-700">{review.gig_worker_reply}</p>
                </div>
            )}

            {/* Reply Form */}
            {canReply && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    {!showReplyForm ? (
                        <button
                            onClick={() => setShowReplyForm(true)}
                            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                        >
                            Reply to this review
                        </button>
                    ) : (
                        <form onSubmit={handleReplySubmit} className="space-y-3">
                            <div>
                                <label htmlFor="reply" className="block text-sm font-medium text-gray-700 mb-1">
                                    Your Reply
                                </label>
                                <textarea
                                    id="reply"
                                    rows={3}
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                    placeholder="Share your perspective or clarify any points..."
                                    value={data.reply}
                                    onChange={(e) => setData('reply', e.target.value)}
                                    maxLength={500}
                                />
                                <div className="mt-1 text-xs text-gray-500 text-right">
                                    {data.reply.length}/500 characters
                                </div>
                                <InputError message={errors.reply} className="mt-1" />
                            </div>
                            
                            <div className="flex items-center space-x-3">
                                <PrimaryButton 
                                    type="submit" 
                                    disabled={processing || !data.reply.trim()}
                                    className="text-sm"
                                >
                                    {processing ? 'Posting...' : 'Post Reply'}
                                </PrimaryButton>
                                <SecondaryButton 
                                    type="button"
                                    onClick={() => {
                                        setShowReplyForm(false);
                                        reset();
                                    }}
                                    className="text-sm"
                                >
                                    Cancel
                                </SecondaryButton>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* Helpful Actions */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <span className="text-xs text-gray-500">
                        Review #{review.id}
                    </span>
                    {review.is_featured && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Featured Review
                        </span>
                    )}
                </div>
                
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                    {review.helpfulness_score > 0 && (
                        <span>{review.helpfulness_score} found helpful</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewDisplay;