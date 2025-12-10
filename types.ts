export enum GardenShape {
  CHRISTMAS_TREE = 'Christmas Tree',
  GALAXY = 'Galaxy Spiral',
}

export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;   // Tree Body (Green)
    secondary: string; // Halo/Lights (Gold)
    accent: string;    // Ornaments/Stars (Red/Silver)
    background: string;
  };
}

// Shared mutable state
export interface SimulationState {
  dispersion: number; // 0 to 1
  targetDispersion: number;
  primaryColor: string;
}