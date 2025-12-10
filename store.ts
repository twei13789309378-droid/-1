import { create } from 'zustand';
import { GardenShape, Theme } from './types';

export const THEMES: Theme[] = [
  { 
    id: 'christmas_night', 
    name: 'Christmas Eve', 
    colors: { 
      primary: '#006400',    // Deep Green (Tree)
      secondary: '#FFD700',  // Gold (Halo)
      accent: '#ff0000',     // Red/Silver Mix (Ornaments)
      background: '#020510'  // Deep Midnight Blue
    } 
  },
  { 
    id: 'frozen_dream', 
    name: 'Frozen', 
    colors: { 
      primary: '#00ced1',    // Dark Turquoise
      secondary: '#e0ffff',  // Light Cyan
      accent: '#ffffff',     // White
      background: '#001020' 
    } 
  },
  { 
    id: 'neon_synth', 
    name: 'Cyberpunk', 
    colors: { 
      primary: '#ff00ff',    // Magenta
      secondary: '#00ffff',  // Cyan
      accent: '#ffff00',     // Yellow
      background: '#100010' 
    } 
  }
];

interface AppState {
  shape: GardenShape;
  setShape: (shape: GardenShape) => void;
  
  currentTheme: Theme;
  setTheme: (themeId: string) => void;

  particleCount: number;
  setParticleCount: (count: number) => void;
  
  pointSize: number;
  setPointSize: (val: number) => void;
  
  lerpSpeed: number;
  setLerpSpeed: (val: number) => void;

  bloomStrength: number;
  setBloomStrength: (val: number) => void;

  flowSpeed: number;
  setFlowSpeed: (val: number) => void;

  haloBrightness: number;
  setHaloBrightness: (val: number) => void;

  showWebcam: boolean;
  setShowWebcam: (show: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  shape: GardenShape.CHRISTMAS_TREE,
  setShape: (shape) => set({ shape }),
  
  currentTheme: THEMES[0],
  setTheme: (themeId) => {
    const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
    set({ currentTheme: theme });
  },

  // HIGH FIDELITY & PRECISION SETTINGS
  particleCount: 80000, // Massive count for density
  setParticleCount: (count) => set({ particleCount: count }),
  
  pointSize: 0.20, // Ultra-fine "diamond dust"
  setPointSize: (val) => set({ pointSize: val }),

  lerpSpeed: 0.05,
  setLerpSpeed: (val) => set({ lerpSpeed: val }),

  bloomStrength: 0.2, // Very subtle, elegant bloom
  setBloomStrength: (val) => set({ bloomStrength: val }),

  flowSpeed: 0.5,
  setFlowSpeed: (val) => set({ flowSpeed: val }),

  haloBrightness: 0.9, // Precise, not overwhelming brightness
  setHaloBrightness: (val) => set({ haloBrightness: val }),

  showWebcam: false,
  setShowWebcam: (show) => set({ showWebcam: show }),
}));