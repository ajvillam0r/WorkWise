import Recommendations from "@/Pages/AI/Recommendations";

export default function AimatchGigWorker({ recommendations, skills, hasError }) {
    return (
        <Recommendations
            recommendations={recommendations}
            userType="gig_worker"
            skills={skills}
            hasError={hasError}
            pageTitle="AI Match"
            bannerTitle="AI Match: Relevance"
            bannerDescription="Our AI analyzes your skills, experience, and professional background to find job opportunities. Match scores are based on skill compatibility and experience alignment. For employer quality signals, use AI Recommendations."
        />
    );
}
