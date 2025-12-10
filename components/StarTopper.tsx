import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StarTopperProps {
  handOpennessRef: React.MutableRefObject<number>;
}

const StarTopper: React.FC<StarTopperProps> = ({ handOpennessRef }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Generate 5-point star shape
  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 0.5; 
    const innerRadius = 0.15; // Even finer points
    
    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        // + Math.PI / 2 to point UP
        const angle = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }, []);

  const extrudeSettings = useMemo(() => ({
    depth: 0.02, // Ultra thin, almost like a flat cut-out but with bevel
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 5 // Smoother bevel
  }), []);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Rotate the star
    meshRef.current.rotation.y += 0.02;

    // Scale Logic: 
    // Tree (0.0) -> Scale 1.0 (Visible)
    // Galaxy (1.0) -> Scale 0.0 (Invisible)
    const openness = handOpennessRef.current;
    
    // Invert: Open(1) = Scale(0). Closed(0) = Scale(1).
    const targetScale = 1.0 - openness;
    
    // Sharp threshold for disappearance
    const visibleScale = targetScale < 0.1 ? 0 : targetScale;

    meshRef.current.scale.lerp(new THREE.Vector3(visibleScale, visibleScale, visibleScale), 0.1);
  });

  return (
    <mesh ref={meshRef} position={[0, 10.5, 0]}>
      <extrudeGeometry args={[starShape, extrudeSettings]} />
      <meshStandardMaterial 
        color="#FFD700" 
        emissive="#F0B000"
        emissiveIntensity={2.0}
        roughness={0.1}
        metalness={0.8}
      />
    </mesh>
  );
};

export default StarTopper;