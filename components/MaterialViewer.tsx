
import React, { Suspense, useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Center, useTexture, Stage } from '@react-three/drei';
import * as THREE from 'three';
import { Upload } from 'lucide-react';
import { MaterialState, ViewerSettings } from '../types';

// Fix for missing R3F intrinsic types in JSX.IntrinsicElements by using capitalized constants cast to any
const Mesh = 'mesh' as any;
const SphereGeometry = 'sphereGeometry' as any;
const PlaneGeometry = 'planeGeometry' as any;
const BoxGeometry = 'boxGeometry' as any;
const MeshStandardMaterial = 'meshStandardMaterial' as any;
const Color = 'color' as any;
const GridHelper = 'gridHelper' as any;

interface MaterialViewerProps {
  material: MaterialState;
  settings: ViewerSettings;
}

const PBRMeshInternal: React.FC<MaterialViewerProps> = ({ material, settings }) => {
  // Identify which maps we actually have URLs for
  const mapConfig = useMemo(() => {
    const config: Record<string, string> = {};
    if (material.map) config.map = material.map.url;
    if (material.normalMap) config.normalMap = material.normalMap.url;
    if (material.roughnessMap) config.roughnessMap = material.roughnessMap.url;
    if (material.metalnessMap) config.metalnessMap = material.metalnessMap.url;
    if (material.aoMap) config.aoMap = material.aoMap.url;
    if (material.displacementMap) config.displacementMap = material.displacementMap.url;
    return config;
  }, [material]);

  // useTexture handles the async loading and suspends until ready
  // Cast to any to fix property access errors on "unknown" types returned by useTexture in some environments
  const textures = useTexture(mapConfig) as any;

  // Configure texture properties (tiling, wrapping, color space) whenever they change
  useEffect(() => {
    Object.entries(textures).forEach(([key, value]) => {
      // Cast value to THREE.Texture to access properties safely
      const tex = value as THREE.Texture;
      if (tex && tex.isTexture) {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(settings.tiling, settings.tiling);
        
        // Ensure sRGB for albedo, Linear for others
        if (key === 'map') {
          tex.colorSpace = THREE.SRGBColorSpace;
        } else {
          tex.colorSpace = THREE.NoColorSpace;
        }
        tex.needsUpdate = true;
      }
    });
  }, [textures, settings.tiling]);

  const Geometry = useMemo(() => {
    switch (settings.shape) {
      case 'sphere':
        return <SphereGeometry args={[1, 128, 128]} />;
      case 'plane':
        return <PlaneGeometry args={[2, 2, 512, 512]} />;
      case 'cube':
      default:
        return <BoxGeometry args={[1.5, 1.5, 1.5, 128, 128, 128]} />;
    }
  }, [settings.shape]);

  return (
    <Mesh rotation={settings.shape === 'plane' ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}>
      {Geometry}
      <MeshStandardMaterial
        {...textures}
        displacementScale={settings.displacementScale}
        roughness={material.roughnessMap ? 1 : settings.roughness}
        metalness={material.metalnessMap ? 1 : settings.metalness}
      />
    </Mesh>
  );
};

// Simple fallback mesh to show while textures are loading or before any are dragged in
const FallbackMesh: React.FC<{ settings: ViewerSettings }> = ({ settings }) => {
  const Geometry = useMemo(() => {
    switch (settings.shape) {
      case 'sphere':
        return <SphereGeometry args={[1, 32, 32]} />;
      case 'plane':
        return <PlaneGeometry args={[2, 2]} />;
      case 'cube':
      default:
        return <BoxGeometry args={[1.5, 1.5, 1.5]} />;
    }
  }, [settings.shape]);

  return (
    <Mesh rotation={settings.shape === 'plane' ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}>
      {Geometry}
      <MeshStandardMaterial color="#27272a" roughness={0.8} metalness={0.2} />
    </Mesh>
  );
};

const MaterialViewer: React.FC<MaterialViewerProps> = ({ material, settings }) => {
  const hasTextures = Object.values(material).some(v => v !== null);

  return (
    <div className="w-full h-full bg-zinc-950">
      <Canvas 
        shadows 
        dpr={[1, 2]} 
        gl={{ 
          antialias: true, 
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace
        }}
      >
        <Color attach="background" args={['#09090b']} />
        <PerspectiveCamera makeDefault position={[0, 0, 4]} fov={45} />
        
        <Suspense fallback={<FallbackMesh settings={settings} />}>
          <Stage 
            intensity={settings.exposure} 
            environment="city" 
            preset="rembrandt"
            adjustCamera={false} 
            shadows={{ type: 'contact', opacity: 0.6, blur: 3 }}
          >
            <Center>
              {hasTextures ? (
                <PBRMeshInternal material={material} settings={settings} />
              ) : (
                <FallbackMesh settings={settings} />
              )}
            </Center>
          </Stage>
        </Suspense>

        <OrbitControls 
          makeDefault 
          enablePan={false} 
          minDistance={2} 
          maxDistance={10} 
          autoRotate={!hasTextures}
          autoRotateSpeed={0.5}
        />
        
        <GridHelper 
          args={[40, 40, '#18181b', '#111111']} 
          position={[0, -1.5, 0]} 
        />
      </Canvas>

      {!hasTextures && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center bg-zinc-900/40 backdrop-blur-sm p-10 rounded-3xl border border-white/5 scale-90 md:scale-100">
            <Upload className="w-12 h-12 text-zinc-500 mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-zinc-300">Ready to Load</h3>
            <p className="text-zinc-500 text-sm mt-2 text-center max-w-xs">
              Drag your texture set here to visualize. <br/>
              Matches: Albedo, Normal, Roughness, Metal, AO, Height.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialViewer;
