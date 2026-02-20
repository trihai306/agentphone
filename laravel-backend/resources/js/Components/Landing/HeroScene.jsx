import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Stars } from '@react-three/drei';
import * as THREE from 'three';

// Animated floating phone mesh
function PhoneDevice({ position, rotation, color, speed = 1 }) {
    const meshRef = useRef();

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.003 * speed;
            meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed * 0.5) * 0.15;
        }
    });

    return (
        <Float speed={speed * 1.5} rotationIntensity={0.3} floatIntensity={0.5}>
            <group ref={meshRef} position={position} rotation={rotation}>
                {/* Phone body */}
                <mesh castShadow>
                    <boxGeometry args={[0.55, 1, 0.05]} />
                    <meshStandardMaterial
                        color={color}
                        metalness={0.8}
                        roughness={0.15}
                        envMapIntensity={1.5}
                    />
                </mesh>
                {/* Screen */}
                <mesh position={[0, 0, 0.026]}>
                    <boxGeometry args={[0.48, 0.88, 0.005]} />
                    <meshStandardMaterial
                        color="#1a1a2e"
                        metalness={0.5}
                        roughness={0.2}
                        emissive="#4c1d95"
                        emissiveIntensity={0.15}
                    />
                </mesh>
                {/* Screen glow indicator */}
                <mesh position={[0, -0.35, 0.03]}>
                    <circleGeometry args={[0.03, 16]} />
                    <meshBasicMaterial color={color} transparent opacity={0.8} />
                </mesh>
            </group>
        </Float>
    );
}

// Animated particle network
function ParticleNetwork({ count = 120 }) {
    const pointsRef = useRef();

    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const purpleColor = new THREE.Color('#8b5cf6');
        const cyanColor = new THREE.Color('#06b6d4');

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 8;

            const mixFactor = Math.random();
            const color = purpleColor.clone().lerp(cyanColor, mixFactor);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        return { positions, colors };
    }, [count]);

    useFrame((state) => {
        if (pointsRef.current) {
            pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
            pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.015) * 0.1;
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particles.positions.length / 3}
                    array={particles.positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={particles.colors.length / 3}
                    array={particles.colors}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.035}
                vertexColors
                transparent
                opacity={0.7}
                sizeAttenuation
                depthWrite={false}
            />
        </points>
    );
}

// Central glowing orb
function GlowOrb() {
    const meshRef = useRef();

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.08);
        }
    });

    return (
        <Sphere ref={meshRef} args={[0.6, 32, 32]} position={[0, 0, -1]}>
            <MeshDistortMaterial
                color="#7c3aed"
                attach="material"
                distort={0.25}
                speed={1.5}
                roughness={0.2}
                metalness={0.8}
                emissive="#4c1d95"
                emissiveIntensity={0.4}
                transparent
                opacity={0.6}
            />
        </Sphere>
    );
}

// Connection lines between phones
function ConnectionLines() {
    const lineRef = useRef();

    useFrame((state) => {
        if (lineRef.current) {
            lineRef.current.material.opacity = 0.15 + Math.sin(state.clock.elapsedTime) * 0.1;
        }
    });

    const points = useMemo(() => {
        const pts = [];
        const phonePositions = [
            [-1.8, 0.5, 0], [1.8, 0.3, -0.5],
            [-1.2, -0.8, 0.5], [1.5, -0.6, 0.3],
            [0, 0, -1],
        ];
        for (let i = 0; i < phonePositions.length; i++) {
            for (let j = i + 1; j < phonePositions.length; j++) {
                pts.push(
                    new THREE.Vector3(...phonePositions[i]),
                    new THREE.Vector3(...phonePositions[j])
                );
            }
        }
        return pts;
    }, []);

    return (
        <lineSegments ref={lineRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={points.length}
                    array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
                    itemSize={3}
                />
            </bufferGeometry>
            <lineBasicMaterial color="#8b5cf6" transparent opacity={0.15} />
        </lineSegments>
    );
}

// Scene content
function Scene() {
    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.3} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} color="#e0e7ff" />
            <pointLight position={[-3, 2, 3]} intensity={0.5} color="#8b5cf6" />
            <pointLight position={[3, -2, 2]} intensity={0.4} color="#06b6d4" />

            {/* Stars background */}
            <Stars radius={50} depth={40} count={800} factor={3} saturation={0.5} fade speed={0.5} />

            {/* Central orb */}
            <GlowOrb />

            {/* Phone devices */}
            <PhoneDevice position={[-1.8, 0.5, 0]} rotation={[0.1, 0.3, -0.05]} color="#8b5cf6" speed={0.8} />
            <PhoneDevice position={[1.8, 0.3, -0.5]} rotation={[-0.1, -0.4, 0.05]} color="#06b6d4" speed={1.1} />
            <PhoneDevice position={[-1.2, -0.8, 0.5]} rotation={[0.05, 0.6, 0.1]} color="#a78bfa" speed={0.9} />
            <PhoneDevice position={[1.5, -0.6, 0.3]} rotation={[-0.05, -0.2, -0.1]} color="#22d3ee" speed={1} />

            {/* Particle system */}
            <ParticleNetwork count={150} />

            {/* Connection lines */}
            <ConnectionLines />
        </>
    );
}

// Main exported component
export default function HeroScene({ className = '' }) {
    return (
        <div className={`w-full h-full ${className}`}>
            <Canvas
                camera={{ position: [0, 0, 5], fov: 45 }}
                dpr={[1, 1.5]}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
            >
                <Suspense fallback={null}>
                    <Scene />
                </Suspense>
            </Canvas>
        </div>
    );
}
