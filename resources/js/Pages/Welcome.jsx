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
            <Head title="WorkWise - AI Marketplace" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&display=swap" rel="stylesheet" />
            <div className="relative min-h-screen bg-white">
                {/* Animated Background Shapes */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>

                {/* Main Content */}
                <div className="relative z-10 container mx-auto px-4 py-8">
                    {/* Enhanced Header with Navigation */}
                    <header className="flex justify-between items-center mb-16" data-observer-target>
                        <div className="flex items-center">
                            <h1 className="text-4xl font-bold text-gray-900 hover:text-blue-600 transition-all duration-700 hover:drop-shadow-lg">WorkWise</h1>
                        </div>
                        
                        {/* Main Navigation
                        <nav className="hidden md:flex items-center space-x-8">
                            <Link href="/about" className="text-gray-700 hover:text-blue-600 transition-all duration-300">
                                About Us
                            </Link>
                            <Link href="/jobs" className="text-gray-700 hover:text-blue-600 transition-all duration-300">
                                Browse Jobs
                            </Link>
                            <Link href="/freelancers" className="text-gray-700 hover:text-blue-600 transition-all duration-300">
                                Browse Freelancers
                            </Link>
                            <Link href="/help" className="text-gray-700 hover:text-blue-600 transition-all duration-300">
                                Help & FAQ
                            </Link>
                        </nav> */}

                        {/* Auth Navigation */}
                        <div className="flex items-center space-x-4">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-all duration-700 hover:shadow-xl hover:scale-105"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="text-gray-700 hover:text-blue-600 transition-all duration-700"
                                    >
                                        Log In
                                    </Link>
                                    <Link
                                        href={route('role.selection')}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-all duration-700 hover:shadow-xl hover:scale-105"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </header>

                    {/* Hero Section */}
                    <section className="text-center mb-24" data-observer-target>
                        <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
                            Connect. Create. <span className="text-blue-600 animate-pulse">Collaborate.</span>
                        </h2>
                        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                            WorkWise is an AI-driven marketplace connecting talented gig workers with innovative companies. Find your next project or discover the perfect talent for your needs.
                        </p>
                        
                        {/* Enhanced CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link
                                href={route('jobs.index')}
                                className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-700 hover:shadow-xl hover:scale-105"
                            >
                                Browse Jobs
                            </Link>
                            <Link
                                href="/freelancers"
                                className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-700 hover:shadow-xl hover:scale-105"
                            >
                                Find Talent
                            </Link>
                        </div>
                    </section>

                    {/* Features Section */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16" data-observer-target>
                        <div className="bg-white/70 backdrop-blur-sm p-8 rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-all duration-700 text-center">
                            <div className="text-6xl mb-4">✨</div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Smart Matching</h3>
                            <p className="text-gray-600">
                                Our AI-powered system matches gig workers with projects based on skills, experience, and preferences for perfect collaborations.
                            </p>
                        </div>

                        <div className="bg-white/70 backdrop-blur-sm p-8 rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-all duration-700 text-center">
                            <div className="text-6xl mb-4">🔒</div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Secure Payments</h3>
                            <p className="text-gray-600">
                                Built-in escrow system ensures secure transactions and timely payments for both gig workers and employers.
                            </p>
                        </div>

                        <div className="bg-white/70 backdrop-blur-sm p-8 rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-all duration-700 text-center">
                            <div className="text-6xl mb-4">💡</div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Quality Talent</h3>
                            <p className="text-gray-600">
                                Access to a curated network of skilled professionals across various industries and expertise levels.
                            </p>
                        </div>
                    </section>

                    {/* How It Works Section */}
                    <section className="mb-16" data-observer-target>
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold text-gray-900 mb-4">How WorkWise Works</h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                Get started in three simple steps
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* For Freelancers */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-xl">
                                <h3 className="text-2xl font-bold text-blue-900 mb-6 text-center">👨‍🎨 For Freelancers</h3>
                                <div className="space-y-4">
                                    <div className="flex items-start space-x-4">
                                        <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Create Your Profile</h4>
                                            <p className="text-gray-600">Showcase your skills, portfolio, and experience</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4">
                                        <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Find Perfect Jobs</h4>
                                            <p className="text-gray-600">Browse jobs or get AI-powered recommendations</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4">
                                        <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Get Paid Securely</h4>
                                            <p className="text-gray-600">Complete work and receive payments through our secure system</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* For Employers */}
                            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-xl">
                                <h3 className="text-2xl font-bold text-green-900 mb-6 text-center">🧑‍💼 For Employers</h3>
                                <div className="space-y-4">
                                    <div className="flex items-start space-x-4">
                                        <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Post Your Project</h4>
                                            <p className="text-gray-600">Describe your project and requirements</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4">
                                        <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Review Proposals</h4>
                                            <p className="text-gray-600">Get AI-matched freelancers and review their proposals</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4">
                                        <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Manage & Pay</h4>
                                            <p className="text-gray-600">Collaborate with your freelancer and release payments</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Footer */}
                    <footer className="border-t border-gray-200 pt-12 mt-16" data-observer-target>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">WorkWise</h3>
                                <p className="text-gray-600 mb-4">
                                    AI-driven marketplace connecting talent with opportunity.
                                </p>
                            </div>
                            
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-4">For Freelancers</h4>
                                <ul className="space-y-2 text-gray-600">
                                    <li><Link href="/jobs" className="hover:text-blue-600 transition-colors">Browse Jobs</Link></li>
                                    <li><Link href="/ai/recommendations" className="hover:text-blue-600 transition-colors">AI Recommendations</Link></li>
                                    <li><Link href={route('role.selection')} className="hover:text-blue-600 transition-colors">Join as Freelancer</Link></li>
                                </ul>
                            </div>
                            
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-4">For Employers</h4>
                                <ul className="space-y-2 text-gray-600">
                                    <li><Link href="/freelancers" className="hover:text-blue-600 transition-colors">Browse Freelancers</Link></li>
                                    <li><Link href="/jobs/create" className="hover:text-blue-600 transition-colors">Post a Job</Link></li>
                                    <li><Link href={route('role.selection')} className="hover:text-blue-600 transition-colors">Join as Employer</Link></li>
                                </ul>
                            </div>
                            
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
                                <ul className="space-y-2 text-gray-600">
                                    <li><Link href="/help" className="hover:text-blue-600 transition-colors">Help & FAQ</Link></li>
                                    <li><Link href="/about" className="hover:text-blue-600 transition-colors">About Us</Link></li>
                                    <li><Link href="/contact" className="hover:text-blue-600 transition-colors">Contact Support</Link></li>
                                    <li><Link href="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link></li>
                                    <li><Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
                                </ul>
                            </div>
                        </div>
                        
                        <div className="border-t border-gray-200 pt-8 text-center text-gray-600">
                            <p>&copy; 2024 WorkWise. All rights reserved.</p>
                        </div>
                    </footer>
                </div>
            </div>

            <style>{`
                body {
                    background: white;
                    color: #333;
                    font-family: 'Inter', sans-serif;
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
