import Recommendations from "@/Pages/AI/Recommendations";

export default function RecommendationsGigWorker({ recommendations, skills, hasError }) {
    return (
        <Recommendations
            recommendations={recommendations}
            userType="gig_worker"
            skills={skills}
            hasError={hasError}
            pageTitle="AI Recommendations"
            bannerTitle="AI Recommendations: Relevance + Quality"
            bannerDescription="Our AI evaluates jobs on fit and employer quality: ratings from workers, fair budgets, and review content to protect you from bad employers or low-quality posts."
        />
    );
}
