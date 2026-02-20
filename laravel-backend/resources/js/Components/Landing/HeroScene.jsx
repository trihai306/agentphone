import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, RoundedBox, MeshDistortMaterial, Stars, Torus, Octahedron } from '@react-three/drei';
import * as THREE from 'three';

// Premium Glass Phone Component
function PhoneDevice({ position, rotation, color, speed = 1, isDark }) {
    const meshRef = useRef();

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.003 * speed;
            meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed * 0.5) * 0.15;
        }
    });

    const bodyMaterialOptions = isDark
        ? { color: '#0f172a', metalness: 0.9, roughness: 0.2 } // Dark slate titanium
        : { color: '#f8fafc', metalness: 0.6, roughness: 0.1 }; // Light frosted silver

    const screenMaterialOptions = {
        color: color,
        metalness: 0.1,
        roughness: 0.1,
        transmission: 0.9, // Real glass effect
        thickness: 0.5,
        ior: 1.5,
        transparent: true,
        opacity: isDark ? 0.9 : 0.7,
        emissive: color,
        emissiveIntensity: isDark ? 0.4 : 0.15,
    };

    return (
        <Float speed={speed * 2} rotationIntensity={0.5} floatIntensity={0.8}>
            <group ref={meshRef} position={position} rotation={rotation}>
                {/* Phone body */}
                <RoundedBox args={[0.55, 1.1, 0.06]} radius={0.06} smoothness={4} castShadow>
                    <meshStandardMaterial {...bodyMaterialOptions} />
                </RoundedBox>

                {/* Screen (Glass/Holographic Core) */}
                <RoundedBox args={[0.5, 1.05, 0.065]} radius={0.05} smoothness={4} position={[0, 0, 0.005]}>
                    <meshPhysicalMaterial {...screenMaterialOptions} />
                </RoundedBox>

                {/* Cyberpunk UI accents on screen */}
                <mesh position={[0, -0.4, 0.04]}>
                    <planeGeometry args={[0.2, 0.015]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
                </mesh>
                <mesh position={[0, 0.4, 0.04]}>
                    <circleGeometry args={[0.02, 16]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
                </mesh>
                <mesh position={[0, 0.1, 0.04]}>
                    <planeGeometry args={[0.35, 0.4]} />
                    <meshBasicMaterial color={color} transparent opacity={0.1} />
                </mesh>
            </group>
        </Float>
    );
}

// Glowing High-Tech Core (Replacing plain sphere)
function AbstractCore({ isDark }) {
    const coreRef = useRef();
    const ring1Ref = useRef();
    const ring2Ref = useRef();

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (coreRef.current) {
            coreRef.current.rotation.y = t * 0.5;
            coreRef.current.rotation.x = t * 0.3;
        }
        if (ring1Ref.current) {
            ring1Ref.current.rotation.y = t * 1.2;
            ring1Ref.current.rotation.x = t * 0.8;
        }
        if (ring2Ref.current) {
            ring2Ref.current.rotation.y = -t * 0.8;
            ring2Ref.current.rotation.z = t * 0.5;
        }
    });

    const coreColor = isDark ? "#8b5cf6" : "#6366f1"; // Purple/Indigo
    const emissiveColor = isDark ? "#c084fc" : "#818cf8";
    const ringColor = isDark ? "#06b6d4" : "#0ea5e9"; // Cyan/LightBlue

    return (
        <group position={[0, 0, -1]}>
            {/* Spinning inner crystal */}
            <Octahedron ref={coreRef} args={[0.4, 0]}>
                <MeshDistortMaterial
                    color={coreColor}
                    attach="material"
                    distort={0.4}
                    speed={2}
                    roughness={0.1}
                    metalness={0.9}
                    emissive={emissiveColor}
                    emissiveIntensity={isDark ? 0.8 : 0.4}
                    transparent
                    opacity={0.8}
                />
            </Octahedron>

            {/* Orbiting energetic rings */}
            <Torus ref={ring1Ref} args={[0.7, 0.015, 16, 100]}>
                <meshBasicMaterial color={ringColor} transparent opacity={isDark ? 0.6 : 0.3} />
            </Torus>
            <Torus ref={ring2Ref} args={[0.9, 0.01, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
                <meshBasicMaterial color={coreColor} transparent opacity={isDark ? 0.4 : 0.2} />
            </Torus>
        </group>
    );
}

// Particle network
function ParticleNetwork({ count = 120, isDark }) {
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
                size={isDark ? 0.04 : 0.06}
                vertexColors
                transparent
                opacity={isDark ? 0.8 : 0.4}
                sizeAttenuation
                depthWrite={false}
            />
        </points>
    );
}

// Connection lines between phones
function ConnectionLines({ isDark }) {
    const lineRef = useRef();

    useFrame((state) => {
        if (lineRef.current) {
            lineRef.current.material.opacity = (isDark ? 0.2 : 0.1) + Math.sin(state.clock.elapsedTime) * 0.05;
        }
    });

    const points = useMemo(() => {
        const pts = [];
        const phonePositions = [
            [-1.8, 0.5, 0], [1.8, 0.3, -0.5],
            [-1.2, -0.8, 0.5], [1.5, -0.6, 0.3],
            [0, 0, -1], // Core position
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
            <lineBasicMaterial color={isDark ? "#8b5cf6" : "#6366f1"} transparent opacity={0.15} />
        </lineSegments>
    );
}

// Scene content
function Scene({ isDark }) {
    return (
        <>
            {/* Cinematic Lighting */}
            <ambientLight intensity={isDark ? 0.2 : 0.8} />
            <directionalLight position={[5, 5, 5]} intensity={isDark ? 1 : 2} color="#ffffff" />
            <pointLight position={[-3, 2, 3]} intensity={isDark ? 0.8 : 0.4} color="#8b5cf6" />
            <pointLight position={[3, -2, 2]} intensity={isDark ? 0.6 : 0.3} color="#06b6d4" />

            {/* Environment for realistic reflections */}
            <Environment preset="city" />

            {/* Stars background (thinner in light mode) */}
            <Stars
                radius={50}
                depth={40}
                count={isDark ? 800 : 300}
                factor={3}
                saturation={0.5}
                fade
                speed={0.5}
            />

            {/* Central abstract core */}
            <AbstractCore isDark={isDark} />

            {/* Premium Phone devices */}
            <PhoneDevice isDark={isDark} position={[-1.8, 0.5, 0]} rotation={[0.1, 0.3, -0.05]} color="#8b5cf6" speed={0.8} />
            <PhoneDevice isDark={isDark} position={[1.8, 0.3, -0.5]} rotation={[-0.1, -0.4, 0.05]} color="#06b6d4" speed={1.1} />
            <PhoneDevice isDark={isDark} position={[-1.2, -0.8, 0.5]} rotation={[0.05, 0.6, 0.1]} color="#a78bfa" speed={0.9} />
            <PhoneDevice isDark={isDark} position={[1.5, -0.6, 0.3]} rotation={[-0.05, -0.2, -0.1]} color="#22d3ee" speed={1} />

            {/* Particle system */}
            <ParticleNetwork count={150} isDark={isDark} />

            {/* Connection lines */}
            <ConnectionLines isDark={isDark} />
        </>
    );
}

// Main exported component
export default function HeroScene({ className = '', isDark = true }) {
    return (
        <div className={`w-full h-full ${className}`}>
            <Canvas
                camera={{ position: [0, 0, 5], fov: 45 }}
                dpr={[1, 1.5]}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
            >
                <Suspense fallback={null}>
                    <Scene isDark={isDark} />
                </Suspense>
            </Canvas>
        </div>
    );
}
