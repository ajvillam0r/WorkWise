import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { EmployerStep1Welcome, EmployerStep2Identity } from './EmployerSteps12';
import { EmployerStep3Bio, EmployerStep4Preferences } from './EmployerSteps34';
import EmployerStep5Review from './EmployerStep5';

const PROGRESS = { 1: 0, 2: 25, 3: 50, 4: 75, 5: 100 };

export default function EmployerOnboarding({ user, industries, serviceCategories }) {
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const [data, setDataState] = useState({
        company_name: user.company_name || '',
        company_size: user.company_size || '',
        industry: user.industry || '',
        company_website: user.company_website || '',
        company_description: user.company_description || '',
        profile_picture_file: null,
        profile_picture_preview: user.profile_picture || null,
        primary_hiring_needs: user.primary_hiring_needs || [],
        typical_project_budget: user.typical_project_budget || '',
        typical_project_duration: user.typical_project_duration || '',
        preferred_experience_level: user.preferred_experience_level || '',
        hiring_frequency: user.hiring_frequency || '',
    });

    const setData = (key, value) => setDataState(prev => ({ ...prev, [key]: value }));

    // Build FormData from current state
    const buildFormData = (stepNum) => {
        const fd = new FormData();
        fd.append('step', stepNum);

        // Text fields
        fd.append('company_name', data.company_name || '');
        fd.append('company_size', data.company_size || '');
        fd.append('industry', data.industry || '');
        fd.append('company_website', data.company_website || '');
        fd.append('company_description', data.company_description || '');
        fd.append('typical_project_budget', data.typical_project_budget || '');
        fd.append('typical_project_duration', data.typical_project_duration || '');
        fd.append('preferred_experience_level', data.preferred_experience_level || '');
        fd.append('hiring_frequency', data.hiring_frequency || '');

        // Array fields
        (data.primary_hiring_needs || []).forEach((need, index) => {
            fd.append(`primary_hiring_needs[${index}]`, need);
        });

        // File field - only include if selected
        if (data.profile_picture_file) {
            fd.append('profile_picture', data.profile_picture_file);
        }

        return fd;
    };

    const handleNext = () => {
        // Step 1 doesn't need validation/save
        if (step === 1) {
            setStep(s => s + 1);
            window.scrollTo(0, 0);
            return;
        }

        // Advance immediately for better UX
        const currentStep = step;
        setStep(s => s + 1);
        window.scrollTo(0, 0);

        // Save in background (non-blocking)
        router.post(route('employer.onboarding.store'), buildFormData(currentStep), {
            forceFormData: true,
            preserveState: true,
            preserveScroll: true,
            onError: (e) => {
                console.error('Background save error:', e);
                setErrors(e);
            },
        });
    };

    const handleBack = () => {
        setStep(s => Math.max(1, s - 1));
        window.scrollTo(0, 0);
    };

    const handleSubmit = () => {
        setSubmitting(true);
        router.post(route('employer.onboarding.store'), buildFormData(5), {
            forceFormData: true,
            onError: (e) => {
                setErrors(e);
                setSubmitting(false);
            }
        });
    };

    const handleSkip = () => {
        router.post(route('employer.onboarding.skip'));
    };

    const goToStep = (s) => {
        setStep(s);
        window.scrollTo(0, 0);
    };

    const progress = PROGRESS[step] || 0;
    const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'E';

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex flex-col font-sans antialiased text-slate-900 dark:text-slate-100">
            <Head title={`WorkWise - Employer Onboarding (Step ${step} of 5)`} />

            {/* ─── Premium Header ─────────────────────────────────────────── */}
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-20 flex-none z-50 sticky top-0">
                <div className="max-w-[1440px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-10">
                        <span className="text-primary text-2xl font-black tracking-tighter flex items-center gap-2">
                            <span className="material-symbols-outlined text-3xl">work</span>
                            WORKWISE
                        </span>

                        {step > 1 && (
                            <div className="hidden lg:flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                <span className="text-primary">Onboarding</span>
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                                <span>Employer Profile</span>
                            </div>
                        )}
                    </div>

                    {step > 1 && (
                        <div className="hidden md:flex flex-col w-1/3 max-w-sm">
                            <div className="flex justify-between items-end text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.1em]">
                                <span>Step {step} of 5</span>
                                <span className="text-primary">{progress}% <span className="text-slate-300">Complete</span></span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-primary h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-700 text-white flex items-center justify-center text-sm font-bold shadow-lg">
                            {data.profile_picture_preview ? (
                                <img src={data.profile_picture_preview} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                initials
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* ─── Step Content ─────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col relative">
                {/* Background Blobs for specific steps */}
                {step > 1 && (
                    <>
                        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 mix-blend-multiply dark:mix-blend-overlay animate-pulse" />
                        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10 mix-blend-multiply dark:mix-blend-overlay animate-pulse delay-700" />
                    </>
                )}

                {step === 1 && (
                    <EmployerStep1Welcome
                        onNext={handleNext}
                        onSkip={handleSkip}
                    />
                )}

                {step === 2 && (
                    <EmployerStep2Identity
                        data={data}
                        setData={setData}
                        errors={errors}
                        industries={industries}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                )}

                {step === 3 && (
                    <EmployerStep3Bio
                        data={data}
                        setData={setData}
                        errors={errors}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                )}

                {step === 4 && (
                    <EmployerStep4Preferences
                        data={data}
                        setData={setData}
                        errors={errors}
                        serviceCategories={serviceCategories}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                )}

                {step === 5 && (
                    <EmployerStep5Review
                        data={data}
                        onSubmit={handleSubmit}
                        onBack={handleBack}
                        submitting={submitting}
                        goToStep={goToStep}
                    />
                )}
            </div>

            {/* Custom Styles for Material Symbols */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                }
            `}} />
        </div>
    );
}
