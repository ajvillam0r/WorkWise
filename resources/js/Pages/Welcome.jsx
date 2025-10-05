import { Head, Link } from '@inertiajs/react';
import { useEffect } from 'react';

export default function Welcome({ auth }) {
    useEffect(() => {
        // Neural Network Animation
        const nnCanvas = document.getElementById('neural-network-canvas');
        const nnCtx = nnCanvas?.getContext('2d');
        if (!nnCtx) {
            console.warn('Neural network canvas context not available');
        }
        let nnWidth = nnCanvas?.width || window.innerWidth;
        let nnHeight = nnCanvas?.height || document.documentElement.scrollHeight;

        // Particle Animation
        const particleCanvas = document.getElementById('particle-canvas');
        const particleCtx = particleCanvas?.getContext('2d');
        if (!particleCtx) {
            console.warn('Particle canvas context not available');
        }
        if (particleCanvas) {
            particleCanvas.width = window.innerWidth;
            particleCanvas.height = window.innerHeight;
        }

        let mouse = { x: null, y: null, radius: 150 };

        window.addEventListener('mousemove', (event) => {
            mouse.x = event.x;
            mouse.y = event.y;
        });

        window.addEventListener('mouseout', () => {
            mouse.x = null;
            mouse.y = null;
        });

        const handleResize = () => {
            nnWidth = nnCanvas ? nnCanvas.width = window.innerWidth : window.innerWidth;
            nnHeight = nnCanvas ? nnCanvas.height = document.documentElement.scrollHeight : document.documentElement.scrollHeight;
            if (particleCanvas) {
                particleCanvas.width = window.innerWidth;
                particleCanvas.height = window.innerHeight;
            }
            initNeuralNetwork();
            initParticles();
        };

        window.addEventListener('resize', handleResize);

        const nodeColor = 'rgba(59, 130, 246, 0.7)';
        const lineColor = 'rgba(59, 130, 246, 0.15)';
        let nodes = [];

        class Node {
            constructor(x, y, radius) {
                this.x = x;
                this.y = y;
                this.radius = radius;
                this.vx = (Math.random() - 0.5) * 0.2;
                this.vy = (Math.random() - 0.5) * 0.2;
            }
            draw() {
                if (nnCtx) {
                    nnCtx.beginPath();
                    nnCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    nnCtx.fillStyle = nodeColor;
                    nnCtx.fill();
                }
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > nnWidth) this.vx *= -1;
                if (this.y < 0 || this.y > nnHeight) this.vy *= -1;
            }
        }

        function initNeuralNetwork() {
            nodes = [];
            // Limit node count for better performance - max 50 nodes
            const maxNodes = 50;
            const nodeCount = Math.min(maxNodes, Math.floor((nnWidth * nnHeight) / 30000));
            for (let i = 0; i < nodeCount; i++) {
                nodes.push(new Node(Math.random() * nnWidth, Math.random() * nnHeight, Math.random() * 1.5 + 1));
            }
        }

        function connectNodes() {
            if (!nnCtx || nodes.length === 0) return;
            let maxDistance = 180;
            // Limit connections for better performance - only connect nearby nodes
            for (let i = 0; i < nodes.length; i++) {
                // Only connect to next few nodes to avoid O(n²) complexity
                for (let j = i + 1; j < Math.min(i + 8, nodes.length); j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < maxDistance) {
                        try {
                            nnCtx.beginPath();
                            nnCtx.moveTo(nodes[i].x, nodes[i].y);
                            nnCtx.lineTo(nodes[j].x, nodes[j].y);
                            nnCtx.strokeStyle = lineColor;
                            nnCtx.lineWidth = Math.max(0.1, 0.8 - (distance / maxDistance));
                            nnCtx.stroke();
                        } catch (error) {
                            // Skip this connection if canvas context is invalid
                            break;
                        }
                    }
                }
            }
        }

        let particlesArray = [];

        class Particle {
            constructor(x, y, size, color, weight) {
                this.x = x;
                this.y = y;
                this.size = size;
                this.color = color;
                this.weight = weight;
                this.baseX = this.x;
                this.baseY = this.y;
            }
            draw() {
                if (particleCtx) {
                    particleCtx.beginPath();
                    particleCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
                    particleCtx.fillStyle = this.color;
                    particleCtx.fill();
                }
            }
            update() {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;
                let maxDistance = mouse.radius;
                let force = (maxDistance - distance) / maxDistance;
                let directionX = forceDirectionX * force * this.weight;
                let directionY = forceDirectionY * force * this.weight;
                if (distance < mouse.radius) {
                    this.x -= directionX * 2.5;
                    this.y -= directionY * 2.5;
                } else {
                    if (this.x !== this.baseX) {
                        let dx = this.x - this.baseX;
                        this.x -= dx / 15;
                    }
                    if (this.y !== this.baseY) {
                        let dy = this.y - this.baseY;
                        this.y -= dy / 15;
                    }
                }
            }
        }

        function initParticles() {
            particlesArray = [];
            // Limit total particles for better performance
            const maxParticles = 100;
            const interactiveElements = document.querySelectorAll('a[href], button');

            interactiveElements.forEach(el => {
                if (particlesArray.length >= maxParticles) return;

                const rect = el.getBoundingClientRect();
                // Reduce particles per element from 15 to 3 for better performance
                const particlesPerElement = Math.min(3, Math.floor((maxParticles - particlesArray.length) / Math.max(1, interactiveElements.length)));

                for (let i = 0; i < particlesPerElement && particlesArray.length < maxParticles; i++) {
                    let size = (Math.random() * 1.5) + 0.5;
                    let x = rect.left + Math.random() * rect.width;
                    let y = rect.top + Math.random() * rect.height;
                    let color = `rgba(59, 130, 246, ${Math.random() * 0.4 + 0.2})`;
                    let weight = Math.random() * 1.5 + 0.5;
                    particlesArray.push(new Particle(x, y, size, color, weight));
                }
            });
        }

        function animate() {
            try {
                if (nnCtx && nnCanvas && !nnCanvas.hasAttribute('data-error')) {
                    nnCtx.clearRect(0, 0, nnWidth, nnHeight);
                    nodes.forEach(node => {
                        node.update();
                        node.draw();
                    });
                    connectNodes();
                }

                if (particleCtx && particleCanvas && !particleCanvas.hasAttribute('data-error')) {
                    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
                    for (let i = 0; i < particlesArray.length; i++) {
                        particlesArray[i].update();
                        particlesArray[i].draw();
                    }
                }

                requestAnimationFrame(animate);
            } catch (error) {
                console.error('Animation error:', error);
                // Mark canvases with error to prevent further animation attempts
                if (nnCanvas) nnCanvas.setAttribute('data-error', 'true');
                if (particleCanvas) particleCanvas.setAttribute('data-error', 'true');
                return;
            }
        }

        // Performance monitoring
        let frameCount = 0;
        let lastTime = performance.now();
        let animationEnabled = true;

        const performanceCheck = () => {
            frameCount++;
            const currentTime = performance.now();
            if (currentTime - lastTime >= 1000) { // Check every second
                const fps = frameCount / ((currentTime - lastTime) / 1000);
                if (fps < 15 && frameCount > 10) { // If FPS drops below 15 after 10 frames
                    console.warn('Low FPS detected, disabling animations for performance');
                    animationEnabled = false;
                    if (nnCanvas) nnCanvas.setAttribute('data-error', 'performance');
                    if (particleCanvas) particleCanvas.setAttribute('data-error', 'performance');
                }
                frameCount = 0;
                lastTime = currentTime;
            }
        };

        const monitoredAnimate = () => {
            if (animationEnabled) {
                try {
                    performanceCheck();
                    animate();
                } catch (error) {
                    console.error('Animation error:', error);
                    animationEnabled = false;
                }
            } else {
                // Still call requestAnimationFrame to keep the loop alive for re-enabling
                requestAnimationFrame(monitoredAnimate);
            }
        };

        initNeuralNetwork();
        initParticles();
        monitoredAnimate();

        // Intersection Observer for animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('[data-observer-target]').forEach(el => {
            observer.observe(el);
        });

        return () => {
            observer.disconnect();
            // Clean up event listeners
            window.removeEventListener('mousemove', (event) => {
                mouse.x = event.x;
                mouse.y = event.y;
            });
            window.removeEventListener('mouseout', () => {
                mouse.x = null;
                mouse.y = null;
            });
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <>
            <Head title="WorkWise - Futuristic AI Design" />
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
            <div className="relative min-h-screen">
                <canvas id="particle-canvas" className="fixed inset-0 z-10 pointer-events-none"></canvas>

                {/* Floating Elements */}
                <div className="floating-elements fixed inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="floating-element text-5xl animate-gentle-float absolute" style={{top: '15%', left: '10%', animationDuration: '28s'}}>△</div>
                    <div className="floating-element text-6xl animate-gentle-float absolute" style={{top: '70%', left: '85%', animationDuration: '35s', animationDelay: '5s'}}>▣</div>
                    <div className="floating-element text-4xl animate-gentle-float absolute" style={{top: '80%', left: '5%', animationDuration: '22s'}}>●</div>
                    <div className="floating-element text-7xl animate-gentle-float absolute" style={{top: '5%', left: '80%', animationDuration: '40s', animationDelay: '2s'}}>
                        <svg fill="none" height="80" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 100 100" width="80">
                            <path d="M20 80 L50 20 L80 80 Z" strokeDasharray="8 4" strokeLinecap="round"></path>
                        </svg>
                    </div>
                    <div className="absolute w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6] animate-gentle-float" style={{top: '25%', left: '30%', animationDuration: '20s'}}></div>
                    <div className="absolute w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_15px_#60a5fa] animate-gentle-float" style={{top: '50%', left: '50%', animationDuration: '26s', animationDelay: '3s'}}></div>
                    <div className="absolute w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6] animate-gentle-float" style={{top: '90%', left: '20%', animationDuration: '32s', animationDelay: '1s'}}></div>
                    <div className="absolute w-1.5 h-1.5 bg-blue-300 rounded-full shadow-[0_0_12px_#93c5fd] animate-gentle-float" style={{top: '10%', left: '60%', animationDuration: '21s', animationDelay: '4s'}}></div>
                    <div className="floating-element text-sm font-mono animate-gentle-float absolute" style={{top: '40%', left: '90%', animationDuration: '30s'}}>[01101110]</div>
                    <div className="floating-element text-xs font-mono animate-gentle-float absolute" style={{top: '60%', left: '15%', animationDuration: '38s', animationDelay: '6s'}}>{'</>'}</div>
                    <div className="floating-element text-base font-mono animate-gentle-float absolute" style={{top: '5%', left: '25%', animationDuration: '27s', animationDelay: '3s'}}>{'...'}</div>
                </div>

                {/* Neural Network Background */}
                <div className="neural-network-bg fixed inset-0 overflow-hidden z-0 opacity-15">
                    <canvas id="neural-network-canvas"></canvas>
                </div>

                {/* Background Glow Effects */}
                <div className="absolute inset-0 z-0 opacity-20">
                    <div className="absolute top-[-150px] left-[-150px] w-[500px] h-[500px] bg-blue-500 rounded-full filter blur-3xl opacity-25 animate-pulse" style={{animationDuration: '8s'}}></div>
                    <div className="absolute bottom-[-150px] right-[-150px] w-[500px] h-[500px] bg-blue-700 rounded-full filter blur-3xl opacity-25 animate-pulse" style={{animationDuration: '8s', animationDelay: '4s'}}></div>
                </div>

                {/* Main Content */}
                <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <header className="py-6 flex justify-between items-center opacity-0 fade-in" style={{animationDelay: '0.1s'}}>
                        <h1 className="text-3xl font-bold text-white transition-all duration-300 hover:text-blue-500 hover:drop-shadow-[0_0_10px_rgba(59,130,246,0.8)] holographic-text">WorkWise</h1>
                        <nav className="flex items-center space-x-6">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="text-gray-300 hover:text-white transition-colors duration-300 relative group"
                                >
                                    Dashboard
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="text-gray-300 hover:text-white transition-colors duration-300 relative group"
                                    >
                                        Log In
                                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
                                    </Link>
                                    <Link
                                        href={route('role.selection')}
                                        className="bg-blue-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] transform hover:scale-105"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </nav>
                    </header>

                    {/* Hero Section */}
                    <main className="text-center pt-24 pb-32">
                        <h2 className="font-bold text-5xl md:text-7xl mb-6 tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-300 animate-gradient-x opacity-0 fade-in" style={{animationDelay: '0.3s'}}>
                            Connect. Create. <span className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)] holographic-text animate-reveal" style={{animationDelay: '0.7s'}}>Collaborate.</span>
                        </h2>
                        <p className="max-w-3xl mx-auto text-lg text-gray-300 mb-10 opacity-0 fade-in" style={{animationDelay: '0.5s'}}>
                            WorkWise is an AI-driven marketplace that connects talented gig workers with innovative companies. Find your next project or discover the perfect talent for your needs.
                        </p>
                        <div className="flex justify-center items-center space-x-4 opacity-0 fade-in" style={{animationDelay: '0.7s'}}>
                            <Link
                                href={route('jobs.index')}
                                className="bg-blue-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-600 transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] text-lg transform hover:-translate-y-1"
                            >
                                Browse Jobs
                            </Link>
                            {!auth.user && (
                                <Link
                                    href={route('role.selection')}
                                    className="bg-transparent border border-blue-500/50 text-blue-500 font-bold py-3 px-8 rounded-lg hover:bg-blue-500 hover:text-white transition-all duration-300 text-lg relative overflow-hidden group shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                >
                                    <span className="absolute w-0 h-full bg-blue-500/30 left-0 top-0 transition-all duration-500 ease-out group-hover:w-full"></span>
                                    <span className="relative">Join WorkWise</span>
                                </Link>
                            )}
                        </div>
                    </main>

                    {/* Features Section */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-24" id="features-section">
                        <div className="bg-gray-900/50 p-8 rounded-xl text-center glow-border flex flex-col items-center backdrop-blur-sm" data-observer-target="">
                            <div className="bg-blue-500/20 p-4 rounded-full mb-6 inline-block shadow-[0_0_15px_rgba(59,130,246,0.4)] animate-float">
                                <span className="material-icons text-blue-500 text-4xl holographic-text">auto_awesome</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-white holographic-text">Smart Matching</h3>
                            <p className="text-gray-300">
                                Our AI-powered system matches gig workers with projects based on skills, experience, and preferences for perfect collaborations.
                            </p>
                        </div>

                        <div className="bg-gray-900/50 p-8 rounded-xl text-center glow-border flex flex-col items-center backdrop-blur-sm" data-observer-target="" style={{transitionDelay: '0.15s'}}>
                            <div className="bg-blue-500/20 p-4 rounded-full mb-6 inline-block shadow-[0_0_15px_rgba(59,130,246,0.4)] animate-float" style={{animationDelay: '0.5s'}}>
                                <span className="material-icons text-blue-500 text-4xl holographic-text">verified_user</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-white holographic-text">Secure Payments</h3>
                            <p className="text-gray-300">
                                Built-in escrow system ensures secure transactions and timely payments for both gig workers and employers.
                            </p>
                        </div>

                        <div className="bg-gray-900/50 p-8 rounded-xl text-center glow-border flex flex-col items-center backdrop-blur-sm" data-observer-target="" style={{transitionDelay: '0.3s'}}>
                            <div className="bg-blue-500/20 p-4 rounded-full mb-6 inline-block shadow-[0_0_15px_rgba(59,130,246,0.4)] animate-float" style={{animationDelay: '1s'}}>
                                <span className="material-icons text-blue-500 text-4xl holographic-text">workspace_premium</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-white holographic-text">Quality Talent</h3>
                            <p className="text-gray-300">
                                Access to a curated network of skilled professionals across various industries and expertise levels.
                            </p>
                        </div>
                    </section>
                </div>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }

                @keyframes gentle-float {
                    0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
                    25% { transform: translateY(-15px) translateX(8px) rotate(3deg); }
                    50% { transform: translateY(0px) translateX(-12px) rotate(-2deg); }
                    75% { transform: translateY(12px) translateX(4px) rotate(1.5deg); }
                }
                .animate-gentle-float {
                    animation: gentle-float 20s ease-in-out infinite;
                }

                @keyframes holographic-glow {
                    0%, 100% {
                        text-shadow: 0 0 4px rgba(59, 130, 246, 0.4), 0 0 8px rgba(59, 130, 246, 0.3), 0 0 12px rgba(59, 130, 246, 0.2);
                    }
                    50% {
                        text-shadow: 0 0 8px rgba(59, 130, 246, 0.6), 0 0 16px rgba(59, 130, 246, 0.4), 0 0 24px rgba(59, 130, 246, 0.3);
                    }
                }
                .holographic-text {
                    animation: holographic-glow 4s ease-in-out infinite;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fade-in {
                    animation: fadeIn 0.8s ease-out forwards;
                }

                @keyframes reveal {
                    from { clip-path: inset(0 100% 0 0); }
                    to { clip-path: inset(0 0 0 0); }
                }
                .animate-reveal {
                    animation: reveal 0.8s ease-in-out forwards;
                }

                .glow-border {
                    border: 1px solid transparent;
                    position: relative;
                    background-clip: padding-box;
                    backdrop-filter: blur(10px);
                    transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), box-shadow 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                }
                .glow-border::before {
                    content: '';
                    position: absolute;
                    top: 0; right: 0; bottom: 0; left: 0;
                    z-index: -1;
                    margin: -1px;
                    border-radius: inherit;
                    background: linear-gradient(120deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.2));
                    transition: all 0.4s ease-in-out;
                }
                .glow-border:hover {
                    transform: translateY(-8px) scale(1.03);
                    box-shadow: 0 10px 30px rgba(59, 130, 246, 0.2);
                }
                .glow-border:hover::before {
                    background: linear-gradient(120deg, rgba(59, 130, 246, 0.6), rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.6));
                    filter: blur(8px) brightness(1.3);
                }

                body {
                    background-color: #0a0a0a;
                    color: #f0f0f0;
                    font-family: 'Roboto', sans-serif;
                    overflow-x: hidden;
                }

                [data-observer-target] {
                    opacity: 0;
                    transform: translateY(20px);
                    transition: opacity 0.8s ease-out, transform 0.8s ease-out;
                }
                [data-observer-target].is-visible {
                    opacity: 1;
                    transform: translateY(0);
                }
            `}</style>
        </>
    );
}
