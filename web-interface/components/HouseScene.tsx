"use client";

import { useRef, useMemo, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, useGLTF } from "@react-three/drei";
import * as THREE from "three";

// ─── Material palette (dark-tech override) ────────────────────────────────────
const MAT_MAP: Record<string, { color: string; emissive: string; emissiveIntensity: number; metalness: number; roughness: number; transparent?: boolean; opacity?: number }> = {
  foundation_brown_brick: { color: "#1a2744", emissive: "#0d1a33", emissiveIntensity: 0.1, metalness: 0.2, roughness: 0.8 },
  glass_window:           { color: "#3b82f6", emissive: "#1d4ed8", emissiveIntensity: 0.9, metalness: 0.9, roughness: 0.05, transparent: true, opacity: 0.75 },
  metal_dark_brown:       { color: "#0f172a", emissive: "#000000", emissiveIntensity: 0.0, metalness: 0.8, roughness: 0.3 },
  metal_grey:             { color: "#1e293b", emissive: "#0f172a", emissiveIntensity: 0.05, metalness: 0.7, roughness: 0.4 },
  plaster_light_brown:    { color: "#1e3a5f", emissive: "#0f2040", emissiveIntensity: 0.15, metalness: 0.1, roughness: 0.7 },
  plaster_sand:           { color: "#1a3050", emissive: "#0d1a30", emissiveIntensity: 0.12, metalness: 0.1, roughness: 0.75 },
  plate_grey:             { color: "#0f172a", emissive: "#000000", emissiveIntensity: 0.0, metalness: 0.6, roughness: 0.5 },
  wood_balls_brown:       { color: "#10b981", emissive: "#059669", emissiveIntensity: 0.5, metalness: 0.3, roughness: 0.4 },
  wood_brown:             { color: "#1e40af", emissive: "#1e3a8a", emissiveIntensity: 0.25, metalness: 0.2, roughness: 0.6 },
};

// ─── Real house loaded from GLB ───────────────────────────────────────────────
function HouseModel() {
  const { scene } = useGLTF("/models/house.glb");

  // Normalize scale + override materials once
  const processed = useMemo(() => {
    const clone = scene.clone(true);

    // Compute bounding box to auto-scale
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 2.2;
    const scale = targetSize / maxDim;
    clone.scale.setScalar(scale);

    // Re-center
    box.setFromObject(clone);
    const center = new THREE.Vector3();
    box.getCenter(center);
    clone.position.sub(center);
    // Sit on ground plane
    box.setFromObject(clone);
    clone.position.y -= box.min.y;

    // Override materials
    clone.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      const overridden = mats.map(mat => {
        const name: string = (mat as THREE.Material).name || "";
        const def = MAT_MAP[name];
        if (!def) return mat;
        const m = new THREE.MeshStandardMaterial({
          color: def.color,
          emissive: def.emissive,
          emissiveIntensity: def.emissiveIntensity,
          metalness: def.metalness,
          roughness: def.roughness,
          transparent: def.transparent ?? false,
          opacity: def.opacity ?? 1,
        });
        return m;
      });
      child.material = overridden.length === 1 ? overridden[0] : overridden;
      child.castShadow = true;
      child.receiveShadow = true;
    });

    return clone;
  }, [scene]);

  return <primitive object={processed} />;
}

// ─── AI Shield ────────────────────────────────────────────────────────────────
function AIShield({ hovered }: { hovered: boolean }) {
  const ref = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshStandardMaterial>(null!);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    ref.current.rotation.y += delta * 0.13;
    ref.current.rotation.x = Math.sin(t.current * 0.25) * 0.08;
    const target = hovered ? 0.22 : 0.09;
    matRef.current.opacity += (target - matRef.current.opacity) * 0.06;
  });

  return (
    <mesh ref={ref} scale={[1.6, 1.9, 1.6]} position={[0, 0.55, 0]}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        ref={matRef}
        color="#3b82f6"
        emissive="#3b82f6"
        emissiveIntensity={0.6}
        wireframe
        transparent
        opacity={0.09}
      />
    </mesh>
  );
}

// ─── Pulse ring ───────────────────────────────────────────────────────────────
function PulseRing({ index }: { index: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshStandardMaterial>(null!);
  const offset = index * 1.1;

  useFrame(({ clock }) => {
    const t = ((clock.getElapsedTime() * 0.45 + offset) % 2) / 2;
    ref.current.scale.setScalar(1.5 + t * 1.4);
    matRef.current.opacity = (1 - t) * 0.28;
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <ringGeometry args={[1.0, 1.06, 64]} />
      <meshStandardMaterial
        ref={matRef}
        color="#10b981"
        emissive="#10b981"
        emissiveIntensity={1.2}
        transparent
        opacity={0.25}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ─── Threat particle ─────────────────────────────────────────────────────────
function ThreatParticle({ startPos, targetPos, onDone }: {
  startPos: [number, number, number];
  targetPos: [number, number, number];
  onDone: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const progress = useRef(0);
  const dead = useRef(false);

  useFrame((_, delta) => {
    if (dead.current) return;
    progress.current += delta * 0.38;
    const t = Math.min(progress.current, 1);
    const ease = t * t * (3 - 2 * t);
    ref.current.position.set(
      THREE.MathUtils.lerp(startPos[0], targetPos[0], ease),
      THREE.MathUtils.lerp(startPos[1], targetPos[1], ease),
      THREE.MathUtils.lerp(startPos[2], targetPos[2], ease)
    );
    if (t >= 0.92) {
      const m = ref.current.material as THREE.MeshStandardMaterial;
      m.opacity = Math.max(0, m.opacity - delta * 4);
      if (m.opacity <= 0) { dead.current = true; onDone(); }
    }
  });

  return (
    <mesh ref={ref} position={startPos}>
      <sphereGeometry args={[0.045, 8, 8]} />
      <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3} transparent opacity={1} />
    </mesh>
  );
}

// ─── Threat spawner ───────────────────────────────────────────────────────────
function Threats() {
  const [list, setList] = useState<{ id: number; angle: number; done: boolean }[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setList(prev => {
        if (prev.filter(t => !t.done).length >= 3) return prev;
        return [...prev, { id: nextId.current++, angle: Math.random() * Math.PI * 2, done: false }];
      });
    }, 1400);
    return () => clearInterval(iv);
  }, []);

  return (
    <>
      {list.filter(t => !t.done).map(t => {
        const d = 2.6;
        const sp: [number, number, number] = [Math.cos(t.angle) * d, 0.6 + Math.random() * 0.8, Math.sin(t.angle) * d];
        const ep: [number, number, number] = [Math.cos(t.angle) * 1.3, sp[1] * 0.5, Math.sin(t.angle) * 1.3];
        return (
          <ThreatParticle
            key={t.id}
            startPos={sp}
            targetPos={ep}
            onDone={() => setList(prev => prev.map(p => p.id === t.id ? { ...p, done: true } : p))}
          />
        );
      })}
    </>
  );
}

// ─── Data orbit ring ──────────────────────────────────────────────────────────
function DataRing() {
  const ref = useRef<THREE.Group>(null!);
  const count = 20;

  useFrame((_, delta) => { ref.current.rotation.y += delta * 0.18; });

  return (
    <group ref={ref} rotation={[0.4, 0, 0]}>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        const r = 2.1;
        return (
          <mesh key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial
              color={i % 5 === 0 ? "#10b981" : "#3b82f6"}
              emissive={i % 5 === 0 ? "#10b981" : "#3b82f6"}
              emissiveIntensity={2.5}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Verify pulses ────────────────────────────────────────────────────────────
function VerifyPulses() {
  const count = 6;
  const angles = useMemo(() => Array.from({ length: count }, (_, i) => (i / count) * Math.PI * 2), []);

  return (
    <>
      {angles.map((angle, i) => (
        <VerifyPulse key={i} angle={angle} delay={i * 0.5} />
      ))}
    </>
  );
}

function VerifyPulse({ angle, delay }: { angle: number; delay: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshStandardMaterial>(null!);

  useFrame(({ clock }) => {
    const t = ((clock.getElapsedTime() * 0.35 + delay) % 3) / 3;
    const r = 1.4 + t * 2.2;
    ref.current.position.set(Math.cos(angle) * r, 0.5, Math.sin(angle) * r);
    matRef.current.opacity = (1 - t) * 0.7;
    ref.current.scale.setScalar(1 + t * 0.6);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.022, 6, 6]} />
      <meshStandardMaterial
        ref={matRef}
        color="#10b981" emissive="#10b981" emissiveIntensity={3}
        transparent opacity={0.7}
      />
    </mesh>
  );
}

// ─── Fallback while loading ───────────────────────────────────────────────────
function HouseFallback() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.getElapsedTime() * 0.4;
  });
  return (
    <mesh ref={ref} position={[0, 0.5, 0]}>
      <boxGeometry args={[1, 0.8, 1]} />
      <meshStandardMaterial color="#1e3a5f" emissive="#0f2040" emissiveIntensity={0.3} wireframe />
    </mesh>
  );
}

// ─── Full scene ───────────────────────────────────────────────────────────────
function Scene({ scrollY }: { scrollY: number }) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null!);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    // Slow continuous rotation + scroll parallax
    groupRef.current.rotation.y = t.current * 0.08 + scrollY * 0.0008;
  });

  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 7, 4]} intensity={1.0} color="#ffffff" castShadow />
      <directionalLight position={[-4, 2, -4]} intensity={0.35} color="#3b82f6" />
      <pointLight position={[0, 5, 0]} color="#10b981" intensity={2} distance={9} />
      <pointLight position={[2, 1, 3]} color="#1d4ed8" intensity={0.7} distance={6} />

      <fog attach="fog" args={["#050b18", 9, 22]} />

      <Float speed={1.0} rotationIntensity={0.1} floatIntensity={0.35}>
        <group
          ref={groupRef}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <Suspense fallback={<HouseFallback />}>
            <HouseModel />
          </Suspense>
          <AIShield hovered={hovered} />
          <Threats />
          <VerifyPulses />
        </group>
      </Float>

      {[0, 1, 2].map(i => <PulseRing key={i} index={i} />)}
      <DataRing />

      {/* Ground glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[2.8, 64]} />
        <meshStandardMaterial
          color="#1d4ed8" emissive="#1d4ed8" emissiveIntensity={0.12}
          transparent opacity={0.18}
        />
      </mesh>
    </>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function HouseScene({ scrollY = 0 }: { scrollY?: number }) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 1.2, 4.5], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
        shadows
      >
        <Scene scrollY={scrollY} />
      </Canvas>
    </div>
  );
}

// Preload
useGLTF.preload("/models/house.glb");
