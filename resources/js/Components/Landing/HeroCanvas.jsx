import { useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Particle count - significantly higher for "solid" look
const PARTICLE_COUNT = 12000;

// Colors matching WorkWise brand
const ELECTRIC_BLUE = new THREE.Color('#3B82F6');
const DEEP_BLUE = new THREE.Color('#1D4ED8');

const ParticleSystem = forwardRef(({ scrollProgressRef, assemblyProgressRef }, ref) => {
    const pointsRef = useRef();
    const particlesOriginalPositionRef = useRef(null);
    const particlesRandomOffsetRef = useRef(null);
    const rotationSpeedRef = useRef(0.0003);
    const baseRotationRef = useRef(0);

    useImperativeHandle(ref, () => ({
        get particles() {
            return pointsRef.current;
        }
    }));

    const { positions, colors, sizes } = useMemo(() => {
        const positions = new Float32Array(PARTICLE_COUNT * 3);
        const colors = new Float32Array(PARTICLE_COUNT * 3);
        const sizes = new Float32Array(PARTICLE_COUNT);

        const originalPositions = new Float32Array(PARTICLE_COUNT * 3);
        const randomOffsets = new Float32Array(PARTICLE_COUNT * 3);

        // Logo Geometry Definition - Wider and chunkier
        const p1 = new THREE.Vector3(-3.2, 1.2, 0);
        const v1 = new THREE.Vector3(-1.6, -1.4, 0);
        const p2 = new THREE.Vector3(0, 0.4, 0);
        const v2 = new THREE.Vector3(1.6, -1.4, 0);
        const p3 = new THREE.Vector3(3.2, 1.2, 0);

        // Dots above outer peaks
        const dot1Center = new THREE.Vector3(-3.2, 2.8, 0);
        const dot2Center = new THREE.Vector3(3.2, 2.8, 0);
        const dotRadius = 0.75;

        // Allocation
        const W_PARTICLE_COUNT = Math.floor(PARTICLE_COUNT * 0.82);
        const DOT_PARTICLE_COUNT = Math.floor((PARTICLE_COUNT - W_PARTICLE_COUNT) / 2);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            const target = new THREE.Vector3();

            if (i < W_PARTICLE_COUNT) {
                // Distribute across the 4 bars of the W
                const segmentProgress = (i / W_PARTICLE_COUNT) * 4;
                const segmentIndex = Math.floor(segmentProgress);
                const t = segmentProgress % 1;

                let start, end;
                if (segmentIndex === 0) { start = p1; end = v1; }
                else if (segmentIndex === 1) { start = v1; end = p2; }
                else if (segmentIndex === 2) { start = p2; end = v2; }
                else { start = v2; end = p3; }

                target.lerpVectors(start, end, t);

                // Slab sampling for thickness
                const dir = new THREE.Vector3().subVectors(end, start).normalize();
                const perp = new THREE.Vector3(-dir.y, dir.x, 0).normalize();

                const barWidth = 0.8;
                const thickness = (Math.random() - 0.5) * barWidth;
                const depth = (Math.random() - 0.5) * 0.7;

                target.addScaledVector(perp, thickness);
                target.z += depth;
            } else {
                // Spherical dots
                const center = (i < W_PARTICLE_COUNT + DOT_PARTICLE_COUNT) ? dot1Center : dot2Center;
                const phi = Math.random() * Math.PI * 2;
                const theta = Math.random() * Math.PI;
                const r = Math.pow(Math.random(), 0.6) * dotRadius;

                target.copy(center);
                target.x += r * Math.sin(theta) * Math.cos(phi);
                target.y += r * Math.sin(theta) * Math.sin(phi);
                target.z += r * Math.cos(theta);
            }

            originalPositions[i3] = target.x;
            originalPositions[i3 + 1] = target.y;
            originalPositions[i3 + 2] = target.z;

            // Explosion offset
            const dispersionFactor = 18;
            randomOffsets[i3] = (Math.random() - 0.5) * dispersionFactor;
            randomOffsets[i3 + 1] = (Math.random() - 0.5) * dispersionFactor;
            randomOffsets[i3 + 2] = (Math.random() - 0.5) * dispersionFactor;

            positions[i3] = originalPositions[i3] + randomOffsets[i3];
            positions[i3 + 1] = originalPositions[i3 + 1] + randomOffsets[i3 + 1];
            positions[i3 + 2] = originalPositions[i3 + 2] + randomOffsets[i3 + 2];

            const colorMix = Math.random();
            const color = new THREE.Color().lerpColors(DEEP_BLUE, ELECTRIC_BLUE, colorMix);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;

            sizes[i] = Math.random() * 0.05 + 0.02;
        }

        particlesOriginalPositionRef.current = originalPositions;
        particlesRandomOffsetRef.current = randomOffsets;

        return { positions, colors, sizes };
    }, []);

    useFrame((state) => {
        if (!pointsRef.current) return;

        const posAttr = pointsRef.current.geometry.attributes.position;
        const positions = posAttr.array;
        const originalPositions = particlesOriginalPositionRef.current;
        const randomOffsets = particlesRandomOffsetRef.current;

        if (!originalPositions || !randomOffsets) return;

        const scrollProgress = scrollProgressRef.current;
        const assemblyProgress = assemblyProgressRef.current;

        const assemblyFactor = Math.pow(assemblyProgress, 2.5);
        const explosionFactor = scrollProgress * 3.5;

        baseRotationRef.current += 0.0003 + scrollProgress * 0.002;
        pointsRef.current.rotation.y = baseRotationRef.current;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            const time = state.clock.elapsedTime;

            const floatX = Math.sin(time * 0.3 + i) * 0.04 * (1 - scrollProgress);
            const floatY = Math.cos(time * 0.4 + i) * 0.04 * (1 - scrollProgress);

            const scatter = randomOffsets[i3] * ((1 - assemblyFactor) + explosionFactor);
            positions[i3] = originalPositions[i3] + scatter + floatX;

            const scatterY = randomOffsets[i3 + 1] * ((1 - assemblyFactor) + explosionFactor);
            positions[i3 + 1] = originalPositions[i3 + 1] + scatterY + floatY;

            const scatterZ = randomOffsets[i3 + 2] * ((1 - assemblyFactor) + explosionFactor);
            positions[i3 + 2] = originalPositions[i3 + 2] + scatterZ;
        }

        // Fade logic
        const targetOpacity = scrollProgress > 0.8 ? Math.max(0, 1 - (scrollProgress - 0.8) * 5) : 1.0;
        pointsRef.current.material.opacity += (targetOpacity - pointsRef.current.material.opacity) * 0.1;

        posAttr.needsUpdate = true;
    });

    return (
        <Points key={PARTICLE_COUNT} ref={pointsRef} positions={positions} colors={colors} sizes={sizes}>
            <PointMaterial
                vertexColors
                size={0.04}
                sizeAttenuation
                transparent
                opacity={1}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </Points>
    );
});

const GlowSphere = ({ scrollProgressRef }) => {
    const meshRef = useRef();
    const materialRef = useRef();

    const shaderData = useMemo(() => ({
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color('#3B82F6') },
            uScrollProgress: { value: 0 },
        },
        vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
        fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uScrollProgress;
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
        float alpha = intensity * (1.0 - uScrollProgress) * 0.2;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    }), []);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
            materialRef.current.uniforms.uScrollProgress.value = scrollProgressRef.current;
        }
    });

    return (
        <mesh ref={meshRef} scale={4}>
            <sphereGeometry args={[1, 32, 32]} />
            <shaderMaterial ref={materialRef} {...shaderData} />
        </mesh>
    );
};

const Scene = ({ scrollProgressRef, assemblyProgressRef }) => {
    return (
        <>
            <ambientLight intensity={0.5} />
            <GlowSphere scrollProgressRef={scrollProgressRef} />
            <ParticleSystem
                scrollProgressRef={scrollProgressRef}
                assemblyProgressRef={assemblyProgressRef}
            />
        </>
    );
};

const HeroCanvas = ({ scrollProgressRef, assemblyProgressRef }) => {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none">
            <Canvas
                camera={{ position: [0, 0, 8], fov: 55 }}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: 'high-performance',
                }}
                dpr={[1, 2]}
            >
                <color attach="background" args={['#05070A']} />
                <Scene
                    scrollProgressRef={scrollProgressRef}
                    assemblyProgressRef={assemblyProgressRef}
                />
            </Canvas>
        </div>
    );
};

export default HeroCanvas;
