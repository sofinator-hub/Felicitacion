
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Vignette,
} from "@react-three/postprocessing";
import * as THREE from "three";

// ==========================================
// TIPOS
// ==========================================

type Point3D = [number, number, number];

interface LotusFrame {
  time: number;
  petals: Point3D[][][];
}

interface LotusAnimationData {
  name: string;
  petalCount: number;
  rows: number;
  columns: number;
  frames: LotusFrame[];
}

// ==========================================
// CONFIGURACIÓN
// ==========================================

const PETAL_COLORS = [
  "#5479B8",
  "#7896D5",
  "#A58BCB",
  "#79B7C8",
  "#C2B9D9",
  "#6B86B6",
  "#D4CBE7",
  "#8DAFC8",
  "#B5C8E0",
  "#668BC0",
  "#91A5D0",
  "#82B9B2",
];

const PETAL_DURATION = 5.5;
const PETAL_DELAY = 0.7;
const CENTER_DELAY = 3.2;
const CENTER_DURATION = 2.8;

function smoothProgress(value: number) {
  return value * value * (3 - 2 * value);
}

function createIndices(rows: number, columns: number) {
  const indices: number[] = [];

  for (let row = 0; row < rows - 1; row++) {
    for (let col = 0; col < columns - 1; col++) {
      const a = row * columns + col;
      const b = a + columns;
      const c = b + 1;
      const d = a + 1;

      indices.push(a, b, d, b, c, d);
    }
  }

  return indices;
}

// ==========================================
// PÉTALOS ANIMADOS
// ==========================================

function AnimatedPetal({
  frames,
  petalIndex,
  rows,
  columns,
  replayKey,
}: {
  frames: LotusFrame[];
  petalIndex: number;
  rows: number;
  columns: number;
  replayKey: number;
}) {
  const startTime = useRef<number | null>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const initialPoints = frames[0].petals[petalIndex];

    const positions = new Float32Array(rows * columns * 3);

    initialPoints.forEach((row, rowIndex) => {
      row.forEach((point, colIndex) => {
        const index = (rowIndex * columns + colIndex) * 3;

        positions[index] = point[0];
        positions[index + 1] = point[1];
        positions[index + 2] = point[2];
      });
    });

    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    geo.setIndex(createIndices(rows, columns));
    geo.computeVertexNormals();

    return geo;
  }, [frames, petalIndex, rows, columns]);

  useEffect(() => {
    startTime.current = null;
  }, [replayKey]);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  useFrame(({ clock }) => {
    if (frames.length < 2) return;

    if (startTime.current === null) {
      startTime.current = clock.elapsedTime;
    }

    const elapsed = clock.elapsedTime - startTime.current;
    const delay = (petalIndex / frames.length) * PETAL_DELAY;

    const rawProgress = THREE.MathUtils.clamp(
      (elapsed - delay) / PETAL_DURATION,
      0,
      1
    );

    const progress = smoothProgress(rawProgress);
    const framePosition = progress * (frames.length - 1);

    const frameIndex = Math.floor(framePosition);
    const nextIndex = Math.min(
      frameIndex + 1,
      frames.length - 1
    );

    const blend = framePosition - frameIndex;

    const current = frames[frameIndex].petals[petalIndex];
    const next = frames[nextIndex].petals[petalIndex];

    const position =
      geometry.attributes.position as THREE.BufferAttribute;

    const array = position.array as Float32Array;
    let vertex = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const a = current[row][col];
        const b = next[row][col];

        array[vertex++] = THREE.MathUtils.lerp(
          a[0],
          b[0],
          blend
        );

        array[vertex++] = THREE.MathUtils.lerp(
          a[1],
          b[1],
          blend
        );

        array[vertex++] = THREE.MathUtils.lerp(
          a[2],
          b[2],
          blend
        );
      }
    }

    position.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  const color = PETAL_COLORS[petalIndex % PETAL_COLORS.length];

  return (
    <group>
      <mesh geometry={geometry} renderOrder={1}>
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.68}
          roughness={0.42}
          metalness={0.12}
          clearcoat={0.45}
          clearcoatRoughness={0.35}
          sheen={0.4}
          sheenColor="#B8C9E8"
          sheenRoughness={0.5}
          emissive={color}
          emissiveIntensity={0.008}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh geometry={geometry} renderOrder={2}>
        <meshBasicMaterial
          color="#B9C9E5"
          wireframe
          transparent
          opacity={0.13}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ==========================================
// CENTRO ANIMADO
// ==========================================

function LotusCenter({
  replayKey,
}: {
  replayKey: number;
}) {
  const centerRef = useRef<THREE.Group>(null);
  const startTime = useRef<number | null>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const stamens = useMemo(() => {
    return Array.from({ length: 16 }, (_, index) => {
      const angle = (index / 16) * Math.PI * 2;
      const radius = 0.13 + (index % 3) * 0.012;

      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: 0.19 + (index % 3) * 0.012,
        size: index % 2 === 0 ? 0.021 : 0.015,
      };
    });
  }, []);

  useEffect(() => {
    startTime.current = null;

    if (centerRef.current) {
      centerRef.current.scale.setScalar(0.001);

      centerRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];

          materials.forEach((material) => {
            material.transparent = true;
            material.opacity = 0;
          });
        }
      });
    }

    if (lightRef.current) {
      lightRef.current.intensity = 0;
    }
  }, [replayKey]);

  useFrame(({ clock }) => {
    if (!centerRef.current) return;

    if (startTime.current === null) {
      startTime.current = clock.elapsedTime;
    }

    const elapsed = clock.elapsedTime - startTime.current;

    const rawProgress = THREE.MathUtils.clamp(
      (elapsed - CENTER_DELAY) / CENTER_DURATION,
      0,
      1
    );

    const progress = smoothProgress(rawProgress);

    const scale = THREE.MathUtils.lerp(
      0.001,
      1,
      progress
    );

    centerRef.current.scale.setScalar(scale);

    centerRef.current.rotation.z =
      Math.sin(clock.elapsedTime * 0.4) * 0.018;

    if (progress >= 1) {
      const pulse =
        1 + Math.sin(clock.elapsedTime * 1.2) * 0.012;

      centerRef.current.scale.setScalar(pulse);
    }

    centerRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        materials.forEach((material) => {
          material.opacity = progress;
        });
      }
    });

    if (lightRef.current) {
      lightRef.current.intensity = progress * 0.12;
    }
  });

  return (
    <group ref={centerRef} scale={0.001}>
      {/* Halo */}
      <mesh position={[0, 0, 0.12]}>
        <sphereGeometry args={[0.19, 40, 40]} />
        <meshBasicMaterial
          color="#668BC0"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      {/* Anillo plateado */}
      <mesh position={[0, 0, 0.16]}>
        <torusGeometry args={[0.145, 0.007, 16, 80]} />
        <meshPhysicalMaterial
          color="#AFC2DF"
          metalness={0.85}
          roughness={0.24}
          transparent
          opacity={0}
        />
      </mesh>

      {/* Esfera central */}
      <mesh position={[0, 0, 0.19]}>
        <sphereGeometry args={[0.095, 48, 48]} />
        <meshPhysicalMaterial
          color="#829FCB"
          metalness={0.55}
          roughness={0.24}
          clearcoat={0.85}
          clearcoatRoughness={0.18}
          emissive="#526F9E"
          emissiveIntensity={0.035}
          transparent
          opacity={0}
        />
      </mesh>

      {/* Perla interior */}
      <mesh position={[0, 0, 0.27]}>
        <sphereGeometry args={[0.043, 40, 40]} />
        <meshPhysicalMaterial
          color="#D1DCEF"
          metalness={0.7}
          roughness={0.2}
          clearcoat={0.8}
          transparent
          opacity={0}
        />
      </mesh>

      {/* Estambres */}
      {stamens.map((stamen, index) => (
        <mesh
          key={index}
          position={[stamen.x, stamen.y, stamen.z]}
        >
          <sphereGeometry args={[stamen.size, 18, 18]} />

          <meshPhysicalMaterial
            color={
              index % 3 === 0
                ? "#D4CBE7"
                : index % 2 === 0
                  ? "#A6B8D5"
                  : "#79B7C8"
            }
            metalness={0.72}
            roughness={0.26}
            transparent
            opacity={0}
          />
        </mesh>
      ))}

      <pointLight
        ref={lightRef}
        color="#7698C8"
        intensity={0}
        distance={0.8}
      />
    </group>
  );
}

// ==========================================
// FLOR RESPONSIVE
// ==========================================

function LotusFlower({
  data,
  replayKey,
}: {
  data: LotusAnimationData;
  replayKey: number;
}) {
  const { viewport } = useThree();

  const isMobile = viewport.width < 5;

  const responsiveScale = THREE.MathUtils.clamp(
    viewport.width / (isMobile ? 5.8 : 5.2),
    0.55,
    1.18
  );

  return (
    <group
      position={[0, isMobile ? -0.25 : -0.12, 0]}
      scale={responsiveScale}
    >
      {Array.from({ length: data.petalCount }).map((_, index) => (
        <AnimatedPetal
          key={index}
          frames={data.frames}
          petalIndex={index}
          rows={data.rows}
          columns={data.columns}
          replayKey={replayKey}
        />
      ))}

      <LotusCenter replayKey={replayKey} />
    </group>
  );
}

// ==========================================
// ESTRELLAS
// ==========================================

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];

    const palette = [
      new THREE.Color("#7896D5"),
      new THREE.Color("#A58BCB"),
      new THREE.Color("#79B7C8"),
      new THREE.Color("#DCE6F8"),
      new THREE.Color("#6B86B6"),
      new THREE.Color("#82B9B2"),
      new THREE.Color("#C2B9D9"),
      new THREE.Color("#E1D8F2"),
    ];

    for (let i = 0; i < 420; i++) {
      const angle = i * 2.39996;
      const radius = 2.5 + ((i * 37) % 100) / 12;

      positions.push(
        Math.cos(angle) * radius,
        Math.sin(angle * 1.7) * 5.5,
        -1.5 - ((i * 29) % 100) / 13
      );

      const color = palette[i % palette.length];

      colors.push(color.r, color.g, color.b);
    }

    const geo = new THREE.BufferGeometry();

    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );

    geo.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3)
    );

    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;

    pointsRef.current.rotation.y =
      Math.sin(clock.elapsedTime * 0.04) * 0.035;

    pointsRef.current.rotation.z =
      clock.elapsedTime * 0.002;
  });

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      frustumCulled={false}
    >
      <pointsMaterial
        size={0.023}
        vertexColors
        transparent
        opacity={0.78}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ==========================================
// ÓRBITAS
// ==========================================

function OrbitRings() {
  const orbitRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  const responsiveScale = THREE.MathUtils.clamp(
    viewport.width / 6.2,
    0.55,
    1
  );

  useFrame(({ clock }) => {
    if (!orbitRef.current) return;

    orbitRef.current.rotation.z =
      clock.elapsedTime * 0.012;

    orbitRef.current.rotation.x =
      Math.sin(clock.elapsedTime * 0.1) * 0.012;
  });

  return (
    <group ref={orbitRef} scale={responsiveScale}>
      <mesh position={[0, 0, -0.5]}>
        <torusGeometry args={[1.75, 0.0025, 8, 180]} />
        <meshBasicMaterial
          color="#7799C8"
          transparent
          opacity={0.32}
        />
      </mesh>

      <mesh
        rotation={[0.35, 0.2, 0.2]}
        position={[0, 0, -0.6]}
      >
        <torusGeometry args={[2.15, 0.002, 8, 180]} />
        <meshBasicMaterial
          color="#A2A8C8"
          transparent
          opacity={0.2}
        />
      </mesh>

      <mesh
        rotation={[-0.35, 0.2, -0.3]}
        position={[0, 0, -0.8]}
      >
        <torusGeometry args={[2.55, 0.0015, 8, 180]} />
        <meshBasicMaterial
          color="#7586B2"
          transparent
          opacity={0.12}
        />
      </mesh>
    </group>
  );
}

// ==========================================
// ILUMINACIÓN
// ==========================================

function LotusLighting() {
  return (
    <>
      <ambientLight intensity={0.38} />

      <directionalLight
        position={[3, 5, 4]}
        intensity={0.65}
        color="#B7C9E8"
      />

      <pointLight
        position={[-2, 2, 3]}
        intensity={0.38}
        color="#638BC5"
        distance={8}
      />

      <pointLight
        position={[2, 1, -2]}
        intensity={0.3}
        color="#8B83BD"
        distance={8}
      />

      <pointLight
        position={[0, 4, 2]}
        intensity={0.25}
        color="#C2D2EA"
        distance={8}
      />
    </>
  );
}

// ==========================================
// ESCENA PRINCIPAL
// ==========================================

export default function LotusScene({
  onContinue,
}: {
  onContinue?: () => void;
}) {
  const [data, setData] =
    useState<LotusAnimationData | null>(null);

  const [error, setError] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetch("/lotus-animation.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("No se pudo cargar la flor");
        }

        return response.json();
      })
      .then((json: LotusAnimationData) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);


const handleScreenClick = () => {
  if (!data) return;

  setReplayKey((value) => value + 1);
};

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black px-6 text-center text-sm text-white">
        No se pudo cargar la flor. Comprueba que lotus-animation.json esté en public.
      </div>
    );
  }

  return (
    <main
      onClick={handleScreenClick}
      className="fixed inset-0 z-0 h-[100dvh] w-screen cursor-pointer overflow-hidden select-none"
      style={{
        background: `
          radial-gradient(
            ellipse at 50% 48%,
            rgba(35, 48, 83, 0.42) 0%,
            transparent 42%
          ),
          radial-gradient(
            ellipse at 15% 20%,
            rgba(37, 55, 105, 0.22) 0%,
            transparent 45%
          ),
          radial-gradient(
            ellipse at 85% 75%,
            rgba(75, 49, 105, 0.17) 0%,
            transparent 42%
          ),
          linear-gradient(
            180deg,
            #050711 0%,
            #000000 100%
          )
        `,
      }}
      aria-label="Una felicitación especial para Emi"
    >
      <Canvas
        camera={{
          position: [0, 0, 7],
          fov: 42,
          up: [0, 1, 0],
        }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.82,
        }}
        dpr={[1, 1.25]}
      >
        <fog attach="fog" args={["#000000", 12, 20]} />

        <ParticleField />
        <OrbitRings />
        <LotusLighting />

        <Environment preset="studio" />

        {data && (
          <LotusFlower
            data={data}
            replayKey={replayKey}
          />
        )}

        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.1}
            luminanceThreshold={0.94}
            luminanceSmoothing={0.2}
            mipmapBlur
          />

          <Vignette
            offset={0.3}
            darkness={0.42}
          />
        </EffectComposer>
      </Canvas>

      {/* ENCABEZADO */}
      <header className="pointer-events-none absolute left-0 top-0 z-10 flex w-full flex-col items-center px-4 pt-[max(38px,7dvh)] text-center sm:pt-[7dvh]">
        <p className="text-[8px] font-medium uppercase tracking-[0.4em] text-[#AFC2DF]/70 sm:text-[10px] sm:tracking-[0.55em]">
          Un detalle especial
        </p>

        <h1 className="mt-2 font-serif text-[32px] font-light tracking-[0.1em] text-[#D8E3F5] sm:mt-3 sm:text-5xl">
          Para Emi
        </h1>

        <div className="mt-2 flex items-center gap-3 sm:mt-4">
          <span className="h-px w-6 bg-gradient-to-r from-transparent to-[#8EA9D0]/60 sm:w-8" />

          <span className="font-serif text-xs italic tracking-wider text-[#9CB6D9] sm:text-base">
            Feliz cumpleaños
          </span>

          <span className="h-px w-6 bg-gradient-to-l from-transparent to-[#8EA9D0]/60 sm:w-8" />
        </div>
      </header>

      {/* CARGA */}
      {!data && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <span className="text-[9px] tracking-[0.3em] text-[#AFC2DF]/60">
            PREPARANDO UNA SORPRESA...
          </span>
        </div>
      )}
    </main>
  );
}
