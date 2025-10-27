import { Head, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function GigWorkerOnboarding({ user, skillsTaxonomy }) {
    const [currentStep, setCurrentStep] = useState(0);
    const totalSteps = 7; // Changed from 8 (removed language step)

    const { data, setData, post, processing, errors } = useForm({
        // Step 1: Basic Info
        professional_title: '',
        hourly_rate: '',
        bio: '',
        profile_picture: null,

        // Step 2: Hierarchical Skills
        broad_category: '',
        specific_services: [],
        skills_with_experience: [],

        // Step 3: Portfolio
        portfolio_items: [],

        // Step 4: ID Verification & Address
        id_type: '',
        id_front_image: null,
        id_back_image: null,
        street_address: '',
        city: '',
        barangay: '',
        postal_code: '',
        kyc_country: '',

        // Step 5: Availability
        working_hours: {
            monday: { enabled: true, start: '09:00', end: '17:00' },
            tuesday: { enabled: true, start: '09:00', end: '17:00' },
            wednesday: { enabled: true, start: '09:00', end: '17:00' },
            thursday: { enabled: true, start: '09:00', end: '17:00' },
            friday: { enabled: true, start: '09:00', end: '17:00' },
            saturday: { enabled: false, start: '09:00', end: '17:00' },
            sunday: { enabled: false, start: '09:00', end: '17:00' },
        },
        timezone: 'Asia/Manila',
        preferred_communication: [],
        availability_notes: '',
    });

    // State for UI
    const [selectedSkillsForExperience, setSelectedSkillsForExperience] = useState([]);
    const [availableCategories, setAvailableCategories] = useState([]);
    const [detectedAddress, setDetectedAddress] = useState(null);
    const [availableServices, setAvailableServices] = useState([]);
    const [availableSkills, setAvailableSkills] = useState([]);

    // Load categories from taxonomy
    useEffect(() => {
        if (skillsTaxonomy && skillsTaxonomy.services) {
            setAvailableCategories(skillsTaxonomy.services);
        }
    }, [skillsTaxonomy]);

    // Update available services when broad category changes
    useEffect(() => {
        if (data.broad_category) {
            const selected = availableCategories.find(cat => cat.name === data.broad_category);
            if (selected) {
                setAvailableServices(selected.categories || []);
                setData('specific_services', []);
                setData('skills_with_experience', []);
                setAvailableSkills([]);
            }
        }
    }, [data.broad_category]);

    // Update available skills when specific services change
    useEffect(() => {
        if (data.specific_services.length > 0) {
            const allSkills = [];
            data.specific_services.forEach(serviceName => {
                const service = availableServices.find(s => s.name === serviceName);
                if (service && service.skills) {
                    service.skills.forEach(skill => {
                        if (!allSkills.includes(skill)) {
                            allSkills.push(skill);
                        }
                    });
                }
            });
            setAvailableSkills(allSkills);
        } else {
            setAvailableSkills([]);
        }
    }, [data.specific_services]);

    // Auto-detect address when reaching ID verification step
    useEffect(() => {
        const detectAddress = async () => {
            if (currentStep === 4) { // ID Verification step (now Step 4 after removing languages)
                try {
                    const response = await fetch('https://ipapi.co/json/');
                    const locationData = await response.json();
                    
                    // Pre-fill address fields
                    setData(prevData => ({
                        ...prevData,
                        street_address: locationData.city ? `${locationData.city}` : prevData.street_address,
                        city: locationData.city || prevData.city,
                        postal_code: locationData.postal || prevData.postal_code,
                        kyc_country: locationData.country_name || user.country || prevData.kyc_country
                    }));
                    
                    setDetectedAddress({
                        full: `${locationData.city}, ${locationData.region}, ${locationData.country_name}`,
                        city: locationData.city,
                        region: locationData.region,
                        postal: locationData.postal,
                        country: locationData.country_name
                    });
                } catch (error) {
                    console.error('Address detection failed:', error);
                }
            }
        };
        
        detectAddress();
    }, [currentStep]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('gig-worker.onboarding'), {
            forceFormData: true,
            onError: (errors) => {
                console.error('Onboarding submission errors:', errors);
                console.table(errors);
                
                const firstErrorField = Object.keys(errors)[0];
                if (firstErrorField) {
                    console.log(`First error on field: ${firstErrorField}`, errors[firstErrorField]);
                    
                    // Show user-friendly error message
                    let userMessage = 'Please fix the following errors:\n\n';
                    Object.keys(errors).forEach(field => {
                        userMessage += `• ${errors[field]}\n`;
                    });
                    alert(userMessage);
                    
                    // Navigate to the step with the error
                    if (firstErrorField.includes('professional_title') || firstErrorField.includes('hourly_rate') || firstErrorField.includes('bio') || firstErrorField.includes('profile_picture')) {
                        setCurrentStep(1);
                    } else if (firstErrorField.includes('skills') || firstErrorField.includes('broad_category') || firstErrorField.includes('specific_services')) {
                        setCurrentStep(2);
                    } else if (firstErrorField.includes('portfolio')) {
                        setCurrentStep(3);
                    } else if (firstErrorField.includes('id_') || firstErrorField.includes('address') || firstErrorField.includes('city') || firstErrorField.includes('postal')) {
                        setCurrentStep(4);
                    } else if (firstErrorField.includes('working_hours') || firstErrorField.includes('preferred_communication') || firstErrorField.includes('timezone')) {
                        setCurrentStep(5);
                    }
                }
            },
            onSuccess: () => {
                console.log('Onboarding completed successfully');
            }
        });
    };

    const handleSkip = () => {
        post(route('gig-worker.onboarding.skip'));
    };

    const nextStep = () => {
        if (currentStep < totalSteps - 1) {
            if (canProceedFromStep(currentStep)) {
                setCurrentStep(currentStep + 1);
            } else {
                // Show error message based on current step
                let errorMsg = 'Please complete all required fields before proceeding.';
                if (currentStep === 2) {
                    errorMsg = `Please select at least 3 skills with experience levels. You have selected ${data.skills_with_experience.length} skill(s).`;
                }
                alert(errorMsg);
            }
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const toggleSkillSelection = (skill) => {
        const exists = data.skills_with_experience.find(s => s.skill === skill);
        if (exists) {
            setData('skills_with_experience', data.skills_with_experience.filter(s => s.skill !== skill));
        } else {
            setData('skills_with_experience', [...data.skills_with_experience, {
                skill: skill,
                experience_level: 'intermediate'
            }]);
        }
    };

    const updateSkillExperience = (skill, level) => {
        setData('skills_with_experience', data.skills_with_experience.map(s =>
            s.skill === skill ? { ...s, experience_level: level } : s
        ));
    };

    const canProceedFromStep = (step) => {
        switch (step) {
            case 1: // Basic Info
                return data.professional_title && data.hourly_rate && data.bio && data.bio.length >= 50;
            case 2: // Skills
                return data.broad_category && 
                       data.specific_services.length >= 2 && 
                       data.skills_with_experience.length >= 3;
            case 4: // ID Verification
                return data.id_type && data.id_front_image && data.id_back_image && 
                       data.street_address && data.city && data.postal_code && data.kyc_country;
            case 5: // Availability
                return data.preferred_communication.length >= 1;
            default:
                return true;
        }
    };

    const addPortfolioItem = () => {
        setData('portfolio_items', [...data.portfolio_items, {
            title: '',
            description: '',
            project_url: '',
            project_type: 'other',
            images: []
        }]);
    };

    const removePortfolioItem = (index) => {
        setData('portfolio_items', data.portfolio_items.filter((_, i) => i !== index));
    };

    const updatePortfolioItem = (index, field, value) => {
        const updated = [...data.portfolio_items];
        updated[index][field] = value;
        setData('portfolio_items', updated);
    };

    const toggleService = (serviceName) => {
        if (data.specific_services.includes(serviceName)) {
            setData('specific_services', data.specific_services.filter(s => s !== serviceName));
        } else {
            setData('specific_services', [...data.specific_services, serviceName]);
        }
    };

    const toggleCommunication = (method) => {
        if (data.preferred_communication.includes(method)) {
            setData('preferred_communication', data.preferred_communication.filter(m => m !== method));
        } else {
            setData('preferred_communication', [...data.preferred_communication, method]);
        }
    };

    const toggleWorkingDay = (day) => {
        setData('working_hours', {
            ...data.working_hours,
            [day]: { ...data.working_hours[day], enabled: !data.working_hours[day].enabled }
        });
    };

    const updateWorkingHours = (day, field, value) => {
        setData('working_hours', {
            ...data.working_hours,
            [day]: { ...data.working_hours[day], [field]: value }
        });
    };

    const getStepTitle = () => {
        switch (currentStep) {
            case 0: return 'Welcome to WorkWise!';
            case 1: return 'Tell us about yourself';
            case 2: return 'Your Skills & Services';
            case 3: return 'Showcase Your Work';
            case 4: return 'Verify Your Identity';
            case 5: return 'Set Your Availability';
            case 6: return 'Review Your Profile';
            default: return 'Onboarding';
        }
    };

    const idTypes = [
        { value: 'national_id', label: 'National ID (PhilSys)' },
        { value: 'drivers_license', label: "Driver's License" },
        { value: 'passport', label: 'Passport' },
        { value: 'philhealth_id', label: 'PhilHealth ID' },
        { value: 'sss_id', label: 'SSS ID' },
        { value: 'umid', label: 'UMID' },
        { value: 'voters_id', label: "Voter's ID" },
        { value: 'prc_id', label: 'PRC ID' },
    ];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Gig Worker Onboarding
                </h2>
            }
        >
            <Head title="Gig Worker Onboarding" />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            {/* Progress Bar */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600">
                                        Step {currentStep + 1} of {totalSteps}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        {Math.round(((currentStep + 1) / totalSteps) * 100)}% Complete
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                                {getStepTitle()}
                            </h3>

                            <form onSubmit={handleSubmit}>
                                {/* Step 0: Welcome / Tutorial */}
                                {currentStep === 0 && (
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                                            <h4 className="text-lg font-semibold text-blue-900 mb-4">
                                                🎉 Welcome to the WorkWise Community!
                                            </h4>
                                            <p className="text-gray-700 mb-4">
                                                Let's set up your professional profile in just a few steps. This will help employers find and hire you for projects.
                                            </p>
                                            <div className="space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">Basic Information</p>
                                                        <p className="text-sm text-gray-600">Tell us about your professional background</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">Skills & Services</p>
                                                        <p className="text-sm text-gray-600">Select your expertise areas and skill levels</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">Portfolio & Verification</p>
                                                        <p className="text-sm text-gray-600">Showcase your work and verify your identity</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">Availability</p>
                                                        <p className="text-sm text-gray-600">Let employers know when you're available</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <p className="text-sm text-yellow-800">
                                                <strong>Note:</strong> Your profile will be reviewed by our team. ID verification is required to start bidding on projects.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Step 1: Basic Information */}
                                {currentStep === 1 && (
                                    <div className="space-y-6">
                                        <div>
                                            <InputLabel htmlFor="professional_title" value="Professional Title *" />
                                            <select
                                                id="professional_title"
                                                value={data.professional_title}
                                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                                onChange={(e) => setData('professional_title', e.target.value)}
                                                required
                                            >
                                                <option value="">Select your professional title</option>
                                                <option value="Web Developer">Web Developer</option>
                                                <option value="Mobile Developer">Mobile Developer</option>
                                                <option value="Frontend Developer">Frontend Developer</option>
                                                <option value="Backend Developer">Backend Developer</option>
                                                <option value="Full Stack Developer">Full Stack Developer</option>
                                                <option value="UI/UX Designer">UI/UX Designer</option>
                                                <option value="Graphic Designer">Graphic Designer</option>
                                                <option value="Content Writer">Content Writer</option>
                                                <option value="Copywriter">Copywriter</option>
                                                <option value="Digital Marketer">Digital Marketer</option>
                                                <option value="SEO Specialist">SEO Specialist</option>
                                                <option value="Social Media Manager">Social Media Manager</option>
                                                <option value="Video Editor">Video Editor</option>
                                                <option value="Photographer">Photographer</option>
                                                <option value="Virtual Assistant">Virtual Assistant</option>
                                                <option value="Data Analyst">Data Analyst</option>
                                                <option value="Project Manager">Project Manager</option>
                                                <option value="Other">Other (specify in bio)</option>
                                            </select>
                                            <InputError message={errors.professional_title} className="mt-2" />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Select the title that best describes your primary skill or role
                                            </p>
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="hourly_rate" value="Hourly Rate (PHP) *" />
                                            <TextInput
                                                id="hourly_rate"
                                                type="number"
                                                value={data.hourly_rate}
                                                className="mt-1 block w-full"
                                                placeholder="500"
                                                min="5"
                                                onChange={(e) => setData('hourly_rate', e.target.value)}
                                                required
                                            />
                                            <InputError message={errors.hourly_rate} className="mt-2" />
                                            <p className="text-xs text-gray-500 mt-1">
                                                You can adjust this later. Consider your experience and market rates.
                                            </p>
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="bio" value="Professional Bio *" />
                                            <textarea
                                                id="bio"
                                                value={data.bio}
                                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                                rows="6"
                                                placeholder="Describe your experience, expertise, what makes you unique, and what you're passionate about..."
                                                onChange={(e) => setData('bio', e.target.value)}
                                                required
                                            />
                                            <InputError message={errors.bio} className="mt-2" />
                                            <div className="flex justify-between text-xs mt-1">
                                                <span className="text-gray-500">Minimum 50 characters</span>
                                                <span className={data.bio.length >= 50 ? 'text-green-600' : 'text-gray-500'}>
                                                    {data.bio.length}/50
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="profile_picture" value="Profile Photo (Optional)" />
                                            <input
                                                id="profile_picture"
                                                type="file"
                                                accept="image/*"
                                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                onChange={(e) => setData('profile_picture', e.target.files[0])}
                                            />
                                            <InputError message={errors.profile_picture} className="mt-2" />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Profiles with photos get 40% more responses!
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Hierarchical Skills Selection */}
                                {currentStep === 2 && (
                                    <div className="space-y-6">
                                        <p className="text-gray-600 text-center mb-4">
                                            Select your primary category, then choose the specific services you offer, and finally pick your skills.
                                        </p>

                                        {/* Broad Category Selection */}
                                        <div>
                                            <InputLabel value="1. Select Your Primary Category *" />
                                            <select
                                                value={data.broad_category}
                                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                                onChange={(e) => setData('broad_category', e.target.value)}
                                                required
                                            >
                                                <option value="">-- Choose a category --</option>
                                                {availableCategories.map((cat) => (
                                                    <option key={cat.id} value={cat.name}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.broad_category} className="mt-2" />
                                        </div>

                                        {/* Specific Services Selection */}
                                        {data.broad_category && (
                                            <div>
                                                <InputLabel value="2. Select Specific Services (Choose 2 or more) *" />
                                                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-md">
                                                    {availableServices.map((service) => (
                                                        <label
                                                            key={service.id}
                                                            className={`flex items-center p-3 rounded-md cursor-pointer transition-colors ${
                                                                data.specific_services.includes(service.name)
                                                                    ? 'bg-blue-100 border-2 border-blue-500'
                                                                    : 'bg-gray-50 border-2 border-gray-200 hover:bg-gray-100'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={data.specific_services.includes(service.name)}
                                                                onChange={() => toggleService(service.name)}
                                                                className="mr-2"
                                                            />
                                                            <span className="text-sm font-medium">{service.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <InputError message={errors.specific_services} className="mt-2" />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Selected: {data.specific_services.length} service(s)
                                                </p>
                                            </div>
                                        )}

                                        {/* Skills Selection with Experience Levels */}
                                        {data.specific_services.length > 0 && availableSkills.length > 0 && (
                                            <div>
                                                <InputLabel value="3. Select Your Skills & Set Experience Level (Choose 3 or more) *" />
                                                <p className="text-xs text-gray-600 mb-2">
                                                    Click on skills to add them, then set your experience level for each
                                                </p>
                                                <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-md p-3">
                                                    {availableSkills.map((skill, index) => {
                                                        const skillData = data.skills_with_experience.find(s => s.skill === skill);
                                                        const isSelected = !!skillData;

                                                        return (
                                                            <div
                                                                key={index}
                                                                className={`p-3 rounded-md border-2 transition-all ${
                                                                    isSelected
                                                                        ? 'bg-blue-50 border-blue-500'
                                                                        : 'bg-white border-gray-200'
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <label className="flex items-center cursor-pointer flex-1">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isSelected}
                                                                            onChange={() => toggleSkillSelection(skill)}
                                                                            className="mr-2"
                                                                        />
                                                                        <span className="font-medium text-gray-900">{skill}</span>
                                                                    </label>

                                                                    {isSelected && (
                                                                        <div className="flex gap-2 ml-4">
                                                                            {['beginner', 'intermediate', 'expert'].map((level) => (
                                                                                <button
                                                                                    key={level}
                                                                                    type="button"
                                                                                    onClick={() => updateSkillExperience(skill, level)}
                                                                                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                                                                        skillData.experience_level === level
                                                                                            ? 'bg-blue-600 text-white'
                                                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                                    }`}
                                                                                >
                                                                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <InputError message={errors.skills_with_experience} className="mt-2" />
                                                <p className={`text-xs mt-1 font-medium ${
                                                    data.skills_with_experience.length < 3 
                                                        ? 'text-red-600' 
                                                        : 'text-green-600'
                                                }`}>
                                                    Selected: {data.skills_with_experience.length} skill(s) (minimum 3 required)
                                                    {data.skills_with_experience.length < 3 && (
                                                        <span className="block mt-1">⚠️ You need {3 - data.skills_with_experience.length} more skill(s) to proceed</span>
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 3: Portfolio */}
                                {currentStep === 3 && (
                                    <div className="space-y-6">
                                        <div className="text-center">
                                            <p className="text-gray-600 mb-4">
                                                Add your best work samples to stand out (optional but recommended)
                                            </p>
                                            <button
                                                type="button"
                                                onClick={addPortfolioItem}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                                            >
                                                + Add Portfolio Item
                                            </button>
                                        </div>

                                        {data.portfolio_items.length === 0 && (
                                            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                                <p className="text-gray-500">No portfolio items yet. Click "Add Portfolio Item" to start showcasing your work.</p>
                                            </div>
                                        )}

                                        {data.portfolio_items.map((item, index) => (
                                            <div key={index} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="font-semibold text-gray-900">Portfolio Item #{index + 1}</h4>
                                                    <button
                                                        type="button"
                                                        onClick={() => removePortfolioItem(index)}
                                                        className="text-red-600 hover:text-red-800 font-bold"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>

                                                <div className="space-y-3">
                                                    <div>
                                                        <InputLabel value="Project Title *" />
                                                        <TextInput
                                                            type="text"
                                                            value={item.title}
                                                            className="mt-1 block w-full"
                                                            placeholder="e.g., E-commerce Website Redesign"
                                                            onChange={(e) => updatePortfolioItem(index, 'title', e.target.value)}
                                                        />
                                                    </div>

                                                    <div>
                                                        <InputLabel value="Project Type *" />
                                                        <select
                                                            value={item.project_type}
                                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                                            onChange={(e) => updatePortfolioItem(index, 'project_type', e.target.value)}
                                                        >
                                                            <option value="web">Web Development</option>
                                                            <option value="mobile">Mobile App</option>
                                                            <option value="design">Design</option>
                                                            <option value="writing">Writing/Content</option>
                                                            <option value="other">Other</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <InputLabel value="Description" />
                                                        <textarea
                                                            value={item.description}
                                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                                            rows="3"
                                                            placeholder="Brief description of the project..."
                                                            onChange={(e) => updatePortfolioItem(index, 'description', e.target.value)}
                                                        />
                                                    </div>

                                                    <div>
                                                        <InputLabel value="Project URL" />
                                                        <TextInput
                                                            type="url"
                                                            value={item.project_url}
                                                            className="mt-1 block w-full"
                                                            placeholder="https://example.com"
                                                            onChange={(e) => updatePortfolioItem(index, 'project_url', e.target.value)}
                                                        />
                                                    </div>

                                                    <div>
                                                        <InputLabel value="Project Images (Max 5)" />
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                                            onChange={(e) => updatePortfolioItem(index, 'images', Array.from(e.target.files).slice(0, 5))}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Step 4: ID Verification */}
                                {currentStep === 4 && (
                                    <div className="space-y-6">
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <p className="text-sm text-blue-800">
                                                <strong>Why verify?</strong> ID verification helps build trust and is required to bid on projects. Your information is kept secure.
                                            </p>
                                        </div>

                                        <div>
                                            <InputLabel value="Select ID Type *" />
                                            <select
                                                value={data.id_type}
                                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                                onChange={(e) => setData('id_type', e.target.value)}
                                                required
                                            >
                                                <option value="">-- Choose an ID type --</option>
                                                {idTypes.map((type) => (
                                                    <option key={type.value} value={type.value}>
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.id_type} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel value="Front of ID *" />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                                                onChange={(e) => setData('id_front_image', e.target.files[0])}
                                                required
                                            />
                                            <InputError message={errors.id_front_image} className="mt-2" />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Max size: 5MB. Ensure all details are clearly visible.
                                            </p>
                                        </div>

                                        <div>
                                            <InputLabel value="Back of ID *" />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                                                onChange={(e) => setData('id_back_image', e.target.files[0])}
                                                required
                                            />
                                            <InputError message={errors.id_back_image} className="mt-2" />
                                        </div>

                                        {/* Address Information Section */}
                                        <div className="border-t pt-6 mt-6">
                                            <h4 className="text-lg font-semibold text-gray-800 mb-4">
                                                Complete Address
                                            </h4>
                                            
                                            {detectedAddress && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <p className="text-sm font-semibold text-blue-900 mb-1">
                                                                📍 Detected Location:
                                                            </p>
                                                            <p className="text-sm text-blue-800">
                                                                {detectedAddress.full}
                                                            </p>
                                                            <p className="text-xs text-blue-600 mt-1">
                                                                We've pre-filled your address based on your location. You can edit if needed.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <p className="text-sm text-gray-600 mb-4">
                                                Please provide your complete address for verification purposes.
                                            </p>

                                            <div className="space-y-4">
                                                <div>
                                                    <InputLabel value="Street Address *" />
                                                    <TextInput
                                                        value={data.street_address}
                                                        className="mt-1 block w-full"
                                                        onChange={(e) => setData('street_address', e.target.value)}
                                                        placeholder="House/Unit No., Street Name"
                                                        required
                                                    />
                                                    <InputError message={errors.street_address} className="mt-2" />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <InputLabel value="City *" />
                                                        <TextInput
                                                            value={data.city}
                                                            className="mt-1 block w-full"
                                                            onChange={(e) => setData('city', e.target.value)}
                                                            placeholder="City"
                                                            required
                                                        />
                                                        <InputError message={errors.city} className="mt-2" />
                                                    </div>

                                                    <div>
                                                        <InputLabel value="Barangay (Optional)" />
                                                        <TextInput
                                                            value={data.barangay}
                                                            className="mt-1 block w-full"
                                                            onChange={(e) => setData('barangay', e.target.value)}
                                                            placeholder="Barangay"
                                                        />
                                                        <InputError message={errors.barangay} className="mt-2" />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <InputLabel value="Postal/ZIP Code *" />
                                                        <TextInput
                                                            value={data.postal_code}
                                                            className="mt-1 block w-full"
                                                            onChange={(e) => setData('postal_code', e.target.value)}
                                                            placeholder="Postal Code"
                                                            required
                                                        />
                                                        <InputError message={errors.postal_code} className="mt-2" />
                                                    </div>

                                                    <div>
                                                        <InputLabel value="Country *" />
                                                        <TextInput
                                                            value={data.kyc_country}
                                                            className="mt-1 block w-full"
                                                            onChange={(e) => setData('kyc_country', e.target.value)}
                                                            placeholder="Country"
                                                            required
                                                        />
                                                        <InputError message={errors.kyc_country} className="mt-2" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <p className="text-sm text-yellow-800">
                                                <strong>Privacy Note:</strong> Your ID and address will only be viewed by WorkWise admin for verification purposes and will be stored securely.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Step 5: Availability */}
                                {currentStep === 5 && (
                                    <div className="space-y-6">
                                        <p className="text-gray-600 text-center">
                                            Let employers know when you're available to work
                                        </p>

                                        <div>
                                            <InputLabel value="Timezone *" />
                                            <select
                                                value={data.timezone}
                                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                                onChange={(e) => setData('timezone', e.target.value)}
                                                required
                                            >
                                                <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
                                                <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                                                <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                                                <option value="America/New_York">America/New York (GMT-5)</option>
                                                <option value="America/Los_Angeles">America/Los Angeles (GMT-8)</option>
                                                <option value="Europe/London">Europe/London (GMT+0)</option>
                                            </select>
                                            <InputError message={errors.timezone} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel value="Working Hours *" />
                                            <p className="text-xs text-gray-600 mb-2">Select days and set your typical working hours</p>
                                            <div className="space-y-2">
                                                {Object.entries(data.working_hours).map(([day, hours]) => (
                                                    <div key={day} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                                                        <label className="flex items-center w-32">
                                                            <input
                                                                type="checkbox"
                                                                checked={hours.enabled}
                                                                onChange={() => toggleWorkingDay(day)}
                                                                className="mr-2"
                                                            />
                                                            <span className="capitalize font-medium">{day}</span>
                                                        </label>
                                                        {hours.enabled && (
                                                            <>
                                                                <input
                                                                    type="time"
                                                                    value={hours.start}
                                                                    onChange={(e) => updateWorkingHours(day, 'start', e.target.value)}
                                                                    className="border-gray-300 rounded-md text-sm"
                                                                />
                                                                <span>to</span>
                                                                <input
                                                                    type="time"
                                                                    value={hours.end}
                                                                    onChange={(e) => updateWorkingHours(day, 'end', e.target.value)}
                                                                    className="border-gray-300 rounded-md text-sm"
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <InputLabel value="Preferred Communication Methods (Select at least 1) *" />
                                            <div className="mt-2 grid grid-cols-2 gap-2">
                                                {[
                                                    { value: 'email', label: '📧 Email', icon: '📧' },
                                                    { value: 'chat', label: '💬 Chat/Messaging', icon: '💬' },
                                                    { value: 'video_call', label: '📹 Video Call', icon: '📹' },
                                                    { value: 'phone', label: '📞 Phone Call', icon: '📞' }
                                                ].map((method) => (
                                                    <label
                                                        key={method.value}
                                                        className={`flex items-center p-3 rounded-md cursor-pointer transition-colors ${
                                                            data.preferred_communication.includes(method.value)
                                                                ? 'bg-blue-100 border-2 border-blue-500'
                                                                : 'bg-gray-50 border-2 border-gray-200 hover:bg-gray-100'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={data.preferred_communication.includes(method.value)}
                                                            onChange={() => toggleCommunication(method.value)}
                                                            className="mr-2"
                                                        />
                                                        <span className="text-sm font-medium">{method.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            <InputError message={errors.preferred_communication} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel value="Additional Availability Notes (Optional)" />
                                            <textarea
                                                value={data.availability_notes}
                                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                                rows="3"
                                                placeholder="e.g., I can be flexible with urgent projects, prefer morning meetings, etc."
                                                onChange={(e) => setData('availability_notes', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Step 6: Profile Preview */}
                                {currentStep === 6 && (
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                                            <h4 className="text-lg font-semibold text-green-900 mb-2">
                                                ✨ You're Almost Done!
                                            </h4>
                                            <p className="text-gray-700">
                                                Review your profile below. Once submitted, our team will review your information and verify your ID.
                                            </p>
                                        </div>

                                        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                                            <div>
                                                <h5 className="font-semibold text-gray-900 mb-2">Basic Information</h5>
                                                <div className="text-sm space-y-1 text-gray-700">
                                                    <p><strong>Title:</strong> {data.professional_title || 'Not set'}</p>
                                                    <p><strong>Hourly Rate:</strong> ₱{data.hourly_rate || '0'}/hour</p>
                                                    <p><strong>Bio:</strong> {data.bio ? `${data.bio.substring(0, 100)}...` : 'Not set'}</p>
                                                </div>
                                            </div>

                                            <div className="border-t pt-4">
                                                <h5 className="font-semibold text-gray-900 mb-2">Skills & Services</h5>
                                                <div className="text-sm space-y-1 text-gray-700">
                                                    <p><strong>Category:</strong> {data.broad_category || 'Not selected'}</p>
                                                    <p><strong>Services:</strong> {data.specific_services.length} selected</p>
                                                    <p><strong>Skills:</strong> {data.skills_with_experience.length} skills with experience levels</p>
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {data.skills_with_experience.slice(0, 10).map((skill, i) => (
                                                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                                                {skill.skill} ({skill.experience_level})
                                                            </span>
                                                        ))}
                                                        {data.skills_with_experience.length > 10 && (
                                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                                                +{data.skills_with_experience.length - 10} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t pt-4">
                                                <h5 className="font-semibold text-gray-900 mb-2">Portfolio</h5>
                                                <p className="text-sm text-gray-700">
                                                    {data.portfolio_items.length} portfolio item(s) added
                                                </p>
                                            </div>

                                            <div className="border-t pt-4">
                                                <h5 className="font-semibold text-gray-900 mb-2">ID Verification</h5>
                                                <p className="text-sm text-gray-700">
                                                    {data.id_type ? `${idTypes.find(t => t.value === data.id_type)?.label} - Pending verification` : 'Not uploaded'}
                                                </p>
                                            </div>

                                            <div className="border-t pt-4">
                                                <h5 className="font-semibold text-gray-900 mb-2">Availability</h5>
                                                <div className="text-sm space-y-1 text-gray-700">
                                                    <p><strong>Timezone:</strong> {data.timezone}</p>
                                                    <p><strong>Working Days:</strong> {Object.entries(data.working_hours).filter(([_, h]) => h.enabled).length} days/week</p>
                                                    <p><strong>Communication:</strong> {data.preferred_communication.join(', ')}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <p className="text-sm text-yellow-800">
                                                After submission, your profile will be reviewed within 24-48 hours. You'll receive a notification once approved!
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Buttons */}
                                <div className="flex justify-between mt-8 pt-6 border-t">
                                    <div>
                                        {currentStep > 0 && (
                                            <button
                                                type="button"
                                                onClick={prevStep}
                                                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                                            >
                                                ← Previous
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        {currentStep < totalSteps - 1 ? (
                                            <button
                                                type="button"
                                                onClick={nextStep}
                                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                            >
                                                Next →
                                            </button>
                                        ) : (
                                            <PrimaryButton disabled={processing}>
                                                {processing ? 'Submitting...' : 'Submit Profile'}
                                            </PrimaryButton>
                                        )}
                                        
                                        {currentStep === 0 && (
                                            <button
                                                type="button"
                                                onClick={handleSkip}
                                                disabled={processing}
                                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                            >
                                                Skip for now
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

