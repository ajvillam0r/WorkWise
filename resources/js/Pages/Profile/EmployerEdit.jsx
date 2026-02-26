import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState, useRef, useCallback } from 'react';

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, hint, children, error, icon }) {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">{label}</label>
            {hint && <p className="text-xs text-slate-400 dark:text-slate-500 ml-1">{hint}</p>}
            <div className="relative group">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-slate-400">
                        <span className="material-symbols-outlined text-lg">{icon}</span>
                    </div>
                )}
                {children}
            </div>
            {error && <p className="text-xs text-red-500 mt-1 ml-1 animate-pulse">{error}</p>}
        </div>
    );
}

// ─── Card section ─────────────────────────────────────────────────────────────
function Section({ title, icon, colorClass, children }) {
    return (
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/80 dark:border-white/5 rounded-3xl shadow-soft overflow-hidden transition-all hover:shadow-lg">
            <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                        <span className="material-symbols-outlined text-lg">{icon}</span>
                    </div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.15em]">{title}</h2>
                </div>
            </div>
            <div className="p-8 space-y-6">{children}</div>
        </div>
    );
}

const INITIAL_KEYS = [
    'first_name', 'last_name', 'company_name', 'industry', 'company_size',
    'company_website', 'bio', 'company_description', 'country', 'city',
];

export default function EmployerEdit({ user, status }) {
    const [photoPreview, setPhotoPreview] = useState(user.profile_picture || null);
    const photoRef = useRef(null);
    const [detectingLocation, setDetectingLocation] = useState(false);
    const [locationError, setLocationError] = useState(null);

    const initialValues = useRef(
        Object.fromEntries(INITIAL_KEYS.map((k) => [k, user[k] || '']))
    );

    const { data, setData, post, processing, errors } = useForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        company_name: user.company_name || '',
        industry: user.industry || '',
        company_size: user.company_size || '',
        company_website: user.company_website || '',
        bio: user.bio || '',
        company_description: user.company_description || '',
        profile_picture: null,
        country: user.country || '',
        city: user.city || '',
    });

    const isDirty =
        data.profile_picture instanceof File ||
        INITIAL_KEYS.some((k) => data[k] !== initialValues.current[k]);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setData('profile_picture', file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('employer.profile.update'), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const handleAutoDetectLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser.');
            return;
        }
        setDetectingLocation(true);
        setLocationError(null);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                        { headers: { 'Accept-Language': 'en', 'User-Agent': 'WorkWise/1.0' } }
                    );
                    if (!response.ok) throw new Error('Reverse geocoding failed.');
                    const result = await response.json();
                    const addr = result.address || {};
                    const detectedCity = addr.city || addr.town || addr.village || addr.county || '';
                    const detectedCountry = addr.country || '';
                    setData((prev) => ({ ...prev, city: detectedCity, country: detectedCountry }));
                } catch {
                    setLocationError('Could not detect location. Please enter manually.');
                } finally {
                    setDetectingLocation(false);
                }
            },
            () => {
                setLocationError('Location access denied. Please enter manually.');
                setDetectingLocation(false);
            },
            { timeout: 10000 }
        );
    }, [setData]);

    const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'E';

    return (
        <AuthenticatedLayout>
            <Head title="Edit Employer Profile - WorkWise" />

            <div className="min-h-screen pb-16 relative">
                {/* Background Decor */}
                <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse"></div>

                {/* Header Section */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest mb-3">
                                <Link href={route('employer.profile')} className="hover:underline">Profile</Link>
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                                <span className="text-slate-400">Edit Mode</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Edit Profile</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-2">Update your identity and company presence on WorkWise.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href={route('employer.profile')}
                                className="px-6 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-sm font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                            >
                                Cancel
                            </Link>
                            <button
                                onClick={handleSubmit}
                                disabled={processing || !isDirty}
                                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-blue-600/30 active:scale-95 flex items-center gap-2"
                            >
                                {processing ? (
                                    <><span className="material-symbols-outlined text-lg text-white animate-spin">refresh</span> Saving...</>
                                ) : (
                                    <><span className="material-symbols-outlined text-lg text-white">save</span> Save Changes</>
                                )}
                            </button>
                        </div>
                    </div>

                    {status === 'profile-updated' && (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-600 rounded-2xl p-4 mb-8 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                            <span className="material-symbols-outlined">check_circle</span>
                            <span className="text-sm font-bold text-green-700">Profile successfully updated!</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* ── Personal Info ─────────────────────────────── */}
                        <Section title="Personal Information" icon="person" colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="flex flex-col items-center gap-3">
                                    <div
                                        onClick={() => photoRef.current?.click()}
                                        className="relative group cursor-pointer"
                                    >
                                        <div className="w-32 h-32 rounded-full bg-slate-50 dark:bg-slate-800 shadow-inner border-4 border-white dark:border-slate-800 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                                            {photoPreview ? (
                                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-3xl font-black text-primary opacity-40">{initials}</span>
                                            )}
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]">
                                            <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Company Logo</span>
                                    <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                                </div>

                                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                    <Field label="First Name" error={errors.first_name} icon="badge">
                                        <input
                                            type="text"
                                            value={data.first_name}
                                            onChange={(e) => setData('first_name', e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-slate-900 dark:text-white transition-all shadow-inner"
                                        />
                                    </Field>
                                    <Field label="Last Name" error={errors.last_name} icon="badge">
                                        <input
                                            type="text"
                                            value={data.last_name}
                                            onChange={(e) => setData('last_name', e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-slate-900 dark:text-white transition-all shadow-inner"
                                        />
                                    </Field>
                                    <div className="md:col-span-2">
                                        <Field label="Professional Bio" hint="Keep it short and punchy for your mini-profile." error={errors.bio} icon="description">
                                            <input
                                                type="text"
                                                value={data.bio}
                                                maxLength={100}
                                                onChange={(e) => setData('bio', e.target.value)}
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-slate-900 dark:text-white transition-all shadow-inner"
                                                placeholder="Technical Lead @ TechFlow"
                                            />
                                        </Field>
                                    </div>
                                </div>
                            </div>
                        </Section>

                        {/* ── Company Details ───────────────────────────── */}
                        <Section title="Company Details" icon="business" colorClass="bg-purple-100 dark:bg-purple-900/30 text-purple-600">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <Field label="Company Name" error={errors.company_name} icon="corporate_fare">
                                        <input
                                            type="text"
                                            value={data.company_name}
                                            onChange={(e) => setData('company_name', e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-slate-900 dark:text-white transition-all shadow-inner"
                                        />
                                    </Field>
                                </div>
                                <Field label="Industry" error={errors.industry} icon="category">
                                    <input
                                        type="text"
                                        value={data.industry}
                                        onChange={(e) => setData('industry', e.target.value)}
                                        placeholder="e.g. Software Development"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-slate-900 dark:text-white transition-all shadow-inner"
                                    />
                                </Field>
                                <Field label="Company Size" error={errors.company_size} icon="groups">
                                    <select
                                        value={data.company_size}
                                        onChange={(e) => setData('company_size', e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-slate-900 dark:text-white transition-all shadow-inner appearance-none cursor-pointer"
                                    >
                                        <option value="">Select Size</option>
                                        <option value="1-10">1-10 employees</option>
                                        <option value="11-50">11-50 employees</option>
                                        <option value="51-200">51-200 employees</option>
                                        <option value="201-500">201-500 employees</option>
                                        <option value="500+">500+ employees</option>
                                    </select>
                                </Field>
                                <div className="md:col-span-2">
                                    <Field label="Company Description" hint="Detailed overview of what your company does and why workers should join." error={errors.company_description}>
                                        <textarea
                                            value={data.company_description}
                                            onChange={(e) => setData('company_description', e.target.value)}
                                            rows={5}
                                            className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-slate-900 dark:text-white transition-all shadow-inner resize-none"
                                            placeholder="Write about your company's mission and culture..."
                                        />
                                    </Field>
                                </div>
                                <div className="md:col-span-2">
                                    <Field label="Website URL" error={errors.company_website} icon="language">
                                        <input
                                            type="url"
                                            value={data.company_website}
                                            onChange={(e) => setData('company_website', e.target.value)}
                                            placeholder="https://example.com"
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-slate-900 dark:text-white transition-all shadow-inner"
                                        />
                                    </Field>
                                </div>
                            </div>
                        </Section>

                        {/* ── Location ──────────────────────────────────── */}
                        <Section title="Office Location" icon="location_on" colorClass="bg-orange-100 dark:bg-orange-900/30 text-orange-600">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2 flex items-center justify-between">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Enter your country and city, or use auto-detect.</p>
                                    <button
                                        type="button"
                                        onClick={handleAutoDetectLocation}
                                        disabled={detectingLocation}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <span className={`material-symbols-outlined text-base${detectingLocation ? ' animate-spin' : ''}`}>
                                            {detectingLocation ? 'refresh' : 'my_location'}
                                        </span>
                                        {detectingLocation ? 'Detecting...' : 'Auto detect location'}
                                    </button>
                                </div>
                                {locationError && (
                                    <div className="md:col-span-2">
                                        <p className="text-xs text-red-500 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">error</span>
                                            {locationError}
                                        </p>
                                    </div>
                                )}
                                <Field label="Country" error={errors.country} icon="public">
                                    <input
                                        type="text"
                                        value={data.country}
                                        onChange={(e) => setData('country', e.target.value)}
                                        placeholder="e.g. Philippines"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-slate-900 dark:text-white transition-all shadow-inner"
                                    />
                                </Field>
                                <Field label="City" error={errors.city} icon="location_city">
                                    <input
                                        type="text"
                                        value={data.city}
                                        onChange={(e) => setData('city', e.target.value)}
                                        placeholder="e.g. Manila"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-slate-900 dark:text-white transition-all shadow-inner"
                                    />
                                </Field>
                            </div>
                        </Section>

                        {/* Save Bar */}
                        <div className="flex items-center justify-end gap-4 pt-10">
                            {isDirty ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (window.confirm('Discard all unsaved changes and go back to your profile?')) {
                                            router.visit(route('employer.profile'));
                                        }
                                    }}
                                    className="px-8 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                                >
                                    Discard Changes
                                </button>
                            ) : (
                                <span className="px-8 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 font-bold bg-white dark:bg-slate-800 cursor-not-allowed opacity-50 select-none">
                                    Discard Changes
                                </span>
                            )}
                            <button
                                type="submit"
                                disabled={processing || !isDirty}
                                className="px-10 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-black rounded-2xl shadow-xl shadow-blue-600/30 hover:shadow-blue-600/40 hover:-translate-y-1 active:translate-y-0 active:shadow-sm transition-all flex items-center gap-3"
                            >
                                {processing ? (
                                    <><span className="material-symbols-outlined text-xl text-white animate-spin">refresh</span> Processing...</>
                                ) : (
                                    <><span className="material-symbols-outlined text-xl text-white">verified</span> Update Profile</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
