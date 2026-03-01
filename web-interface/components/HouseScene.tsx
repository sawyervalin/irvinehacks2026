"use client";

import { useRef, useMemo, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, useGLTF } from "@react-three/drei";
import * as THREE from "three";

// ─── Wireframe hologram house ─────────────────────────────────────────────────
function HouseModel() {
  const { scene } = useGLTF("/models/house.glb");

  const processed = useMemo(() => {
    const clone = scene.clone(true);

    // Auto-scale to target size
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2.09 / maxDim;
    clone.scale.setScalar(scale);

    // Re-center + sit on ground plane
    box.setFromObject(clone);
    const center = new THREE.Vector3();
    box.getCenter(center);
    clone.position.sub(center);
    box.setFromObject(clone);
    clone.position.y -= box.min.y;

    // Remove driveway meshes
    const DRIVEWAY_KEYS = [
      'drive', 'driveway', 'road', 'path', 'pavement',
      'concrete', 'asphalt', 'curb', 'walkway', 'sidewalk',
      'ground_path', 'terrain_path', 'terrace',
    ];
    const toRemove: THREE.Object3D[] = [];
    clone.traverse(child => {
      const nodeName = child.name.toLowerCase();
      const matName = child instanceof THREE.Mesh
        ? (Array.isArray(child.material)
            ? child.material.map(m => (m as THREE.Material).name?.toLowerCase() ?? '').join(' ')
            : ((child.material as THREE.Material).name?.toLowerCase() ?? ''))
        : '';
      if (DRIVEWAY_KEYS.some(k => nodeName.includes(k) || matName.includes(k))) {
        toRemove.push(child);
      }
    });
    toRemove.forEach(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        (Array.isArray(child.material) ? child.material : [child.material])
          .forEach((m: THREE.Material) => m.dispose());
      }
      child.parent?.remove(child);
    });

    // Override all materials → wireframe hologram
    const wireframeMat = new THREE.MeshStandardMaterial({
      color: "#1E90FF",
      emissive: "#0055CC",
      emissiveIntensity: 1.4,
      wireframe: true,
      transparent: true,
      opacity: 0.38,
    });

    clone.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return;
      child.material = wireframeMat;
      child.castShadow = false;
      child.receiveShadow = false;
    });

    return clone;
  }, [scene]);

  return <primitive object={processed} />;
}

// ─── AI Shield — thin wireframe boundary ──────────────────────────────────────
function AIShield({ hovered }: { hovered: boolean }) {
  const ref = useRef<THREE.Mesh>(null!);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    ref.current.rotation.y += delta * 0.09;
    ref.current.rotation.x = Math.sin(t.current * 0.2) * 0.04;
  });

  const opacity = hovered ? 0.10 : 0.05;

  return (
    <mesh ref={ref} scale={[1.55, 1.82, 1.55]} position={[0, 0.55, 0]}>
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial
        color="#1E90FF"
        wireframe
        transparent
        opacity={opacity}
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
    const t = ((clock.getElapsedTime() * 0.38 + offset) % 2) / 2;
    ref.current.scale.setScalar(1.5 + t * 1.4);
    matRef.current.opacity = (1 - t) * 0.18;
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <ringGeometry args={[1.0, 1.05, 64]} />
      <meshStandardMaterial
        ref={matRef}
        color="#1E90FF"
        emissive="#1E90FF"
        emissiveIntensity={0.8}
        transparent
        opacity={0.15}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ─── Threat arrow ─────────────────────────────────────────────────────────────
function ThreatArrow({ startPos, targetPos, onDone }: {
  startPos: [number, number, number];
  targetPos: [number, number, number];
  onDone: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const progress = useRef(0);
  const dead = useRef(false);
  const opacity = useRef(1);

  const [sx, sy, sz] = startPos;
  const [tx, ty, tz] = targetPos;

  const quaternion = useMemo(() => {
    const dir = new THREE.Vector3(tx - sx, ty - sy, tz - sz).normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  }, [sx, sy, sz, tx, ty, tz]);

  useFrame((_, delta) => {
    if (dead.current) return;
    progress.current += delta * 0.40;
    const t = Math.min(progress.current, 1);
    const ease = t * t * (3 - 2 * t);
    groupRef.current.position.set(
      THREE.MathUtils.lerp(sx, tx, ease),
      THREE.MathUtils.lerp(sy, ty, ease),
      THREE.MathUtils.lerp(sz, tz, ease)
    );

    if (t >= 0.90) {
      opacity.current = Math.max(0, opacity.current - delta * 6);
      groupRef.current.traverse(child => {
        if (child instanceof THREE.Mesh) {
          (child.material as THREE.MeshStandardMaterial).opacity = opacity.current;
        }
      });
      if (opacity.current <= 0) { dead.current = true; onDone(); }
    }
  });

  return (
    <group ref={groupRef} position={startPos} quaternion={quaternion}>
      {/* Cone tip — leading edge pointing toward target */}
      <mesh position={[0, 0.11, 0]}>
        <coneGeometry args={[0.026, 0.085, 6]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ff1a1a"
          emissiveIntensity={5}
          transparent
          opacity={1}
        />
      </mesh>
      {/* Shaft */}
      <mesh position={[0, -0.04, 0]}>
        <cylinderGeometry args={[0.007, 0.007, 0.16, 6]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#cc0000"
          emissiveIntensity={3}
          transparent
          opacity={0.80}
        />
      </mesh>
    </group>
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
          <ThreatArrow
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
            <sphereGeometry args={[0.018, 6, 6]} />
            <meshStandardMaterial
              color={i % 5 === 0 ? "#50FA7B" : "#1E90FF"}
              emissive={i % 5 === 0 ? "#20C050" : "#1E90FF"}
              emissiveIntensity={3}
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
    matRef.current.opacity = (1 - t) * 0.6;
    ref.current.scale.setScalar(1 + t * 0.5);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.020, 6, 6]} />
      <meshStandardMaterial
        ref={matRef}
        color="#50FA7B"
        emissive="#50FA7B"
        emissiveIntensity={1.2}
        transparent
        opacity={0.5}
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
      <meshStandardMaterial color="#1E90FF" emissive="#0055CC" emissiveIntensity={1.0} wireframe />
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
    groupRef.current.rotation.y = t.current * 0.08 + scrollY * 0.0008;

    // Scroll-based y-drift + scale from DOM
    const scrollEl = document.documentElement;
    const sp = Math.min(
      scrollEl.scrollTop / Math.max(1, scrollEl.scrollHeight - scrollEl.clientHeight),
      1
    );
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      sp * 0.5,
      delta * 2
    );
    const targetScale = 1 - sp * 0.10;
    groupRef.current.scale.setScalar(
      THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, delta * 2)
    );
  });

  return (
    <>
      {/* Dark cyber lighting */}
      <ambientLight intensity={0.15} color="#0A1525" />
      <pointLight position={[0, 4, 0]} color="#1E90FF" intensity={1.8} distance={8} />
      <pointLight position={[3, 2, 3]} color="#4DB8FF" intensity={0.6} distance={6} />
      <pointLight position={[-3, 1, -3]} color="#0040AA" intensity={0.4} distance={5} />

      <Float speed={1.0} rotationIntensity={0.08} floatIntensity={0.30}>
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
      >
        <Scene scrollY={scrollY} />
      </Canvas>
    </div>
  );
}

// Preload
useGLTF.preload("/models/house.glb");
