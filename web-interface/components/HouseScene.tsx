"use client";

import { useRef, useMemo, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Shield geometry constants — used for collision detection in ThreatArrow
const SHIELD_CENTER = new THREE.Vector3(0, 0.55, 0);
const SHIELD_RADIUS = 1.48; // slightly inside the 1.55 XZ scale of the icosahedron

// ─── Solid simulation house ───────────────────────────────────────────────────
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

    // Material name → solid architectural color
    const MAT_PALETTE: Record<string, { color: string; roughness: number }> = {
      foundation_brown_brick: { color: "#1C4C70", roughness: 0.62 },
      glass_window:           { color: "#9BA8BB", roughness: 0.28 },
      metal_dark_brown:       { color: "#1C4C70", roughness: 0.55 },
      metal_grey:             { color: "#9BA8BB", roughness: 0.50 },
      plaster_light_brown:    { color: "#E8EEF5", roughness: 0.65 },
      plaster_sand:           { color: "#E8EEF5", roughness: 0.68 },
      plate_grey:             { color: "#9BA8BB", roughness: 0.48 },
      wood_balls_brown:       { color: "#4B7BA7", roughness: 0.60 },
      wood_brown:             { color: "#4B7BA7", roughness: 0.62 },
    };
    const FALLBACK = { color: "#9BA8BB", roughness: 0.55 };

    clone.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      const newMats = mats.map(mat => {
        const name = (mat as THREE.Material).name ?? "";
        const def = MAT_PALETTE[name] ?? FALLBACK;
        return new THREE.MeshStandardMaterial({
          color: def.color,
          roughness: def.roughness,
          metalness: 0.05,
          wireframe: false,
          transparent: false,
        });
      });
      child.material = newMats.length === 1 ? newMats[0] : newMats;
      child.castShadow = false;
      child.receiveShadow = false;
    });

    return clone;
  }, [scene]);

  return <primitive object={processed} />;
}

// ─── AI Shield — thin wireframe boundary with absorption pulse ────────────────
function AIShield({
  hovered,
  impactTimeRef,
}: {
  hovered: boolean;
  impactTimeRef: React.RefObject<number>;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);
  const t = useRef(0);

  // Base scale values (never changed)
  const BASE_SCALE: [number, number, number] = [1.55, 1.82, 1.55];

  useFrame((_, delta) => {
    t.current += delta;
    meshRef.current.rotation.y += delta * 0.09;
    meshRef.current.rotation.x = Math.sin(t.current * 0.2) * 0.04;

    // Absorption pulse: triggered by impactTimeRef
    const PULSE_DURATION = 0.28; // seconds
    const timeSinceImpact = (Date.now() - impactTimeRef.current) / 1000;
    const baseOpacity = hovered ? 0.18 : 0.11;

    if (timeSinceImpact < PULSE_DURATION) {
      // Bell curve: 0 → peak → 0 over PULSE_DURATION
      const pulse = Math.sin((timeSinceImpact / PULSE_DURATION) * Math.PI);
      // Subtle scale ripple: max +4%
      const sf = 1 + pulse * 0.04;
      meshRef.current.scale.set(BASE_SCALE[0] * sf, BASE_SCALE[1] * sf, BASE_SCALE[2] * sf);
      // Brief opacity spike
      matRef.current.opacity = baseOpacity + pulse * 0.14;
    } else {
      meshRef.current.scale.set(...BASE_SCALE);
      matRef.current.opacity = baseOpacity;
    }
  });

  return (
    <mesh ref={meshRef} scale={BASE_SCALE} position={[0, 0.55, 0]}>
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial
        ref={matRef}
        color="#4B7BA7"
        wireframe
        transparent
        opacity={0.11}
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
    matRef.current.opacity = (1 - t) * 0.10;
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <ringGeometry args={[1.0, 1.05, 64]} />
      <meshStandardMaterial
        ref={matRef}
        color="#4B7BA7"
        emissive="#3A6B97"
        emissiveIntensity={0.3}
        transparent
        opacity={0.08}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ─── Threat arrow — with bounce physics on shield collision ───────────────────
function ThreatArrow({
  startPos,
  targetPos,
  onDone,
  onImpact,
}: {
  startPos: [number, number, number];
  targetPos: [number, number, number];
  onDone: () => void;
  onImpact: () => void;
}) {
  const arrowRef = useRef<THREE.Group>(null!);
  const progress = useRef(0);
  const dead = useRef(false);
  const opacityVal = useRef(1);

  // Phase state machine: approach → bounce → fade
  const phase = useRef<'approach' | 'bounce' | 'fade'>('approach');
  const bouncePos = useRef(new THREE.Vector3());
  const bounceVel = useRef(new THREE.Vector3());
  const bounceTimer = useRef(0);

  const [sx, sy, sz] = startPos;
  const [tx, ty, tz] = targetPos;

  // Quaternion: rotate local +Y to face the target direction
  const quaternion = useMemo(() => {
    const dir = new THREE.Vector3(tx - sx, ty - sy, tz - sz).normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  }, [sx, sy, sz, tx, ty, tz]);

  useFrame((_, delta) => {
    if (dead.current) return;

    if (phase.current === 'approach') {
      progress.current += delta * 0.40;
      const t = Math.min(progress.current, 1);
      const ease = t * t * (3 - 2 * t);

      const px = THREE.MathUtils.lerp(sx, tx, ease);
      const py = THREE.MathUtils.lerp(sy, ty, ease);
      const pz = THREE.MathUtils.lerp(sz, tz, ease);
      arrowRef.current.position.set(px, py, pz);

      // Collision: distance from arrow to shield center in shared local space
      const dx = px - SHIELD_CENTER.x;
      const dy = py - SHIELD_CENTER.y;
      const dz = pz - SHIELD_CENTER.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist <= SHIELD_RADIUS || t >= 1) {
        // Switch to bounce phase
        phase.current = 'bounce';
        bouncePos.current.set(px, py, pz);

        // Bounce velocity: reverse incoming direction at 0.55 units/s
        const incomingDir = new THREE.Vector3(tx - sx, ty - sy, tz - sz).normalize();
        bounceVel.current.copy(incomingDir).multiplyScalar(-0.55);

        bounceTimer.current = 0;
        onImpact(); // notify shield
      }

    } else if (phase.current === 'bounce') {
      bounceTimer.current += delta;

      // Frame-rate-independent exponential damping (coefficient = 5/s)
      const damping = Math.max(0, 1 - 5 * delta);
      bounceVel.current.multiplyScalar(damping);
      bouncePos.current.addScaledVector(bounceVel.current, delta);
      arrowRef.current.position.copy(bouncePos.current);

      // Bounce duration: 0.25s, then fade
      if (bounceTimer.current >= 0.25) {
        phase.current = 'fade';
      }

    } else if (phase.current === 'fade') {
      opacityVal.current = Math.max(0, opacityVal.current - delta * 5);
      arrowRef.current.traverse(child => {
        if (child instanceof THREE.Mesh) {
          (child.material as THREE.MeshStandardMaterial).opacity = opacityVal.current;
        }
      });
      if (opacityVal.current <= 0) {
        dead.current = true;
        onDone();
      }
    }
  });

  return (
    <group ref={arrowRef} position={startPos} quaternion={quaternion}>
      {/* Cone tip — leading edge pointing toward target */}
      <mesh position={[0, 0.11, 0]}>
        <coneGeometry args={[0.026, 0.085, 6]} />
        <meshStandardMaterial
          color="#C75555"
          emissive="#8B4444"
          emissiveIntensity={2}
          transparent
          opacity={1}
        />
      </mesh>
      {/* Shaft */}
      <mesh position={[0, -0.04, 0]}>
        <cylinderGeometry args={[0.007, 0.007, 0.16, 6]} />
        <meshStandardMaterial
          color="#C75555"
          emissive="#8B4444"
          emissiveIntensity={1.5}
          transparent
          opacity={0.80}
        />
      </mesh>
    </group>
  );
}

// ─── Shield glow halo — additive blending bloom approximation ────────────────
function ShieldGlow() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    meshRef.current.rotation.y -= delta * 0.05;
    meshRef.current.rotation.z = Math.sin(t.current * 0.12) * 0.025;
  });

  return (
    <mesh ref={meshRef} scale={[1.72, 2.02, 1.72]} position={[0, 0.55, 0]}>
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial
        color="#4B7BA7"
        transparent
        opacity={0.036}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── Threat spawner ───────────────────────────────────────────────────────────
function Threats({ onImpact }: { onImpact: () => void }) {
  const [list, setList] = useState<{
    id: number;
    startPos: [number, number, number];
    targetPos: [number, number, number];
  }[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setList(prev => {
        if (prev.length >= 3) return prev;
        // Positions computed once here — never recalculated on re-render
        const angle = Math.random() * Math.PI * 2;
        const d = 2.6;
        const sy = 0.6 + Math.random() * 0.8;
        const startPos: [number, number, number] = [Math.cos(angle) * d, sy, Math.sin(angle) * d];
        const targetPos: [number, number, number] = [Math.cos(angle) * 1.3, sy * 0.5, Math.sin(angle) * 1.3];
        return [...prev, { id: nextId.current++, startPos, targetPos }];
      });
    }, 1400);
    return () => clearInterval(iv);
  }, []);

  return (
    <>
      {list.map(t => (
        <ThreatArrow
          key={t.id}
          startPos={t.startPos}
          targetPos={t.targetPos}
          onImpact={onImpact}
          onDone={() => setList(prev => prev.filter(p => p.id !== t.id))}
        />
      ))}
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
              color={i % 5 === 0 ? "#7AA85C" : "#4B7BA7"}
              emissive={i % 5 === 0 ? "#5A8C44" : "#3A6B97"}
              emissiveIntensity={1.2}
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
    matRef.current.opacity = (1 - t) * 0.35;
    ref.current.scale.setScalar(1 + t * 0.5);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.020, 6, 6]} />
      <meshStandardMaterial
        ref={matRef}
        color="#7AA85C"
        emissive="#5A8C44"
        emissiveIntensity={0.8}
        transparent
        opacity={0.3}
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
      <meshStandardMaterial color="#A8B5C8" emissive="#000000" emissiveIntensity={0} roughness={0.55} />
    </mesh>
  );
}

// ─── Full scene ───────────────────────────────────────────────────────────────
function Scene({ scrollY }: { scrollY: number }) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null!);
  const t = useRef(0);

  // Shared impact timestamp — written by ThreatArrow, read by AIShield
  const impactTimeRef = useRef<number>(0);
  const handleImpact = () => { impactTimeRef.current = Date.now(); };

  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, 0.1); // cap: prevents jump when returning from inactive tab
    t.current += safeDelta;
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
      safeDelta * 2
    );
    const targetScale = 1 - sp * 0.10;
    groupRef.current.scale.setScalar(
      THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, safeDelta * 2)
    );
  });

  return (
    <>
      {/* Fog — light, adds depth without darkening */}
      <fog attach="fog" args={["#f0f4fa", 12, 22]} />

      {/* Light mode lighting */}
      <ambientLight intensity={0.45} color="#E8E9EB" />
      <pointLight position={[0, 4, 0]} color="#4B7BA7" intensity={0.9} distance={8} />
      <pointLight position={[3, 2, 3]} color="#6B8FC4" intensity={0.4} distance={6} />
      <pointLight position={[-3, 1, -3]} color="#A8B5C8" intensity={0.25} distance={5} />
      {/* Rim backlight — creates Fresnel-style edge highlight on house + shield */}
      <directionalLight position={[-1.5, 1.5, -5]} color="#7BA8C8" intensity={0.38} />

      {/* Outer group: 5% scale reduction + X offset to clear hero text */}
      <group scale={[0.95, 0.95, 0.95]} position={[0.55, -0.5, 0]}>
        <Float speed={1.0} rotationIntensity={0.08} floatIntensity={0.30}>
          <group
            ref={groupRef}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            <Suspense fallback={<HouseFallback />}>
              <HouseModel />
            </Suspense>
            <AIShield hovered={hovered} impactTimeRef={impactTimeRef} />
            <ShieldGlow />
            <Threats onImpact={handleImpact} />
            <VerifyPulses />
          </group>
        </Float>

        {[0, 1, 2].map(i => <PulseRing key={i} index={i} />)}
        <DataRing />
      </group>
    </>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function HouseScene({ scrollY = 0 }: { scrollY?: number }) {
  return (
    <div className="w-full h-full" style={{ background: "transparent" }}>
      <Canvas
        camera={{ position: [0, 1.2, 4.5], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x000000, 0); // fully transparent clear
          scene.background = null;       // no Three.js background fill
        }}
      >
        <Scene scrollY={scrollY} />
      </Canvas>
    </div>
  );
}

// Preload
useGLTF.preload("/models/house.glb");
