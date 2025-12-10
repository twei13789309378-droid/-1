import * as THREE from 'three';
import { GardenShape } from '../types';

export const generateDualBuffer = (shape: GardenShape, count: number) => {
  const targetPositions = new Float32Array(count * 3); // The Tree / Shape
  const randomPositions = new Float32Array(count * 3); // The Galaxy / Explosion
  const colorGroups = new Float32Array(count); // 0: Tree, 1: Halo, 2: Galaxy/Stars
  const isOrnaments = new Float32Array(count); // 1.0 if it's a light/ornament, 0.0 otherwise
  const randoms = new Float32Array(count);

  // Distribution Ratios
  const treeEnd = Math.floor(count * 0.60);
  const haloEnd = Math.floor(count * 0.85);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    randoms[i] = Math.random();

    // --- ASSIGN GROUPS ---
    if (i < treeEnd) colorGroups[i] = 0.0;      // Tree Body
    else if (i < haloEnd) colorGroups[i] = 1.0; // Halo/Garland
    else colorGroups[i] = 2.0;                  // Background/Galaxy

    // --- ORNAMENTS (Lights) ---
    // About 6% of tree and halo particles become bright lights
    if (colorGroups[i] < 1.5 && Math.random() < 0.06) {
        isOrnaments[i] = 1.0;
    } else {
        isOrnaments[i] = 0.0;
    }

    // --- 1. TARGET POSITIONS (The Assembled State - Christmas Tree) ---
    
    // Config
    const treeHeight = 25;
    const treeBaseRadius = 10;
    
    if (colorGroups[i] === 0.0) {
      // -- TREE BODY (Volumetric Cone) --
      // y goes from -treeHeight/2 to treeHeight/2
      const yNorm = Math.random(); // 0 to 1 (0 is bottom, 1 is top tip)
      const y = (yNorm - 0.5) * treeHeight;
      
      // Radius decreases as we go up
      const maxR = treeBaseRadius * (1.0 - yNorm);
      
      // Volumetric sampling in a circle
      // If it's an ornament, push it slightly closer to the surface (outer 30%)
      const rScale = isOrnaments[i] > 0.5 
         ? 0.7 + (Math.random() * 0.3) 
         : Math.sqrt(Math.random());

      const r = maxR * rScale * 0.95; 
      const theta = Math.random() * Math.PI * 2;

      targetPositions[i3] = r * Math.cos(theta);
      targetPositions[i3 + 1] = y - 2; // Shift down slightly
      targetPositions[i3 + 2] = r * Math.sin(theta);

    } else if (colorGroups[i] === 1.0) {
      // -- HALO / GARLAND (Volumetric Spiral) --
      
      const t = (i - treeEnd) / (haloEnd - treeEnd); 
      const loops = 5.5; 
      
      // Base Spiral Position
      const angle = t * Math.PI * 2 * loops;
      const yNorm = t;
      const yBase = (yNorm - 0.5) * treeHeight;
      const mainRadius = (treeBaseRadius * (1.0 - yNorm)) + 0.8; 

      // Volumetric Scatter: Thinner band for precision
      const spread = 0.15; // Much thinner for a "ribbon" look
      
      const offsetX = (Math.random() - 0.5) * spread;
      const offsetY = (Math.random() - 0.5) * spread;
      const offsetZ = (Math.random() - 0.5) * spread;

      targetPositions[i3] = mainRadius * Math.cos(angle) + offsetX;
      targetPositions[i3 + 1] = yBase - 2 + offsetY;
      targetPositions[i3 + 2] = mainRadius * Math.sin(angle) + offsetZ;

    } else {
      // -- BACKGROUND / ORNAMENTS (Random Sphere around tree) --
      const r = 25 * Math.cbrt(Math.random()); // Slightly larger background field
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      targetPositions[i3] = r * Math.sin(phi) * Math.cos(theta);
      targetPositions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      targetPositions[i3 + 2] = r * Math.cos(phi);
    }

    // --- 2. RANDOM POSITIONS (The Dispersed State - Galaxy Flow) ---
    
    // Spiral Galaxy structure
    const armCount = 3;
    const armIndex = i % armCount;
    const galaxyRadius = 40 + Math.random() * 20;
    
    // Distance from center
    const dist = Math.random() * galaxyRadius;
    const spin = dist * 0.2; 
    
    const armAngle = (armIndex / armCount) * Math.PI * 2;
    const finalAngle = armAngle + spin;

    randomPositions[i3] = Math.cos(finalAngle) * dist;
    randomPositions[i3 + 1] = (Math.random() - 0.5) * (dist * 0.2); 
    randomPositions[i3 + 2] = Math.sin(finalAngle) * dist;
  }

  return { targetPositions, randomPositions, colorGroups, isOrnaments, randoms };
};