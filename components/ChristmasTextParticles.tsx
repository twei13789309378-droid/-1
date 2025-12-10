import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';

const vertexShader = `
  uniform float uTime;
  uniform float uDispersion;
  uniform float uPixelRatio;

  attribute vec3 aTargetPos;
  attribute vec3 aRandomPos;
  attribute float aRandom;

  varying float vAlpha;

  void main() {
    // Basic dispersion mix: 0 = Text, 1 = Scattered
    vec3 finalPos = mix(aTargetPos, aRandomPos, uDispersion);

    // Add some noise/flow when scattered
    if (uDispersion > 0.1) {
       finalPos.x += sin(uTime * 0.5 + aRandom * 10.0) * 2.0 * uDispersion;
       finalPos.y += cos(uTime * 0.3 + aRandom * 10.0) * 2.0 * uDispersion;
    }

    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation
    gl_PointSize = 2.0 * (50.0 / -mvPosition.z) * uPixelRatio;
    
    // Subtle twinkle for text particles
    float twinkle = 0.8 + sin(uTime * 3.0 + aRandom * 100.0) * 0.2;
    gl_PointSize *= twinkle;

    // Fade out when scattered based on randomness to make it look like dissolving dust
    vAlpha = 1.0 - smoothstep(0.5, 1.0, uDispersion + (aRandom * 0.5));
  }
`;

const fragmentShader = `
  varying float vAlpha;
  
  void main() {
    if (vAlpha < 0.01) discard;

    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    if (dist > 0.5) discard;
    
    // Soft glow
    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
    
    // Gold Color
    vec3 color = vec3(1.0, 0.85, 0.4) * 2.0; // Boost brightness

    gl_FragColor = vec4(color, glow * vAlpha);
  }
`;

const generateTextParticles = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  // Increase resolution to ensure text fits
  const width = 1024;
  const height = 256;
  canvas.width = width;
  canvas.height = height;

  if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = '#FFFFFF';
      // Font size appropriate for high res canvas
      ctx.font = 'bold 120px "Times New Roman", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Merry Christmas', width / 2, height / 2);
  }

  const imageData = ctx?.getImageData(0, 0, width, height);
  if (!imageData) return { targetPositions: new Float32Array(0), randomPositions: new Float32Array(0), randoms: new Float32Array(0) };

  const targetPositions = [];
  const randomPositions = [];
  const randoms = [];

  const data = imageData.data;
  // Step for density control
  const step = 4; // Skip more pixels since resolution is higher

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const index = (y * width + x) * 4;
      // If pixel is bright enough
      if (data[index] > 128) {
        
        // Map 2D canvas to 3D world
        // Center text at (0,0)
        // Reduced scale factor (0.012) to make text smaller in 3D
        const wx = (x - width / 2) * 0.012;
        const wy = -(y - height / 2) * 0.012; // Invert Y for 3D
        const wz = 8.0; // Place in front of tree

        targetPositions.push(wx, wy, wz);

        // Random Pos for scatter
        const rx = (Math.random() - 0.5) * 40;
        const ry = (Math.random() - 0.5) * 40;
        const rz = (Math.random() - 0.5) * 20;
        randomPositions.push(rx, ry, rz);

        randoms.push(Math.random());
      }
    }
  }

  return {
    targetPositions: new Float32Array(targetPositions),
    randomPositions: new Float32Array(randomPositions),
    randoms: new Float32Array(randoms)
  };
};

interface TextProps {
  handOpennessRef: React.MutableRefObject<number>;
}

const ChristmasTextParticles: React.FC<TextProps> = ({ handOpennessRef }) => {
  const meshRef = useRef<THREE.Points>(null);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const { lerpSpeed } = useStore();

  const { targetPositions, randomPositions, randoms } = useMemo(() => generateTextParticles(), []);

  useEffect(() => {
    if (meshRef.current) {
        meshRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(targetPositions, 3));
        meshRef.current.geometry.setAttribute('aTargetPos', new THREE.BufferAttribute(targetPositions, 3));
        meshRef.current.geometry.setAttribute('aRandomPos', new THREE.BufferAttribute(randomPositions, 3));
        meshRef.current.geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));
    }
  }, [targetPositions, randomPositions, randoms]);

  useFrame((state) => {
    if (shaderRef.current && meshRef.current) {
      const current = shaderRef.current.uniforms.uDispersion.value;
      const target = handOpennessRef.current;
      shaderRef.current.uniforms.uDispersion.value += (target - current) * lerpSpeed;
      
      shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      shaderRef.current.uniforms.uPixelRatio.value = state.viewport.dpr;
    }
  });

  return (
    <points ref={meshRef} position={[0, -6, 0]}>
      <bufferGeometry />
      <shaderMaterial
        ref={shaderRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uTime: { value: 0 },
          uDispersion: { value: 1.0 },
          uPixelRatio: { value: 1 }
        }}
      />
    </points>
  );
};

export default ChristmasTextParticles;