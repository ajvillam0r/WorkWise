import Recommendations from "@/Pages/AI/Recommendations";

export default function AimatchGigWorker({ recommendations, skills, hasError }) {
    return (
        <Recommendations
            recommendations={recommendations}
            userType="gig_worker"
            skills={skills}
            hasError={hasError}
        />
    );
}
