import React from 'react';
import { useStore, THEMES } from '../store';

const UIOverlay: React.FC = () => {
  const store = useStore();

  return (
    <div className="absolute top-0 left-0 p-4 sm:p-6 z-10 w-full sm:w-80 pointer-events-none">
      <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl pointer-events-auto text-white transition-all duration-500">
        
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-widest text-green-500 font-sans">MERRY & BRIGHT</h1>
            <p className="text-[10px] text-white/50 uppercase tracking-widest mt-1">Interactive Galaxy</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        </div>

        {/* Controls */}
        <div className="space-y-6">
          
          {/* THEME SELECTOR */}
          <div>
            <label className="block text-[10px] uppercase text-white/40 mb-2 font-bold tracking-wide">Palette</label>
            <div className="flex space-x-2">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => store.setTheme(theme.id)}
                  className={`flex-1 h-8 rounded-md border transition-all duration-300 ${
                    store.currentTheme.id === theme.id 
                    ? 'border-white scale-105' 
                    : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: theme.colors.primary }}
                  title={theme.name}
                />
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-4 pt-2">
            
            {/* Halo Brightness */}
            <div>
               <div className="flex justify-between mb-1">
                <label className="text-[10px] uppercase text-white/40 tracking-wider">Halo Brightness</label>
                <span className="text-[10px] font-mono text-white/60">{store.haloBrightness.toFixed(1)}</span>
              </div>
              <input 
                type="range" min="0.5" max="3.0" step="0.1"
                value={store.haloBrightness} 
                onChange={(e) => store.setHaloBrightness(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>

            {/* Flow Speed */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-[10px] uppercase text-white/40 tracking-wider">Galaxy Flow Speed</label>
                <span className="text-[10px] font-mono text-white/60">{store.flowSpeed.toFixed(1)}</span>
              </div>
              <input 
                type="range" min="0.0" max="2.0" step="0.1" 
                value={store.flowSpeed} 
                onChange={(e) => store.setFlowSpeed(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>

            {/* Sensitivity / Lerp */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-[10px] uppercase text-white/40 tracking-wider">Hand Sensitivity</label>
                <span className="text-[10px] font-mono text-white/60">{store.lerpSpeed.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0.01" max="0.2" step="0.01" 
                value={store.lerpSpeed} 
                onChange={(e) => store.setLerpSpeed(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>
          </div>

          <div className="text-[10px] text-white/30 text-center leading-relaxed">
            <span className="font-bold text-green-400">GESTURES:</span><br/>
            FIST = Assemble Tree & Message<br/>
            OPEN HAND = Expand Galaxy
          </div>

        </div>
      </div>
    </div>
  );
};

export default UIOverlay;