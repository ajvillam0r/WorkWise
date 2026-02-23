import React, { memo, useState } from 'react';
import EditableField from '@/Components/EditableField';
import SectionHeader from '@/Components/SectionHeader';
import ArrayFieldManager from '@/Components/ArrayFieldManager';
import SkillAutocompleteInput from '@/Components/SkillAutocompleteInput';
import PortfolioGrid from '@/Components/PortfolioGrid';
import { extractFileName } from '@/utils/fileHelpers';

// Common skills list for autocomplete
const COMMON_SKILLS = [
    'JavaScript', 'React', 'Vue.js', 'Angular', 'Node.js', 'PHP', 'Laravel', 'Python', 'Django',
    'Java', 'Spring Boot', 'C#', '.NET', 'Ruby', 'Ruby on Rails', 'Go', 'Rust', 'TypeScript',
    'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap', 'SASS', 'LESS',
    'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Firebase', 'SQL Server',
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD',
    'Git', 'GitHub', 'GitLab', 'Bitbucket',
    'REST API', 'GraphQL', 'WebSockets', 'Microservices',
    'UI/UX Design', 'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator',
    'Content Writing', 'Copywriting', 'SEO', 'Digital Marketing', 'Social Media Marketing',
    'Video Editing', 'After Effects', 'Premiere Pro', 'Final Cut Pro',
    'Data Analysis', 'Excel', 'Power BI', 'Tableau', 'SQL',
    'Project Management', 'Agile', 'Scrum', 'Jira', 'Trello',
    'WordPress', 'Shopify', 'WooCommerce', 'Magento',
    'Mobile Development', 'React Native', 'Flutter', 'Swift', 'Kotlin',
    'Testing', 'Jest', 'Cypress', 'Selenium', 'Unit Testing'
].sort();

const ProfessionalTab = memo(function ProfessionalTab({
    data,
    setData,
    errors,
    isGigWorker,
    isEditing,
    processing,
    hasChanges,
    onEdit,
    onCancel,
    onSave,
    user,
}) {
    const [skillSearchInput, setSkillSearchInput] = useState('');

    const handleSkillSelect = (skill) => {
        const existingSkills = data.skills_with_experience || [];
        if (!existingSkills.find(s => s.skill === skill)) {
            setData('skills_with_experience', [
                ...existingSkills,
                { skill, experience_level: 'intermediate' }
            ]);
        }
    };

    return (
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-8">
                <SectionHeader
                    title={isGigWorker ? 'Professional Information' : 'Business Information'}
                    description={isGigWorker
                        ? 'Showcase your skills, experience, and professional details'
                        : 'Tell us about your business and project requirements'
                    }
                    isEditing={isEditing}
                    hasChanges={hasChanges}
                    processing={processing}
                    onEdit={onEdit}
                    onCancel={onCancel}
                    onSave={onSave}
                />

                <div className="space-y-6">
                    {isGigWorker ? (
                        <>
                            {/* Professional Title */}
                            <EditableField
                                label="Professional Title"
                                id="professional_title"
                                type="text"
                                value={data.professional_title}
                                onChange={(e) => setData('professional_title', e.target.value)}
                                disabled={!isEditing}
                                required
                                placeholder="e.g., Full Stack Developer, UI/UX Designer"
                                error={errors.professional_title}
                                helpText="This will be displayed prominently on your profile"
                                debounceMs={300}
                            />

                            {/* Hourly Rate */}
                            <div>
                                <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-700 mb-2">
                                    Hourly Rate (PHP) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                                    <input
                                        type="number"
                                        id="hourly_rate"
                                        value={data.hourly_rate}
                                        onChange={(e) => setData('hourly_rate', e.target.value)}
                                        disabled={!isEditing}
                                        className="w-full pl-8 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="25.00"
                                        min="5"
                                        max="500"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <p className="mt-2 text-sm text-gray-500">
                                    Set your standard hourly rate. You can adjust this for specific projects.
                                </p>
                                {errors.hourly_rate && <p className="mt-2 text-sm text-red-600">{errors.hourly_rate}</p>}
                            </div>

                            {/* Skills & Services */}
                            <div className="border-t border-gray-200 pt-6 mt-6">
                                <h4 className="text-lg font-semibold text-gray-900 mb-4">Skills & Services</h4>
                                <p className="text-sm text-gray-600 mb-6">These details are used for AI-powered job matching</p>

                                <EditableField
                                    label="Category"
                                    id="broad_category"
                                    type="text"
                                    value={data.broad_category}
                                    onChange={(e) => setData('broad_category', e.target.value)}
                                    disabled={!isEditing}
                                    placeholder="e.g., Creative & Design Services"
                                    error={errors.broad_category}
                                    debounceMs={300}
                                />

                                <div className="mt-6">
                                    <ArrayFieldManager
                                        label="Specific Services"
                                        items={data.specific_services || []}
                                        onUpdate={(updated) => setData('specific_services', updated)}
                                        disabled={!isEditing}
                                        placeholder="Service name"
                                        addButtonText="+ Add Service"
                                    />
                                </div>

                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Skills with Experience Level
                                    </label>

                                    {isEditing && (
                                        <div className="mb-4">
                                            <p className="text-xs text-gray-600 mb-2">
                                                Quick add: Type to search and add skills
                                            </p>
                                            <SkillAutocompleteInput
                                                value={skillSearchInput}
                                                onChange={setSkillSearchInput}
                                                onSelect={handleSkillSelect}
                                                skills={COMMON_SKILLS}
                                                placeholder="Type to search skills (e.g., 'react', 'php')..."
                                                maxSuggestions={10}
                                            />
                                        </div>
                                    )}

                                    <ArrayFieldManager
                                        label=""
                                        items={data.skills_with_experience || []}
                                        onUpdate={(updated) => setData('skills_with_experience', updated)}
                                        disabled={!isEditing}
                                        itemType="object"
                                        objectFields={[
                                            { key: 'skill', label: 'Skill', placeholder: 'Skill name' },
                                            {
                                                key: 'experience_level',
                                                label: 'Level',
                                                type: 'select',
                                                options: [
                                                    { value: 'beginner', label: 'Beginner' },
                                                    { value: 'intermediate', label: 'Intermediate' },
                                                    { value: 'expert', label: 'Expert' }
                                                ],
                                                defaultValue: 'intermediate',
                                                width: 'w-48'
                                            }
                                        ]}
                                        addButtonText="+ Add Skill"
                                    />
                                </div>
                            </div>

                            {/* Portfolio Section */}
                            <div className="border-t border-gray-200 pt-6 mt-6">
                                <h4 className="text-lg font-semibold text-gray-900 mb-4">Portfolio</h4>
                                <PortfolioGrid
                                    portfolioLink={user?.portfolio_link}
                                    resumeFile={user?.resume_file}
                                    resumeFileName={extractFileName(user?.resume_file)}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Employer fields will go here */}
                            {/* Employer fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <EditableField
                                    label="Company Name"
                                    id="company_name"
                                    type="text"
                                    value={data.company_name}
                                    onChange={(e) => setData('company_name', e.target.value)}
                                    disabled={!isEditing}
                                    error={errors.company_name}
                                    placeholder="Enter your company name"
                                />

                                <EditableField
                                    label="Company Website"
                                    id="company_website"
                                    type="url"
                                    value={data.company_website}
                                    onChange={(e) => setData('company_website', e.target.value)}
                                    disabled={!isEditing}
                                    error={errors.company_website}
                                    placeholder="https://example.com"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <EditableField
                                    label="Industry"
                                    id="industry"
                                    type="text"
                                    value={data.industry}
                                    onChange={(e) => setData('industry', e.target.value)}
                                    disabled={!isEditing}
                                    error={errors.industry}
                                    placeholder="e.g., Technology, Healthcare"
                                />

                                <EditableField
                                    label="Company Size"
                                    id="company_size"
                                    type="select"
                                    value={data.company_size}
                                    onChange={(e) => setData('company_size', e.target.value)}
                                    disabled={!isEditing}
                                    error={errors.company_size}
                                    options={[
                                        { value: 'individual', label: 'Individual / Freelancer' },
                                        { value: '2-10', label: '2-10 Employees' },
                                        { value: '11-50', label: '11-50 Employees' },
                                        { value: '51-200', label: '51-200 Employees' },
                                        { value: '200+', label: '200+ Employees' },
                                    ]}
                                />
                            </div>

                            <div className="mt-6">
                                <EditableField
                                    label="Company Description"
                                    id="company_description"
                                    type="textarea"
                                    value={data.company_description}
                                    onChange={(e) => setData('company_description', e.target.value)}
                                    disabled={!isEditing}
                                    error={errors.company_description}
                                    placeholder="Tell us about your company..."
                                    rows={4}
                                />
                            </div>

                            <div className="mt-6 border-t border-gray-200 pt-6">
                                <h4 className="text-lg font-semibold text-gray-900 mb-4">Project Requirements</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <EditableField
                                        label="Work Type Needed"
                                        id="work_type_needed"
                                        type="text"
                                        value={data.work_type_needed}
                                        onChange={(e) => setData('work_type_needed', e.target.value)}
                                        disabled={!isEditing}
                                        error={errors.work_type_needed}
                                        placeholder="e.g., Web Development, Content Writing"
                                    />

                                    <EditableField
                                        label="Project Intent"
                                        id="project_intent"
                                        type="text"
                                        value={data.project_intent}
                                        onChange={(e) => setData('project_intent', e.target.value)}
                                        disabled={!isEditing}
                                        error={errors.project_intent}
                                        placeholder="Briefly describe your main project goals"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
});

export default ProfessionalTab;
