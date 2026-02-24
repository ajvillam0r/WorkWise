import { useRef, useEffect, useMemo, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Zap, Star, Award, Code2, Palette, BarChart3, Camera, PenTool, Megaphone, LineChart, CheckCircle2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Matchmaker = () => {
    const sectionRef = useRef(null);
    const talentStreamRef = useRef(null);
    const scannerRef = useRef(null);
    const [isMatched, setIsMatched] = useState(false);

    const talents = useMemo(() => [
        { name: "Alex Riv", role: "Fullstack Developer", rate: "₱85/hr", icon: Code2, color: "text-blue-400" },
        { name: "Sarah Chen", role: "UI/UX Designer", rate: "₱70/hr", icon: Palette, color: "text-purple-400" },
        { name: "Mike Ross", role: "Data Scientist", rate: "₱95/hr", icon: BarChart3, color: "text-green-400" },
        { name: "AJ V.", role: "Motion Designer", rate: "₱65/hr", icon: Camera, color: "text-pink-400" },
        { name: "James L.", role: "Content Strategist", rate: "₱55/hr", icon: PenTool, color: "text-orange-400" },
        { name: "Sofia M.", role: "Marketing Expert", rate: "₱75/hr", icon: Megaphone, color: "text-red-400" },
        { name: "David Z.", role: "Backend Engineer", rate: "₱90/hr", icon: Code2, color: "text-cyan-400" },
        { name: "Lisa W.", role: "Product Designer", rate: "₱80/hr", icon: Palette, color: "text-indigo-400" },
        { name: "Tom H.", role: "Financial Analyst", rate: "₱110/hr", icon: LineChart, color: "text-emerald-400" },
    ], []);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top top",
                    end: "+=200%",
                    scrub: 1,
                    pin: true,
                    onUpdate: (self) => {
                        if (self.progress > 0.85) setIsMatched(true);
                        else setIsMatched(false);
                    }
                }
            });

            // Fast stream animation
            tl.to(talentStreamRef.current, {
                x: "-50%",
                duration: 1,
                ease: "none"
            });

            // Scanner flicker
            gsap.to(scannerRef.current, {
                opacity: 0.5,
                duration: 0.1,
                repeat: -1,
                yoyo: true,
                ease: "steps(1)"
            });

        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="h-screen bg-[#05070A] overflow-hidden flex flex-col items-center justify-center relative">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/10 rounded-full blur-[120px]" />

            <div className="relative z-10 w-full max-w-7xl px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
                        Perfect Match in <span className="text-blue-500">{"seconds"}</span>
                    </h2>
                    <p className="text-white/40 text-lg">AI-driven GigWorker/Employer selection, verified for your project needs.</p>
                </div>

                {/* Talent Stream Container */}
                <div className="relative h-64 flex items-center">
                    {/* Scanner Line */}
                    <div ref={scannerRef} className="absolute left-1/2 -translate-x-1/2 h-80 w-1 bg-blue-500 z-30 shadow-[0_0_20px_rgba(59,130,246,1)]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full blur-sm" />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full blur-sm" />
                    </div>

                    <div ref={talentStreamRef} className="flex gap-6 whitespace-nowrap px-[25vw]">
                        {[...talents, ...talents].map((talent, i) => (
                            <div key={i} className={`w-64 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center transition-all duration-300 ${isMatched && i === 12 ? 'ring-2 ring-blue-500 bg-blue-500/10 scale-110 shadow-[0_0_30px_rgba(59,130,246,0.2)]' : 'opacity-40 blur-[1px]'}`}>
                                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 ${talent.color}`}>
                                    <talent.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-white font-bold text-lg">{talent.name}</h3>
                                <p className="text-white/40 text-sm">{talent.role}</p>
                                <div className="mt-4 px-3 py-1 rounded-full bg-white/5 text-blue-400 text-xs font-bold">
                                    {talent.rate}
                                </div>
                                {isMatched && i === 12 && (
                                    <div className="absolute -top-3 -right-3 bg-blue-500 text-white p-1 rounded-full shadow-lg animate-bounce">
                                        <Star className="w-4 h-4 fill-white" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Match Indicator */}
                <div className={`mt-16 text-center transition-all duration-500 ${isMatched ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-blue-500 text-white font-bold text-xl shadow-[0_10px_40px_rgba(59,130,246,0.3)]">
                        <CheckCircle2 className="w-6 h-6" />
                        AI Match Found
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Matchmaker;
