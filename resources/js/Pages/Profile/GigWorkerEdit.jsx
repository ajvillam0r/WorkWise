import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState, useRef } from 'react';

// ─── Skill tag list (reused from onboarding) ─────────────────────────────────
const SUGGESTED_SKILLS = [
    'JavaScript', 'TypeScript', 'React', 'Vue.js', 'PHP', 'Laravel', 'Python',
    'Node.js', 'SQL', 'UI Design', 'UX Research', 'Figma', 'Photoshop',
    'Video Editing', 'Content Writing', 'SEO', 'Social Media', 'Data Entry',
    'Customer Support', 'Excel', 'Project Management', 'Accounting', 'Marketing',
    'Mobile Development', 'Android', 'iOS', 'Flutter', 'Graphic Design',
    'Illustration', 'Branding', 'Copywriting', 'Translation',
];

const PROFICIENCY_OPTIONS = [
    { value: 'beginner', label: 'Beginner', color: 'bg-green-100 text-green-700' },
    { value: 'intermediate', label: 'Intermediate', color: 'bg-blue-100 text-blue-700' },
    { value: 'expert', label: 'Expert', color: 'bg-purple-100 text-purple-700' },
];

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, hint, children, error }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
            {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
            {children}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

// ─── Card section ─────────────────────────────────────────────────────────────
function Section({ title, icon, children }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <span className="material-icons text-blue-600 text-base">{icon}</span>
                </div>
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">{title}</h2>
            </div>
            <div className="p-6 space-y-5">{children}</div>
        </div>
    );
}

// ─── Skills editor ────────────────────────────────────────────────────────────
function SkillsEditor({ skills, onChange }) {
    const [search, setSearch] = useState('');

    const filtered = search.trim()
        ? SUGGESTED_SKILLS.filter(
            (s) => s.toLowerCase().includes(search.toLowerCase()) && !skills.find(sk => sk.skill === s)
        )
        : [];

    const addSkill = (skillName) => {
        if (!skills.find(s => s.skill === skillName)) {
            onChange([...skills, { skill: skillName, proficiency: 'beginner', category: null }]);
        }
        setSearch('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && search.trim()) {
            e.preventDefault();
            addSkill(search.trim());
        }
    };

    const removeSkill = (idx) => {
        onChange(skills.filter((_, i) => i !== idx));
    };

    const setProficiency = (idx, prof) => {
        const updated = [...skills];
        updated[idx] = { ...updated[idx], proficiency: prof };
        onChange(updated);
    };

    return (
        <div className="space-y-4">
            {/* Search input */}
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-base">search</span>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search or type a skill, press Enter to add"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                {filtered.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {filtered.slice(0, 8).map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => addSkill(s)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Current skills */}
            {skills.length > 0 && (
                <div className="space-y-2">
                    {skills.map((sk, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="flex-1 text-sm font-medium text-gray-800 pl-1">{sk.skill}</span>
                            <div className="flex gap-1">
                                {PROFICIENCY_OPTIONS.map((p) => (
                                    <button
                                        key={p.value}
                                        type="button"
                                        onClick={() => setProficiency(i, p.value)}
                                        className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${sk.proficiency === p.value
                                            ? p.color + ' ring-1 ring-offset-1 ring-current'
                                            : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
                                            }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => removeSkill(i)}
                                className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                            >
                                <span className="material-icons text-base">close</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {skills.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-3">No skills added yet. Search above to add your first skill.</p>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GigWorkerEdit({ user, status }) {
    // ── Profile photo state ───────────────────────────────────────────────
    const [photoPreview, setPhotoPreview] = useState(user.profile_picture || null);
    const photoRef = useRef(null);

    // ── Resume state ──────────────────────────────────────────────────────
    const [resumeName, setResumeName] = useState(user.resume_file_name || (user.resume_file ? 'Current CV' : null));

    // ── Skills state (managed separately as an array) ─────────────────────
    const [skills, setSkills] = useState(
        Array.isArray(user.skills_with_experience) ? user.skills_with_experience : []
    );

    // ── Inertia form ──────────────────────────────────────────────────────
    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        professional_title: user.professional_title || '',
        bio: user.bio || '',
        hourly_rate: user.hourly_rate || '',
        portfolio_link: user.portfolio_link || '',
        skills_with_experience: JSON.stringify(user.skills_with_experience || []),
        profile_picture: null,
        resume_file: null,
    });

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setData('profile_picture', file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleResumeChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setData('resume_file', file);
        setResumeName(file.name);
    };

    const handleSkillsChange = (updatedSkills) => {
        setSkills(updatedSkills);
        setData('skills_with_experience', JSON.stringify(updatedSkills));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('gig-worker.profile.update') || '/profile/gig-worker/edit', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'GW';

    return (
        <AuthenticatedLayout>
            <Head title="Edit Profile – WorkWise" />

            <div className="bg-slate-50 min-h-screen">
                {/* ─── Top bar ─────────────────────────────────────────── */}
                <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/profile/gig-worker"
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                            >
                                <span className="material-icons">arrow_back</span>
                            </Link>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">Edit Profile</h1>
                                <p className="text-xs text-gray-500">Update your gig worker information</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/profile/gig-worker"
                                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                form="gig-worker-edit-form"
                                disabled={processing}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition shadow-sm shadow-blue-500/30 flex items-center gap-2"
                            >
                                {processing
                                    ? <><span className="material-icons text-base animate-spin">progress_activity</span> Saving…</>
                                    : <><span className="material-icons text-base">save</span> Save Changes</>
                                }
                            </button>
                        </div>
                    </div>
                </div>

                {/* ─── Success banner ───────────────────────────────────── */}
                {status === 'profile-updated' && (
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700">
                            <span className="material-icons text-green-500">check_circle</span>
                            <span className="text-sm font-medium">Profile updated successfully!</span>
                        </div>
                    </div>
                )}

                {/* ─── Form ─────────────────────────────────────────────── */}
                <form id="gig-worker-edit-form" onSubmit={handleSubmit}>
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                        {/* ── Profile Photo ─────────────────────────────── */}
                        <Section title="Profile Photo" icon="person">
                            <div className="flex items-center gap-6">
                                {/* Avatar preview */}
                                <div className="relative flex-shrink-0">
                                    {photoPreview ? (
                                        <img
                                            src={photoPreview}
                                            alt="Profile preview"
                                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-md">
                                            {initials}
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => photoRef.current?.click()}
                                        className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1.5 shadow-md hover:bg-blue-700 transition"
                                    >
                                        <span className="material-icons text-sm leading-none">camera_alt</span>
                                    </button>
                                </div>

                                {/* Upload controls */}
                                <div className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => photoRef.current?.click()}
                                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                                    >
                                        <span className="material-icons text-base">upload</span>
                                        Upload new photo
                                    </button>
                                    <p className="text-xs text-gray-400">JPG, PNG or WebP · Max 5MB</p>
                                    {errors.profile_picture && <p className="text-xs text-red-500">{errors.profile_picture}</p>}
                                </div>
                                <input
                                    ref={photoRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handlePhotoChange}
                                />
                            </div>
                        </Section>

                        {/* ── Basic Info ────────────────────────────────── */}
                        <Section title="Basic Information" icon="badge">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <Field label="First Name" error={errors.first_name}>
                                    <input
                                        type="text"
                                        value={data.first_name}
                                        onChange={(e) => setData('first_name', e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        placeholder="Juan"
                                    />
                                </Field>
                                <Field label="Last Name" error={errors.last_name}>
                                    <input
                                        type="text"
                                        value={data.last_name}
                                        onChange={(e) => setData('last_name', e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        placeholder="Dela Cruz"
                                    />
                                </Field>
                            </div>
                            <Field label="Professional Title" hint="E.g. Full-Stack Developer, Graphic Designer, VA" error={errors.professional_title}>
                                <input
                                    type="text"
                                    value={data.professional_title}
                                    onChange={(e) => setData('professional_title', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="Senior UX Designer & Brand Strategist"
                                />
                            </Field>
                        </Section>

                        {/* ── Bio ───────────────────────────────────────── */}
                        <Section title="About Me" icon="description">
                            <Field
                                label="Bio"
                                hint="Tell clients what you do, your experience, and what makes you stand out."
                                error={errors.bio}
                            >
                                <textarea
                                    value={data.bio}
                                    onChange={(e) => setData('bio', e.target.value)}
                                    rows={5}
                                    maxLength={1000}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                                    placeholder="I specialize in creating user-centric digital experiences…"
                                />
                                <div className="flex justify-end mt-1">
                                    <span className="text-xs text-gray-400">{data.bio.length} / 1000</span>
                                </div>
                            </Field>
                        </Section>

                        {/* ── Rate & Portfolio ──────────────────────────── */}
                        <Section title="Rate & Portfolio" icon="attach_money">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <Field label="Hourly Rate (₱/hr)" hint="Set your base rate in Philippine Peso" error={errors.hourly_rate}>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">₱</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={data.hourly_rate}
                                            onChange={(e) => setData('hourly_rate', e.target.value)}
                                            className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                            placeholder="500.00"
                                        />
                                    </div>
                                </Field>
                                <Field label="Portfolio / Website URL" error={errors.portfolio_link}>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-base">language</span>
                                        <input
                                            type="text"
                                            value={data.portfolio_link}
                                            onChange={(e) => setData('portfolio_link', e.target.value)}
                                            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                            placeholder="https://yourportfolio.com"
                                        />
                                    </div>
                                </Field>
                            </div>
                        </Section>

                        {/* ── Skills ────────────────────────────────────── */}
                        <Section title="Skills & Expertise" icon="star">
                            <SkillsEditor
                                skills={skills}
                                onChange={handleSkillsChange}
                            />
                        </Section>

                        {/* ── Resume ───────────────────────────────────── */}
                        <Section title="Resume / CV" icon="description">
                            <div className="space-y-3">
                                {resumeName && (
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                                        <span className="material-icons text-blue-500">description</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{resumeName}</p>
                                            {user.resume_file && (
                                                <a href={user.resume_file} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                                    View current file
                                                </a>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { setResumeName(null); setData('resume_file', null); }}
                                            className="text-gray-400 hover:text-red-500 transition"
                                        >
                                            <span className="material-icons text-base">close</span>
                                        </button>
                                    </div>
                                )}

                                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-all group">
                                    <span className="material-icons text-3xl text-gray-300 group-hover:text-blue-400 mb-1">upload_file</span>
                                    <span className="text-sm font-medium text-gray-500 group-hover:text-blue-600">
                                        {resumeName ? 'Replace resume' : 'Upload resume'}
                                    </span>
                                    <span className="text-xs text-gray-400 mt-0.5">PDF, DOC, DOCX · Max 10MB</span>
                                    <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeChange} />
                                </label>
                                {errors.resume_file && <p className="text-xs text-red-500">{errors.resume_file}</p>}
                            </div>
                        </Section>

                        {/* ── Bottom Save ───────────────────────────────── */}
                        <div className="flex justify-end gap-3 pt-2 pb-8">
                            <Link
                                href="/profile/gig-worker"
                                className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition shadow-sm shadow-blue-500/30 flex items-center gap-2"
                            >
                                {processing
                                    ? <><span className="material-icons text-base animate-spin">progress_activity</span> Saving…</>
                                    : <><span className="material-icons text-base">save</span> Save Changes</>
                                }
                            </button>
                        </div>

                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
