import { useState, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Step1Welcome, Step2ProfessionalInfo } from './Steps12';
import { Step3Skills, Step4Portfolio, Step5Review } from './Steps345';

const PROGRESS = { 1: 20, 2: 40, 3: 60, 4: 80, 5: 100 };

export default function GigWorkerOnboarding({ user, currentStep = 1 }) {
    const { props } = usePage();
    const csrfToken = props?.csrf_token ?? document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

    const [step, setStep] = useState(currentStep > 1 ? currentStep : 1);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const [data, setDataState] = useState({
        professional_title: user.professional_title || '',
        hourly_rate: user.hourly_rate || '',
        bio: user.bio || '',
        profile_picture_file: null,
        profile_picture_preview: user.profile_picture || user.profile_photo || null,
        skills_with_experience: user.skills_with_experience || [],
        portfolio_link: user.portfolio_link || '',
        resume_file: null,
        resume_file_name: null,
    });

    const setData = (key, value) => setDataState(prev => ({ ...prev, [key]: value }));

    // Build FormData from current state.
    // Files (profile_picture, resume_file) are only sent on the step where
    // they were selected. Step 5 sends text-only data as a safety net, since
    // File objects from earlier steps can't be reliably re-submitted.
    const buildFormData = (stepNum, isDraft = false) => {
        const fd = new FormData();
        fd.append('step', stepNum);
        fd.append('is_draft', isDraft ? '1' : '0');

        if (csrfToken) fd.append('_token', csrfToken);

        // Text fields — always send all of them so any step is a complete snapshot
        fd.append('professional_title', data.professional_title || '');
        fd.append('hourly_rate', data.hourly_rate || '');
        fd.append('bio', data.bio || '');
        fd.append('skills_with_experience', JSON.stringify(data.skills_with_experience || []));
        fd.append('portfolio_link', data.portfolio_link || '');

        // File fields — only include on the step where they were selected.
        // Do NOT re-send on step 5 (File objects may be stale/invalid by then).
        if (stepNum <= 4 && data.profile_picture_file) {
            fd.append('profile_picture', data.profile_picture_file);
        }
        if (stepNum === 4 && data.resume_file) {
            fd.append('resume_file', data.resume_file);
        }

        return fd;
    };

    // Validate current step before proceeding
    const validate = (stepNum) => {
        const errs = {};
        if (stepNum === 2) {
            if (!data.professional_title.trim()) errs.professional_title = 'Professional title is required.';
            if (!data.bio.trim() || data.bio.length < 10) errs.bio = 'Bio must be at least 10 characters.';
        }
        if (stepNum === 3) {
            if ((data.skills_with_experience || []).length < 3)
                errs.skills_with_experience = 'Please add at least 3 skills.';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const [saveError, setSaveError] = useState(null);

    const handleNext = () => {
        if (!validate(step)) return;

        // Step 1: no data to save yet, just advance
        if (step === 1) {
            setStep(s => s + 1);
            window.scrollTo(0, 0);
            return;
        }

        // All other steps: advance locally IMMEDIATELY, then save in background.
        // buildFormData always includes ALL accumulated data, so even if an earlier
        // background save silently failed, this one will catch up.
        const currentStep = step;
        setStep(s => s + 1);
        window.scrollTo(0, 0);

        router.post(route('gig-worker.onboarding.store'), buildFormData(currentStep), {
            forceFormData: true,
            preserveState: true,
            preserveScroll: true,
            ...(csrfToken && { headers: { 'X-CSRF-TOKEN': csrfToken } }),
            onSuccess: () => { setSaveError(null); },
            onError: (e) => {
                // Show non-blocking warning — step already advanced
                setSaveError('Some data may not have saved. Please check your profile later.');
                console.error('Background save error:', e);
            },
        });
    };

    const handleBack = () => { setStep(s => Math.max(1, s - 1)); window.scrollTo(0, 0); };

    const handleSaveDraft = () => {
        setSaving(true);
        router.post(route('gig-worker.onboarding.store'), buildFormData(step, true), {
            forceFormData: true,
            preserveState: true,
            preserveScroll: true,
            ...(csrfToken && { headers: { 'X-CSRF-TOKEN': csrfToken } }),
            onSuccess: () => setSaving(false),
            onError: () => setSaving(false),
        });
    };

    const handleSubmit = () => {
        setSubmitting(true);
        router.post(route('gig-worker.onboarding.store'), buildFormData(5), {
            forceFormData: true,
            ...(csrfToken && { headers: { 'X-CSRF-TOKEN': csrfToken } }),
            onError: (e) => {
                setErrors(e); setSubmitting(false);
            },
        });
    };

    const handleSkip = () => router.post(route('gig-worker.onboarding.skip'));

    const goToStep = (s) => { setStep(s); window.scrollTo(0, 0); };

    const progress = PROGRESS[step] || 20;
    const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'GW';

    return (
        <>
            <Head title={`Onboarding – Step ${step} of 5`} />

            <div className="bg-gray-50 min-h-screen flex flex-col font-sans antialiased">
                {/* ─ Header ─────────────────────────────────────────── */}
                <header className="bg-white border-b border-gray-200 h-16 flex-none z-20 relative shadow-sm sticky top-0">
                    <div className="max-w-[1920px] mx-auto px-6 h-full flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <span className="text-blue-600 text-2xl font-bold tracking-tight flex items-center gap-2">
                                <span className="material-icons">work_outline</span>
                                WorkWise
                            </span>
                            {step > 1 && (
                                <nav className="hidden lg:flex items-center gap-2 text-sm font-medium text-gray-500 border-l border-gray-200 pl-6 h-8">
                                    <span className="text-blue-600 font-semibold">Onboarding</span>
                                    <span className="material-icons text-base text-gray-300">chevron_right</span>
                                    <span>Profile Setup</span>
                                </nav>
                            )}
                        </div>

                        {step > 1 && (
                            <div className="hidden md:flex flex-col w-1/3 max-w-md">
                                <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                                    <span>Step {step} of 5</span>
                                    <span>{progress}% Complete</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div className="bg-blue-600 h-2 rounded-full transition-all duration-500 shadow-sm" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <button className="text-gray-500 hover:text-blue-600 transition-colors text-sm font-medium hidden sm:block">Help Center</button>
                            <div className="h-8 w-[1px] bg-gray-200 hidden sm:block" />
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center text-sm font-bold shadow-md">
                                {data.profile_picture_preview
                                    ? <img src={data.profile_picture_preview} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                    : initials}
                            </div>
                        </div>
                    </div>
                </header>

                {/* ─ Non-blocking save error banner ─────────────── */}
                {saveError && (
                    <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-700 text-sm">
                            <span className="material-icons text-base">warning</span>
                            {saveError}
                        </div>
                        <button onClick={() => setSaveError(null)} className="text-amber-500 hover:text-amber-700 transition-colors">
                            <span className="material-icons text-base">close</span>
                        </button>
                    </div>
                )}

                {step === 1 && (
                    <Step1Welcome onNext={handleNext} onSkip={handleSkip} />
                )}
                {step === 2 && (
                    <Step2ProfessionalInfo
                        data={data}
                        setData={setData}
                        errors={errors}
                        onNext={handleNext}
                        onBack={handleBack}
                        onSaveDraft={handleSaveDraft}
                        saving={saving}
                    />
                )}
                {step === 3 && (
                    <Step3Skills
                        data={data}
                        setData={setData}
                        errors={errors}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                )}
                {step === 4 && (
                    <Step4Portfolio
                        data={data}
                        setData={setData}
                        errors={errors}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                )}
                {step === 5 && (
                    <Step5Review
                        data={data}
                        user={user}
                        onSubmit={handleSubmit}
                        onBack={handleBack}
                        submitting={submitting}
                        goToStep={goToStep}
                    />
                )}
            </div>
        </>
    );
}
