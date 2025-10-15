import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReviewDisplay from './ReviewDisplay';
import LoadingSpinner from './LoadingSpinner';

const UserReviewsSection = ({ 
    user, 
    currentUser = null, 
    showTitle = true,
    maxReviews = null 
}) => {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        fetchUserReviews();
        fetchUserStats();
    }, [user.id]);

    const fetchUserReviews = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/public/users/${user.id}/reviews`);
            setReviews(response.data.reviews || []);
        } catch (err) {
            setError('Failed to load reviews');
            console.error('Error fetching reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserStats = async () => {
        try {
            const response = await axios.get(`/api/public/users/${user.id}/reviews/stats`);
            setStats(response.data);
        } catch (err) {
            console.error('Error fetching review stats:', err);
        }
    };

    const handleReplySubmitted = () => {
        // Refresh reviews after a reply is submitted
        fetchUserReviews();
    };

    const displayedReviews = maxReviews && !showAll 
        ? reviews.slice(0, maxReviews) 
        : reviews;

    const shouldShowViewMore = maxReviews && reviews.length > maxReviews && !showAll;
    const shouldShowViewLess = maxReviews && showAll && reviews.length > maxReviews;

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-center text-red-600">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    const ReviewStats = () => {
        if (!stats) return null;

        return (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-indigo-600">
                            {stats.average_rating ? stats.average_rating.toFixed(1) : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Average Rating</div>
                        {stats.average_rating && (
                            <div className="flex justify-center mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span 
                                        key={star} 
                                        className={star <= Math.round(stats.average_rating) ? 'text-yellow-400' : 'text-gray-300'}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{stats.total_reviews}</div>
                        <div className="text-sm text-gray-600">Total Reviews</div>
                    </div>
                    
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.positive_reviews}</div>
                        <div className="text-sm text-gray-600">Positive Reviews</div>
                    </div>
                    
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.mutual_reviews}</div>
                        <div className="text-sm text-gray-600">Mutual Reviews</div>
                    </div>
                </div>
                
                {stats.rating_distribution && (
                    <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Rating Distribution</h4>
                        <div className="space-y-1">
                            {[5, 4, 3, 2, 1].map((rating) => {
                                const count = stats.rating_distribution[rating] || 0;
                                const percentage = stats.total_reviews > 0 
                                    ? (count / stats.total_reviews) * 100 
                                    : 0;
                                
                                return (
                                    <div key={rating} className="flex items-center text-sm">
                                        <span className="w-8 text-gray-600">{rating}★</span>
                                        <div className="flex-1 mx-2 bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-yellow-400 h-2 rounded-full" 
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                        <span className="w-8 text-gray-600 text-right">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {showTitle && (
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Recent Reviews {user.user_type === 'gig_worker' ? 'from Employers' : 'from Gig Workers'}
                    </h2>
                    {reviews.length > 0 && (
                        <span className="text-sm text-gray-500">
                            {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            )}

            <ReviewStats />

            {reviews.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.456L3 21l2.544-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
                    <p className="text-gray-500">
                        {user.user_type === 'gig_worker' 
                            ? 'This gig worker hasn\'t received any reviews from employers yet.' 
                            : 'This employer hasn\'t received any reviews from gig workers yet.'
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {displayedReviews.map((review) => (
                        <ReviewDisplay
                            key={review.id}
                            review={review}
                            showReplyOption={true}
                            currentUser={currentUser}
                            onReplySubmitted={handleReplySubmitted}
                        />
                    ))}
                    
                    {shouldShowViewMore && (
                        <div className="text-center pt-4">
                            <button
                                onClick={() => setShowAll(true)}
                                className="text-indigo-600 hover:text-indigo-500 font-medium text-sm"
                            >
                                View all {reviews.length} reviews
                            </button>
                        </div>
                    )}
                    
                    {shouldShowViewLess && (
                        <div className="text-center pt-4">
                            <button
                                onClick={() => setShowAll(false)}
                                className="text-indigo-600 hover:text-indigo-500 font-medium text-sm"
                            >
                                Show fewer reviews
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserReviewsSection;