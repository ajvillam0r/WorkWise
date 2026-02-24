import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { UserPlus, Search, ShieldCheck, FileEdit, Users, Rocket } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const HowItWorks = () => {
    const sectionRef = useRef(null);
    const containerRef = useRef(null);
    const stepsRef = useRef([]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top top",
                    end: "+=300%",
                    scrub: 1,
                    pin: true,
                }
            });

            // Smoothly animate each step
            stepsRef.current.forEach((step, i) => {
                tl.fromTo(step,
                    { opacity: 0, y: 50, scale: 0.9 },
                    { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power2.out" },
                    i * 0.5
                );

                // Keep the current step active and slightly fade others
                if (i > 0) {
                    tl.to(stepsRef.current[i - 1], { opacity: 0.3, scale: 0.95, duration: 0.5 }, i * 0.5);
                }
            });

            // Scale down effect at the end
            tl.to(containerRef.current, { scale: 0.9, opacity: 0.8, duration: 1 }, "+=0.5");

        }, sectionRef);

        return () => ctx.revert();
    }, []);

    const expertSteps = [
        { icon: UserPlus, title: "Create Your Profile", desc: "Showcase your AI expertise and past projects." },
        { icon: Search, title: "Find Perfect Gigs", desc: "Get matched with high-paying visionary projects." },
        { icon: ShieldCheck, title: "Get Paid Securely", desc: "Fast, guaranteed payments through our AI escrow." }
    ];

    const employerSteps = [
        { icon: FileEdit, title: "Post Your Project", desc: "Describe your needs and let AI handle the filtering." },
        { icon: Users, title: "Review AI Matches", desc: "Interview top-tier talent pre-vetted by our engine." },
        { icon: Rocket, title: "Scale Fast", desc: "Onboard and manage your team with built-in tools." }
    ];

    return (
        <section ref={sectionRef} className="h-screen bg-[#05070A] overflow-hidden flex flex-col items-center justify-center relative">
            {/* Background Accents */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />

            <div ref={containerRef} className="relative z-10 w-full max-w-7xl px-6">
                <div className="text-center mb-16 px-4">
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
                        How <span className="text-blue-500">WorkWise</span> Works
                    </h2>
                    <p className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto">
                        Revolutionizing the way you hire and work in the AI era.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                    {/* For Experts */}
                    <div className="space-y-12">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                <span className="text-2xl">👨‍🎨</span>
                            </div>
                            <h3 className="text-2xl font-bold text-white uppercase tracking-widest text-blue-500">For Experts</h3>
                        </div>
                        <div className="space-y-8">
                            {expertSteps.map((step, i) => (
                                <div
                                    key={i}
                                    ref={el => stepsRef.current[i] = el}
                                    className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl flex gap-6 group hover:border-blue-500/30 transition-colors"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                        <step.icon className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-white mb-2">{step.title}</h4>
                                        <p className="text-white/40 leading-relaxed">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* For Companies */}
                    <div className="space-y-12">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                                <span className="text-2xl">🧑‍💼</span>
                            </div>
                            <h3 className="text-2xl font-bold text-white uppercase tracking-widest text-indigo-500">For Companies</h3>
                        </div>
                        <div className="space-y-8">
                            {employerSteps.map((step, i) => (
                                <div
                                    key={i}
                                    ref={el => stepsRef.current[i + 3] = el}
                                    className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl flex gap-6 group hover:border-indigo-500/30 transition-colors"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                        <step.icon className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-white mb-2">{step.title}</h4>
                                        <p className="text-white/40 leading-relaxed">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
