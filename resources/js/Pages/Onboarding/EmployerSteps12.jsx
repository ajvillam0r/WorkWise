import { useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';

// ─── Step 1: Welcome ─────────────────────────────────────────────────────────
function EmployerStep1Welcome({ onNext, onSkip }) {
    return (
        <main className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
            {/* Left Panel - Hero Branding */}
            <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative overflow-hidden flex-col justify-end p-12 text-white"
                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)' }}>
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full translate-x-1/4 translate-y-1/4 blur-3xl" />
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        Empower Your Business
                    </div>
                    <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">
                        Find the perfect talent for your next big project.
                    </h2>
                    <p className="text-lg text-blue-100 max-w-md font-light leading-relaxed mb-8">
                        Connect with verified gig workers, manage payments easily, and scale your operations with WorkWise.
                    </p>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 max-w-sm">
                        <div className="flex text-yellow-400 text-sm mb-2">
                            {[...Array(5)].map((_, i) => <span key={i} className="material-icons text-base">star</span>)}
                        </div>
                        <p className="text-sm italic text-gray-200 mb-3">
                            "WorkWise helped us find a designer in 24 hours. The onboarding was seamless and the results were exceptional."
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-300 font-medium">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">JD</div>
                            <span>James D., Tech Lead @ ByteCorp</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - matches gig-worker: bg-white, same footer/button style */}
            <div className="w-full lg:w-7/12 xl:w-1/2 bg-white flex flex-col overflow-y-auto">
                <div className="flex-1 flex flex-col justify-center px-6 py-10 sm:px-12 xl:px-24 max-w-5xl mx-auto w-full">
                    <div className="mb-10">
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
                            Build your employer presence.
                        </h1>
                        <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
                            Complete your profile to unlock full access to our talent pool. Verified employers see{' '}
                            <span className="text-blue-600 font-semibold">45% higher reply rates</span> from top gig workers.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                        {[
                            { num: 1, icon: 'business', title: 'Company Identity', desc: 'Tell us who you are and what you do.' },
                            { num: 2, icon: 'description', title: 'Company Bio', desc: 'Add a description to attract top talent.' },
                            { num: 3, icon: 'tune', title: 'Hiring Preferences', desc: 'Set your typical budget and duration.' },
                        ].map((item) => (
                            <div key={item.num} className="group relative bg-white rounded-xl p-5 border-2 border-blue-600/10 hover:border-blue-600/40 shadow-sm hover:shadow-md transition-all cursor-default">
                                <div className="absolute top-4 right-4 font-bold text-5xl text-gray-200 opacity-20 select-none">{item.num}</div>
                                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <span className="material-icons">{item.icon}</span>
                                </div>
                                <h3 className="font-bold text-gray-900 text-base mb-1">{item.title}</h3>
                                <p className="text-xs text-gray-500 leading-snug">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 items-start">
                        <span className="material-icons text-blue-600 text-xl mt-0.5">info</span>
                        <div>
                            <p className="text-sm text-gray-700 font-medium">Get started in minutes</p>
                            <p className="text-xs text-gray-500 mt-1">
                                No credit card required. You can skip and complete your profile later from settings.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 p-6 sm:px-12 xl:px-24 bg-white sticky bottom-0">
                    <div className="max-w-5xl mx-auto flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
                        <button onClick={onSkip} className="text-gray-500 hover:text-gray-800 font-medium text-sm py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                            Skip setup for now
                        </button>
                        <button onClick={onNext} className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 text-white font-semibold text-sm transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2">
                            Get Started
                            <span className="material-icons text-sm">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}

// ─── Step 2: Company Identity ────────────────────────────────────────────────
function EmployerStep2Identity({ data, setData, errors, industries, onNext, onBack }) {
    const fileRef = useRef(null);
    const [preview, setPreview] = useState(data.profile_picture_preview || null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // Revoke previous blob URL to avoid memory leaks
        if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
        const blobUrl = URL.createObjectURL(file);
        setData('profile_picture_file', file);
        setData('profile_picture_preview', blobUrl);
        setPreview(blobUrl);
    };

    const companySizes = [
        { value: 'individual', label: 'Individual' },
        { value: '2-10', label: '2-10 employees' },
        { value: '11-50', label: '11-50 employees' },
        { value: '51-200', label: '51-200 employees' },
        { value: '200+', label: '200+ employees' },
    ];

    return (
        <main className="flex-grow container mx-auto px-4 py-10 max-w-5xl">
            <div className="mb-10 max-w-3xl mx-auto">
                <div className="flex justify-between items-end mb-3">
                    <h1 className="text-2xl font-bold text-gray-900">Company Identity</h1>
                    <div className="text-right">
                        <span className="text-sm font-medium text-gray-500 block">Step 2 of 5</span>
                        <span className="text-xs font-semibold text-blue-600">40%</span>
                    </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 shadow-lg shadow-blue-500/30" style={{ width: '40%' }} />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="p-8 md:p-10">
                    <h2 className="text-2xl font-bold mb-2 text-gray-900">Tell us about your company</h2>
                    <p className="text-gray-500 mb-8">Fill in your business details to help gig workers find you.</p>

                    <div className="flex flex-col lg:flex-row gap-10">
                        <div className="flex-1 space-y-8">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700" htmlFor="company_name">
                                    Company Name <span className="text-gray-400 font-normal">(Optional)</span>
                                </label>
                                <input
                                    id="company_name"
                                    type="text"
                                    value={data.company_name}
                                    onChange={e => setData('company_name', e.target.value)}
                                    placeholder="Your Business Name"
                                    className="block w-full rounded-lg border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 shadow-sm border"
                                />
                                {errors.company_name && <p className="text-xs text-red-500">{errors.company_name}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700" htmlFor="industry">
                                        Industry <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="industry"
                                        value={data.industry}
                                        onChange={e => setData('industry', e.target.value)}
                                        className="block w-full rounded-lg border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 shadow-sm border"
                                    >
                                        <option value="">Select Industry</option>
                                        {industries.map(ind => (
                                            <option key={ind} value={ind}>{ind}</option>
                                        ))}
                                    </select>
                                    {errors.industry && <p className="text-xs text-red-500">{errors.industry}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700" htmlFor="company_size">
                                        Team Size <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="company_size"
                                        value={data.company_size}
                                        onChange={e => setData('company_size', e.target.value)}
                                        className="block w-full rounded-lg border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 shadow-sm border"
                                    >
                                        <option value="">Select Size</option>
                                        {companySizes.map(size => (
                                            <option key={size.value} value={size.value}>{size.label}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500">Number of employees.</p>
                                    {errors.company_size && <p className="text-xs text-red-500">{errors.company_size}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="w-full lg:w-72 flex-shrink-0 flex flex-col items-center justify-start pt-2 border-t lg:border-t-0 lg:border-l border-gray-200 lg:pl-10 mt-8 lg:mt-0">
                            <h3 className="text-sm font-semibold text-gray-700 mb-6 self-start lg:self-center">Logo / Avatar</h3>
                            <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
                                <div className="w-48 h-48 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 group-hover:bg-gray-100 transition-all overflow-hidden relative">
                                    {preview ? (
                                        <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <span className="material-icons text-5xl text-gray-300 mb-2 group-hover:text-blue-500 transition-colors block">business</span>
                                            <p className="text-xs text-gray-400 font-medium">No photo uploaded</p>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="bg-white text-gray-800 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">Upload</span>
                                    </div>
                                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                </div>
                                <div className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg pointer-events-none group-hover:scale-110 transition-transform">
                                    <span className="material-icons text-lg leading-none">edit</span>
                                </div>
                            </div>
                            <div className="mt-6 text-center">
                                <button type="button" onClick={() => fileRef.current?.click()} className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center justify-center gap-1 mb-2">
                                    <span className="material-icons text-base">file_upload</span>
                                    Choose File
                                </button>
                                <p className="text-xs text-gray-500 max-w-[200px] mx-auto leading-relaxed">
                                    JPG, PNG or GIF. Max size of 2MB.
                                </p>
                                {errors.profile_picture && <p className="text-xs text-red-500 mt-2">{errors.profile_picture}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-4 px-6 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="container mx-auto max-w-5xl flex items-center justify-between">
                    <button onClick={onBack} className="inline-flex items-center px-6 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition shadow-sm">
                        <span className="material-icons text-sm mr-2">arrow_back</span>
                        Back
                    </button>
                    <button onClick={onNext} className="inline-flex items-center px-8 py-2.5 text-sm font-medium rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 transition active:scale-95">
                        Next Step
                        <span className="material-icons text-sm ml-2">arrow_forward</span>
                    </button>
                </div>
            </div>
            <div className="h-20" />
        </main>
    );
}

export { EmployerStep1Welcome, EmployerStep2Identity };
