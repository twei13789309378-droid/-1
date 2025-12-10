import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { generateDualBuffer } from '../services/geometryService';

const vertexShader = `
  uniform float uTime;
  uniform float uDispersion; // 0.0 (Tree) -> 1.0 (Galaxy)
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uFlowSpeed;
  
  // Theme Colors
  uniform vec3 uColorTree;    // Group 0
  uniform vec3 uColorHalo;    // Group 1
  uniform vec3 uColorGalaxy;  // Group 2

  attribute vec3 aTargetPos; // The Christmas Tree
  attribute vec3 aRandomPos; // The Galaxy
  attribute float aColorGroup; // 0, 1, 2
  attribute float aIsOrnament; // 0 or 1
  attribute float aRandom;

  varying float vAlpha;
  varying vec3 vColor;
  varying float vGroup;
  varying float vIsOrnament;

  // --- SIMPLEX NOISE FUNCTION (Ashima Arts) ---
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy; 
    vec3 x3 = x0 - D.yyy;      
    i = mod289(i);
    vec4 p = permute( permute( permute( 
              i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857; 
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                  dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    vGroup = aColorGroup;
    vIsOrnament = aIsOrnament;

    // --- COLOR ASSIGNMENT ---
    if (aColorGroup < 0.5) {
        // Tree: Green with subtle variation
        vColor = mix(uColorTree, uColorTree * 0.6, aRandom); 
    } else if (aColorGroup < 1.5) {
        // Halo: Pure Gold
        vColor = uColorHalo;
    } else {
        // Background/Galaxy: 
        vColor = mix(uColorGalaxy, vec3(1.0), aRandom * 0.4) * 2.5; 
    }

    // --- POSITION CALCULATION ---
    
    // 1. Calculate Flowing Galaxy Position
    float flowTime = uTime * uFlowSpeed;
    vec3 flowOffset = vec3(
        snoise(vec3(aRandomPos.x * 0.05, aRandomPos.y * 0.05, flowTime)),
        snoise(vec3(aRandomPos.x * 0.05, aRandomPos.y * 0.05, flowTime + 10.0)),
        snoise(vec3(aRandomPos.x * 0.05, aRandomPos.y * 0.05, flowTime + 20.0))
    );
    // Galaxy drifts
    vec3 galaxyPos = aRandomPos + (flowOffset * 3.0 * uDispersion);

    // 2. Mix based on dispersion
    vec3 finalPos = mix(aTargetPos, galaxyPos, uDispersion);

    // --- ALIVENESS / PRECISION ---
    if (uDispersion < 0.2) {
        // Very stable tree - minute breathing for life without wobble
        float breath = sin(uTime * 1.5 + finalPos.y * 0.5) * 0.002 * (1.0 - uDispersion);
        finalPos.x += finalPos.x * breath;
        finalPos.z += finalPos.z * breath;
    }

    // --- SIZE CALCULATION ---
    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float distSize = (100.0 / -mvPosition.z);
    
    // Base scale
    float sizeMult = 1.0;
    float twinkle = 1.0;

    // Ornaments (Lights) are much bigger
    if (aIsOrnament > 0.5) {
        sizeMult = 4.0;
        twinkle = 0.8 + sin(uTime * 2.0 + aRandom * 50.0) * 0.2;
    } else if (aColorGroup > 0.5 && aColorGroup < 1.5) {
        // Halo particles slightly larger than tree dust
        sizeMult = 1.2;
        twinkle = 0.9 + sin(uTime * 4.0 + aRandom * 100.0) * 0.1;
    } else if (aColorGroup > 1.5) {
        // Galaxy / Background Stars
        sizeMult = 1.1; 
        // Subtle, slow breathing starlight (sine wave shifted by random)
        twinkle = 0.5 + 0.5 * sin(uTime * 1.5 + aRandom * 123.45);
    }
    
    gl_PointSize = uSize * sizeMult * twinkle * distSize * uPixelRatio;
    
    vAlpha = 1.0;
  }
`;

const fragmentShader = `
  uniform float uHaloBrightness;
  varying float vAlpha;
  varying vec3 vColor;
  varying float vGroup;
  varying float vIsOrnament;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    
    // Base shape - Sharper cutoff for diamond dust look
    float circle = 1.0 - smoothstep(0.4, 0.5, dist);
    
    if (circle < 0.1) discard;

    vec3 finalColor = vColor;

    // --- ORNAMENT GLOW ---
    if (vIsOrnament > 0.5) {
        // Make ornaments very bright to trigger bloom
        finalColor = mix(finalColor, vec3(1.0, 0.2, 0.2), 0.5); // Add reddish tint
        finalColor *= 8.0; // Intense emission
        
        // Softer edge for lights
        circle = 1.0 - smoothstep(0.3, 0.5, dist);
    } 
    // --- HALO GLOW ---
    else if (vGroup > 0.5 && vGroup < 1.5) {
        finalColor *= uHaloBrightness; 
        // Tiny bright core
        float core = 1.0 - smoothstep(0.0, 0.15, dist);
        finalColor += vec3(0.4) * core;
    }
    // --- GALAXY GLOW ---
    else if (vGroup > 1.5) {
        // Boost brightness for starry look
        finalColor *= 1.5;
    }

    gl_FragColor = vec4(finalColor, circle * vAlpha);
  }
`;

interface ParticlesProps {
  handOpennessRef: React.MutableRefObject<number>;
}

const MonetParticles: React.FC<ParticlesProps> = ({ handOpennessRef }) => {
  const meshRef = useRef<THREE.Points>(null);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  
  const { shape, particleCount, currentTheme, pointSize, lerpSpeed, flowSpeed, haloBrightness } = useStore();

  const { targetPositions, randomPositions, colorGroups, isOrnaments, randoms } = useMemo(() => {
    return generateDualBuffer(shape, particleCount);
  }, [shape, particleCount]);

  useEffect(() => {
    if (meshRef.current) {
        meshRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(targetPositions, 3)); 
        meshRef.current.geometry.setAttribute('aTargetPos', new THREE.BufferAttribute(targetPositions, 3));
        meshRef.current.geometry.setAttribute('aRandomPos', new THREE.BufferAttribute(randomPositions, 3));
        meshRef.current.geometry.setAttribute('aColorGroup', new THREE.BufferAttribute(colorGroups, 1));
        meshRef.current.geometry.setAttribute('aIsOrnament', new THREE.BufferAttribute(isOrnaments, 1));
        meshRef.current.geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));
    }
  }, [targetPositions, randomPositions, colorGroups, isOrnaments, randoms]);

  useFrame((state) => {
    if (shaderRef.current && meshRef.current) {
      const current = shaderRef.current.uniforms.uDispersion.value;
      const target = handOpennessRef.current;
      shaderRef.current.uniforms.uDispersion.value += (target - current) * lerpSpeed;
      
      shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      shaderRef.current.uniforms.uPixelRatio.value = state.viewport.dpr;
      shaderRef.current.uniforms.uSize.value = pointSize;
      shaderRef.current.uniforms.uFlowSpeed.value = flowSpeed;
      shaderRef.current.uniforms.uHaloBrightness.value = haloBrightness;
      
      shaderRef.current.uniforms.uColorTree.value = new THREE.Color(currentTheme.colors.primary);
      shaderRef.current.uniforms.uColorHalo.value = new THREE.Color(currentTheme.colors.secondary);
      shaderRef.current.uniforms.uColorGalaxy.value = new THREE.Color(currentTheme.colors.accent);
    }
  });

  return (
    <points ref={meshRef}>
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
          uPixelRatio: { value: 1 },
          uSize: { value: pointSize },
          uFlowSpeed: { value: flowSpeed },
          uHaloBrightness: { value: haloBrightness },
          uColorTree: { value: new THREE.Color(currentTheme.colors.primary) },
          uColorHalo: { value: new THREE.Color(currentTheme.colors.secondary) },
          uColorGalaxy: { value: new THREE.Color(currentTheme.colors.accent) }
        }}
      />
    </points>
  );
};

export default MonetParticles;