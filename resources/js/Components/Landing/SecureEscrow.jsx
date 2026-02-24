import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Shield, Lock, CheckCircle, Coins, Zap, FileSearch } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const SecureEscrow = () => {
    const sectionRef = useRef(null);
    const pathRef = useRef(null);
    const iconRefs = useRef([]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top top",
                    end: "+=150%",
                    scrub: 1,
                    pin: true
                }
            });

            // SVG Path Animation
            const length = pathRef.current.getTotalLength();
            gsap.set(pathRef.current, { strokeDasharray: length, strokeDashoffset: length });

            tl.to(pathRef.current, {
                strokeDashoffset: 0,
                duration: 2,
                ease: "none"
            });

            // Icon steps
            iconRefs.current.forEach((icon, i) => {
                tl.fromTo(icon,
                    { scale: 0, opacity: 0 },
                    { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" },
                    i * 0.5 + 0.2
                );
            });

            // Final Shield Glow
            tl.to(iconRefs.current[3], {
                boxShadow: "0 0 40px rgba(59, 130, 246, 0.4)",
                borderColor: "rgba(59, 130, 246, 0.6)",
                duration: 0.5
            });

        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="h-screen bg-[#05070A] overflow-hidden flex flex-col items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />

            <div className="relative z-10 w-full max-w-5xl px-6">
                <div className="text-center mb-24">
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
                        Secure <span className="text-blue-500">Escrow</span>
                    </h2>
                    <p className="text-white/40 text-lg max-w-xl mx-auto">Smart-contract protection for every project. Funds released only when you're 100% satisfied.</p>
                </div>

                <div className="relative flex justify-between items-center py-20">
                    {/* Background SVG connecting line */}
                    <svg className="absolute top-1/2 left-0 w-full h-2 -translate-y-1/2 pointer-events-none" style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.3))' }}>
                        <path
                            ref={pathRef}
                            d="M 50 1 C 200 1, 300 1, 450 1, 600 1, 750 1, 950 1"
                            fill="none"
                            stroke="#3B82F6"
                            strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                        />
                    </svg>

                    {[
                        { icon: FileSearch, label: "Smart Contract Created", color: "text-blue-400" },
                        { icon: Coins, label: "Funds Deposited", color: "text-blue-400" },
                        { icon: Zap, label: "Work Verified", color: "text-blue-400" },
                        { icon: Shield, label: "Payment Released", color: "text-white bg-blue-600 border-blue-600" }
                    ].map((step, i) => (
                        <div
                            key={i}
                            ref={el => iconRefs.current[i] = el}
                            className={`relative flex flex-col items-center gap-6 z-10 opacity-0 scale-0`}
                        >
                            <div className={`w-20 h-20 rounded-3xl border border-white/10 bg-[#0A0D12] flex items-center justify-center transition-all duration-500 ${step.color}`}>
                                <step.icon className="w-10 h-10" />
                            </div>
                            <span className="text-white/60 font-medium text-center text-sm w-32 uppercase tracking-tighter">
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SecureEscrow;
