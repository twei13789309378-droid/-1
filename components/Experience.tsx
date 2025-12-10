import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import MonetParticles from './MonetParticles';
import StarTopper from './StarTopper';
import ChristmasTextParticles from './ChristmasTextParticles';
import { useStore } from '../store';

interface ExperienceProps {
  handOpennessRef: React.MutableRefObject<number>;
}

const PostProcessingEffects = () => {
    const { bloomStrength } = useStore();
    return (
        <EffectComposer enableNormalPass={false}>
            <Bloom 
                luminanceThreshold={0.15} // Lower threshold to capture secondary colors
                mipmapBlur 
                intensity={bloomStrength} 
                radius={0.6}
            />
        </EffectComposer>
    )
}

const Experience: React.FC<ExperienceProps> = ({ handOpennessRef }) => {
  const { currentTheme } = useStore();

  return (
    <Canvas
      camera={{ position: [0, 5, 20], fov: 40 }} 
      dpr={[1, 2]} 
      gl={{ 
        antialias: false, 
        alpha: false,
        stencil: false,
        depth: true,
        toneMappingExposure: 1.2
      }}
    >
      <color attach="background" args={[currentTheme.colors.background]} />
      
      {/* Subtle fog for depth */}
      <fog attach="fog" args={[currentTheme.colors.background, 10, 60]} />
      
      {/* Lighting for the 3D Star */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.0} />
      
      <Suspense fallback={null}>
        <MonetParticles handOpennessRef={handOpennessRef} />
        <StarTopper handOpennessRef={handOpennessRef} />
        <ChristmasTextParticles handOpennessRef={handOpennessRef} />
      </Suspense>

      <PostProcessingEffects />

      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        minDistance={5} 
        maxDistance={50}
        autoRotate={true}
        autoRotateSpeed={0.5} 
      />
    </Canvas>
  );
};

export default Experience;