import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Sparkles, User, Shield, Briefcase, Zap } from 'lucide-react';
import { Head, Link } from '@inertiajs/react';

gsap.registerPlugin(ScrollTrigger);

const HeroUI = ({ scrollProgressRef, assemblyProgressRef, auth }) => {
    const containerRef = useRef(null);
    const headlineRef = useRef(null);
    const subheadlineRef = useRef(null);
    const ctaContainerRef = useRef(null);
    const scrollIndicatorRef = useRef(null);
    const badgeRef = useRef(null);
    const statsRef = useRef(null);
    const navLogoRef = useRef(null);
    const navTextRef = useRef(null);
    const headerActionsRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Entry Animations
            const tl = gsap.timeline({ delay: 0.5 });

            // Logo & Text entry
            tl.fromTo(navLogoRef.current,
                { y: -50, opacity: 0, scale: 0.5 },
                { y: 0, opacity: 1, scale: 1, duration: 1, ease: "elastic.out(1, 0.7)" }
            )
                .fromTo(navTextRef.current,
                    { opacity: 0, x: -10 },
                    { opacity: 1, x: 0, duration: 0.8, ease: "power2.out" },
                    "-=0.5"
                )
                .fromTo(headerActionsRef.current,
                    { y: -20, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
                    "-=0.5"
                );

            // Original animations, adjusted to follow the new logo/text entry
            tl.fromTo(badgeRef.current,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
                '-=0.3' // Start badge animation slightly before nav text finishes
            );

            tl.fromTo(headlineRef.current,
                { y: 40, opacity: 0, filter: 'blur(10px)' },
                { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.8, ease: 'power3.out' },
                '-=0.3'
            );

            tl.fromTo(subheadlineRef.current,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
                '-=0.5'
            );

            tl.fromTo(ctaContainerRef.current?.children || [],
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' },
                '-=0.4'
            );

            tl.fromTo(scrollIndicatorRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.6 },
                '-=0.2'
            );

            // Trigger 3D assembly
            tl.to(assemblyProgressRef, {
                current: 1,
                duration: 2.5,
                ease: 'power2.out',
            }, 0.8);
        }, containerRef);

        return () => ctx.revert();
    }, [assemblyProgressRef]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            ScrollTrigger.create({
                trigger: containerRef.current,
                start: 'top top',
                end: 'bottom top',
                scrub: 1,
                onUpdate: (self) => {
                    scrollProgressRef.current = self.progress;
                },
            });

            // Scroll-out animation
            const animateElements = [headlineRef.current, subheadlineRef.current, ctaContainerRef.current, statsRef.current, navLogoRef.current, navTextRef.current, headerActionsRef.current].filter(el => el !== null);
            if (animateElements.length > 0) {
                gsap.fromTo(animateElements,
                    { y: 0, opacity: 1, filter: 'blur(0px)' },
                    {
                        y: -80,
                        opacity: 0,
                        filter: 'blur(12px)',
                        ease: "power1.inOut",
                        scrollTrigger: {
                            trigger: containerRef.current,
                            start: 'top top',
                            end: '25% top',
                            scrub: 1,
                            invalidateOnRefresh: true,
                        },
                    }
                );
            }

            // Separate scroll-out for indicator
            gsap.to(scrollIndicatorRef.current, {
                opacity: 0,
                y: 20,
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top top',
                    end: '5% top',
                    scrub: true,
                },
            });
        }, containerRef);

        return () => ctx.revert();
    }, [scrollProgressRef]);

    return (
        <div ref={containerRef} className="relative min-h-[150vh] z-10 pointer-events-none">
            {/* Navigation Logo */}
            <div className="absolute top-8 left-8 flex items-center gap-3 pointer-events-auto z-20">
                <div ref={navLogoRef} className="w-10 h-10 md:w-12 md:h-12">
                    <img
                        src="/image/WorkWise_logo.png"
                        alt="WorkWise Logo"
                        className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    />
                </div>
                <div ref={navTextRef} className="flex items-baseline">
                    <span className="text-2xl md:text-3xl font-black text-white tracking-tighter" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                        <span className="text-blue-500">W</span>orkWise
                    </span>
                </div>
            </div>

            {/* Header Actions */}
            <div ref={headerActionsRef} className="absolute top-8 right-8 flex items-center gap-4 pointer-events-auto z-20 opacity-0">
                {auth?.user ? (
                    <Link
                        href={route('dashboard')}
                        className="px-6 py-2 rounded-full border border-white/20 text-white font-medium hover:bg-white/10 transition-colors backdrop-blur-md text-sm"
                    >
                        Dashboard
                    </Link>
                ) : (
                    <>
                        <Link
                            href={route('login')}
                            className="px-6 py-2 rounded-full text-white font-medium hover:bg-white/10 transition-colors text-sm"
                        >
                            Login
                        </Link>
                        <Link
                            href={route('role.selection')}
                            className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg hover:shadow-blue-500/25 text-sm"
                        >
                            Get Started
                        </Link>
                    </>
                )}
            </div>

            <div className="sticky top-0 h-screen flex flex-col items-center justify-center px-6 pointer-events-none">
                {/* Headline */}
                <h1 ref={headlineRef}
                    className="text-5xl md:text-8xl font-bold text-center text-white tracking-tight leading-[1.1] max-w-5xl opacity-0 pointer-events-auto"
                    style={{
                        textShadow: '0 2px 10px rgba(0,0,0,0.5), 0 0 40px rgba(0,0,0,0.3)'
                    }}
                >
                    Connect. Create.
                    <br />
                    <span className="text-blue-500">Collaborate.</span>
                </h1>

                {/* Subheadline */}
                <p ref={subheadlineRef}
                    className="text-xl md:text-2xl text-white/90 text-center max-w-2xl mt-8 opacity-0 pointer-events-auto leading-relaxed"
                    style={{
                        textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.3)'
                    }}
                >
                    WorkWise is an AI-driven marketplace connecting talented Gig Workers with innovative companies. Find your next project or discover the perfect talent for your needs.
                </p>
                {/* CTA Buttons */}
                <div ref={ctaContainerRef} className="mt-12 flex flex-col sm:flex-row items-center gap-6 pointer-events-auto">
                    {!auth?.user && (
                        <Link
                            href={route('role.selection')}
                            className="group px-8 py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all hover:scale-105 flex items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                        >
                            Get Started
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    )}
                    <Link
                        href={route('jobs.index')}
                        className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all hover:scale-105 backdrop-blur-sm"
                    >
                        Browse Jobs
                    </Link>
                </div>

                {/* Stats */}
                {/* <div ref={statsRef} className="mt-24 grid grid-cols-3 gap-12 md:gap-24 pointer-events-auto">
                    {[
                        { value: '50K+', label: 'Experts', icon: User },
                        { value: '12K+', label: 'Projects', icon: Briefcase },
                        { value: '98%', label: 'Matches', icon: Zap },
                    ].map((stat, i) => (
                        <div key={i} className="text-center group">
                            <div className="text-2xl md:text-4xl font-black text-white group-hover:text-blue-400 transition-colors">
                                {stat.value}
                            </div>
                            <div className="text-xs md:text-sm text-white/40 mt-1 font-medium tracking-widest uppercase">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div> */}
            </div>

            {/* Scroll Indicator */}
            <div ref={scrollIndicatorRef} className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-0">
                <span className="text-[10px] text-white/30 tracking-[0.3em] uppercase font-bold">
                    Scroll to Explore
                </span>
                <div className="w-6 h-10 rounded-full border-2 border-white/10 flex items-start justify-center p-1.5 backdrop-blur-sm">
                    <div className="w-1.5 h-2.5 bg-blue-500 rounded-full animate-bounce" />
                </div>
            </div>
        </div>
    );
};

export default HeroUI;
