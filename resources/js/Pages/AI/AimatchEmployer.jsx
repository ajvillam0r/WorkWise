import Recommendations from "@/Pages/AI/Recommendations";

export default function AimatchEmployer({ recommendations, skills, hasError }) {
    return (
        <Recommendations
            recommendations={recommendations}
            userType="employer"
            skills={skills}
            hasError={hasError}
        />
    );
}
