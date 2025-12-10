import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useStore } from '../store';

interface HandTrackerProps {
  handOpennessRef: React.MutableRefObject<number>;
}

const HandTracker: React.FC<HandTrackerProps> = ({ handOpennessRef }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { showWebcam } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        startWebcam();
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
      }
    };

    const startWebcam = async () => {
      if (!videoRef.current) return;
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480, facingMode: "user" } 
        });
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', predictWebcam);
        setLoading(false);
      } catch (err) {
        console.error("Webcam access denied", err);
        setLoading(false);
      }
    };

    const predictWebcam = () => {
      if (!videoRef.current || !handLandmarker) return;

      const startTimeMs = performance.now();
      if (videoRef.current.currentTime > 0) {
        const result = handLandmarker.detectForVideo(videoRef.current, startTimeMs);
        
        if (result.landmarks && result.landmarks.length > 0) {
          const landmarks = result.landmarks[0];
          
          // --- OPEN VS FIST DETECTION ---
          // Wrist is index 0.
          // Finger Tips are 4 (Thumb), 8 (Index), 12 (Middle), 16 (Ring), 20 (Pinky).
          // We calculate the average distance from Tips to Wrist.
          
          const wrist = landmarks[0];
          const tips = [4, 8, 12, 16, 20];
          let totalDist = 0;
          
          tips.forEach(idx => {
            const tip = landmarks[idx];
            const dist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
            totalDist += dist;
          });
          
          const avgTipDist = totalDist / 5;

          // Reference scale: Distance from Wrist(0) to IndexMCP(5) (Knuckle)
          // This allows detection to work regardless of how close/far the hand is from camera.
          const palmSize = Math.hypot(landmarks[5].x - wrist.x, landmarks[5].y - wrist.y);
          
          // Normalized Openness Ratio
          // Fist: Tips are very close to wrist. Ratio ~0.5 to 1.0 depending on palm size
          // Open: Tips are far. Ratio > 1.5 to 2.5
          
          const ratio = avgTipDist / palmSize;
          
          // Map Ratio to 0 (Heart/Fist) -> 1 (Scatter/Open)
          // Thresholds determined experimentally
          // Fist usually < 1.0. Open usually > 1.8.
          
          let dispersion = (ratio - 1.2) / (2.0 - 1.2);
          dispersion = Math.max(0, Math.min(1, dispersion));

          // Invert logic? 
          // Goal: Fist = Heart (0.0). Open = Scatter (1.0).
          // Currently: Small Ratio (Fist) -> Low Dispersion (0). Large Ratio (Open) -> High Dispersion (1).
          // Logic is correct.

          handOpennessRef.current = dispersion;

        } else {
           // No hand? Default to Heart (0) or Scatter (1)?
           // Let's default to Heart so it looks nice as a screensaver.
           handOpennessRef.current = 0.0;
        }
      }
      
      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    setupMediaPipe();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if(handLandmarker) handLandmarker.close();
      if (videoRef.current && videoRef.current.srcObject) {
         const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
         tracks.forEach(track => track.stop());
      }
    };
  }, [handOpennessRef]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-opacity duration-300 ${showWebcam ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
       <div className="relative rounded-lg overflow-hidden shadow-2xl border-2 border-white/20">
         {loading && <div className="absolute inset-0 bg-black flex items-center justify-center text-white text-xs">Loading Hand AI...</div>}
         <video 
            ref={videoRef} 
            className="w-48 h-36 object-cover transform -scale-x-100 bg-black" 
            autoPlay 
            playsInline
            muted
         />
         <div className="absolute bottom-1 left-1 bg-black/50 px-2 py-0.5 rounded text-[10px] text-white backdrop-blur-sm">
           Tracking Active
         </div>
       </div>
    </div>
  );
};

export default HandTracker;