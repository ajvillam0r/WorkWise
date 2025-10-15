import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import InputLabel from './InputLabel';
import TextInput from './TextInput';
import InputError from './InputError';
import Modal from './Modal';

const ReviewSubmissionForm = ({ 
    project, 
    reviewee, 
    isOpen, 
    onClose, 
    onSuccess 
}) => {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);

    const { data, setData, post, processing, errors, reset } = useForm({
        project_id: project?.id || '',
        reviewee_id: reviewee?.id || '',
        rating: 0,
        review_title: '',
        comment: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        post('/api/reviews', {
            onSuccess: () => {
                reset();
                setRating(0);
                setHoveredRating(0);
                onSuccess && onSuccess();
                onClose();
            },
        });
    };

    const handleRatingClick = (value) => {
        setRating(value);
        setData('rating', value);
    };

    const handleClose = () => {
        reset();
        setRating(0);
        setHoveredRating(0);
        onClose();
    };

    const StarRating = () => {
        return (
            <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className={`text-2xl transition-colors duration-200 ${
                            star <= (hoveredRating || rating)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                        } hover:text-yellow-400`}
                        onClick={() => handleRatingClick(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                    >
                        ★
                    </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                    {rating > 0 && (
                        <>
                            {rating} star{rating !== 1 ? 's' : ''}
                            {rating === 5 && ' - Excellent'}
                            {rating === 4 && ' - Good'}
                            {rating === 3 && ' - Average'}
                            {rating === 2 && ' - Poor'}
                            {rating === 1 && ' - Very Poor'}
                        </>
                    )}
                </span>
            </div>
        );
    };

    if (!project || !reviewee) {
        return null;
    }

    return (
        <Modal show={isOpen} onClose={handleClose} maxWidth="2xl">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Submit Review
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Project Details</h3>
                    <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Project:</span> {project.title}
                    </p>
                    <p className="text-sm text-gray-600">
                        <span className="font-medium">
                            {reviewee.user_type === 'gig_worker' ? 'Gig Worker' : 'Employer'}:
                        </span> {reviewee.first_name} {reviewee.last_name}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <InputLabel htmlFor="rating" value="Rating *" />
                        <div className="mt-2">
                            <StarRating />
                        </div>
                        <InputError message={errors.rating} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="review_title" value="Review Title (Optional)" />
                        <TextInput
                            id="review_title"
                            type="text"
                            className="mt-1 block w-full"
                            value={data.review_title}
                            onChange={(e) => setData('review_title', e.target.value)}
                            placeholder="Brief summary of your experience"
                            maxLength={100}
                        />
                        <InputError message={errors.review_title} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="comment" value="Comment (Optional)" />
                        <textarea
                            id="comment"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            rows={4}
                            value={data.comment}
                            onChange={(e) => setData('comment', e.target.value)}
                            placeholder="Share your detailed experience..."
                            maxLength={1000}
                        />
                        <div className="mt-1 text-xs text-gray-500 text-right">
                            {data.comment.length}/1000 characters
                        </div>
                        <InputError message={errors.comment} className="mt-2" />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">
                                    Review Visibility
                                </h3>
                                <div className="mt-2 text-sm text-blue-700">
                                    <p>
                                        Your review will remain private until both parties submit their reviews, 
                                        or after 7 days if only one review is submitted. Once visible, 
                                        reviews help build trust in the WorkWise community.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                        <SecondaryButton onClick={handleClose} disabled={processing}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton 
                            type="submit" 
                            disabled={processing || rating === 0}
                            className="min-w-[120px]"
                        >
                            {processing ? 'Submitting...' : 'Submit Review'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default ReviewSubmissionForm;