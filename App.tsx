import React, { useRef } from 'react';
import Experience from './components/Experience';
import UIOverlay from './components/UIOverlay';
import HandTracker from './components/HandTracker';

// Global shared mutable ref for high-frequency updates without React re-renders
// 0 = Closed (Night), 1 = Open (Day)

const App: React.FC = () => {
  const handOpennessRef = useRef<number>(0); 

  return (
    <div className="w-full h-full relative bg-black font-sans select-none">
      
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Experience handOpennessRef={handOpennessRef} />
      </div>

      {/* UI Controls */}
      <UIOverlay />

      {/* Logic Layer */}
      <HandTracker handOpennessRef={handOpennessRef} />
      
      {/* Instructions Overlay for first load (simple fade out could be added, but keeping it clean) */}
      <div className="absolute bottom-6 left-0 w-full text-center pointer-events-none z-10">
         <p className="text-white/40 text-xs tracking-widest uppercase animate-pulse">
           Webcam required for interaction
         </p>
      </div>

    </div>
  );
};

export default App;