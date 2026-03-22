
import React, { useRef, useEffect, useState } from 'react';

interface CameraFeedProps {
  onCapture: (base64: string) => void;
  isSimulated: boolean;
  isLowPower: boolean;
}

interface SimulatedScenario {
  id: string;
  label: string;
  url: string;
}

const SCENARIOS: SimulatedScenario[] = [
  { 
    id: 'low', 
    label: 'Low Sludge (Clear Flow)', 
    url: 'https://assets.mixkit.co/videos/preview/mixkit-water-flowing-in-a-treatment-plant-39844-large.mp4' 
  },
  { 
    id: 'medium', 
    label: 'Medium Sludge (Active Mixing)', 
    url: 'https://assets.mixkit.co/videos/preview/mixkit-sewage-water-flowing-in-a-treatment-plant-39845-large.mp4' 
  },
  { 
    id: 'heavy', 
    label: 'Heavy Sludge (Industrial)', 
    url: 'https://assets.mixkit.co/videos/preview/mixkit-thick-muddy-water-flowing-down-a-river-42866-large.mp4' 
  }
];

export const CameraFeed: React.FC<CameraFeedProps> = ({ onCapture, isSimulated, isLowPower }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const simVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [cameraActive, setCameraActive] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<SimulatedScenario>(SCENARIOS[1]);

  useEffect(() => {
    async function getDevices() {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0) setSelectedDevice(videoDevices[0].deviceId);
      } catch (err) {
        console.warn("Could not list devices", err);
      }
    }
    getDevices();
  }, []);

  useEffect(() => {
    if (!selectedDevice || isSimulated) {
      setCameraActive(false);
      return;
    }
    
    let stream: MediaStream | null = null;
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: selectedDevice, width: 640, height: 480 }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setCameraActive(false);
      }
    }
    startCamera();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, [selectedDevice, isSimulated]);

  const captureFrame = () => {
    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (!context) return;

      if (cameraActive && videoRef.current && !isSimulated) {
        context.drawImage(videoRef.current, 0, 0, 640, 480);
      } else if (simVideoRef.current) {
        context.drawImage(simVideoRef.current, 0, 0, 640, 480);
        // Overlay HUD text for AI context
        context.fillStyle = 'rgba(16, 185, 129, 0.2)';
        context.fillRect(0, 0, 640, 40);
        context.font = 'bold 14px monospace';
        context.fillStyle = '#10b981';
        context.fillText(`SIM SOURCE: ${currentScenario.label.toUpperCase()}`, 15, 25);
        context.font = '10px monospace';
        context.fillText(`ISO: 800 | FPS: 30.0 | TEMP: 24°C`, 450, 25);
      }

      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
      onCapture(dataUrl.split(',')[1]);
    }
  };

  useEffect(() => {
    // Reduced frequency to 30s (or 60s in low power) to avoid 429 Quota Exceeded errors on free tier
    const intervalTime = isLowPower ? 60000 : 30000;
    const interval = setInterval(captureFrame, intervalTime);
    return () => clearInterval(interval);
  }, [cameraActive, isSimulated, currentScenario, isLowPower]);

  return (
    <div className="bg-black rounded-xl overflow-hidden relative border border-gray-700 shadow-2xl group">
      {/* Real Video Feed */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className={`w-full aspect-video object-cover ${(cameraActive && !isSimulated) ? 'block' : 'hidden'}`}
      />

      {/* Simulated Feed / Video Loops */}
      {(!cameraActive || isSimulated) && (
        <div className="relative w-full aspect-video bg-gray-900 flex items-center justify-center overflow-hidden">
           <video 
            ref={simVideoRef}
            src={currentScenario.url} 
            autoPlay 
            muted 
            loop 
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-70 grayscale contrast-125"
          />
          
          {/* Simulation Overlay */}
          <div className="z-10 pointer-events-none text-center">
            <div className="inline-block animate-pulse mb-2 px-3 py-1 bg-emerald-600/20 border border-emerald-500 rounded text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
              AI Simulation Stream
            </div>
            <p className="text-gray-400 text-[10px] font-mono opacity-50">NODE ID: SLUDGE BOT SIM 001</p>
          </div>

          {/* Source Switcher for Demo */}
          <div className="absolute top-14 right-4 flex flex-col space-y-1 z-20">
            {SCENARIOS.map(s => (
              <button 
                key={s.id}
                onClick={() => setCurrentScenario(s)}
                className={`px-2 py-1 text-[9px] font-bold rounded border transition-all ${
                  currentScenario.id === s.id 
                  ? 'bg-emerald-600 border-emerald-400 text-white' 
                  : 'bg-gray-800/80 border-gray-700 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {s.id.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Scanline and Vignette Effect */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_3px,3px_100%]"></div>
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]"></div>
        </div>
      )}

      <canvas ref={canvasRef} width={640} height={480} className="hidden" />
      
      <div className="absolute top-4 left-4 bg-gray-900/80 px-3 py-1.5 rounded-md text-xs font-mono border border-gray-700 backdrop-blur-sm flex items-center space-x-2 z-20">
        <span className={`w-2 h-2 rounded-full ${cameraActive && !isSimulated ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
        <span>{cameraActive && !isSimulated ? 'LIVE CAM FEED' : 'VIRTUAL SENSOR STREAM'}</span>
      </div>

      <div className="absolute bottom-4 right-4 flex space-x-2 z-20">
        {!isSimulated && devices.length > 0 && (
          <select 
            className="bg-gray-900/80 border border-gray-700 text-xs px-2 py-1 rounded outline-none text-gray-300"
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
          >
            {devices.map(d => (
              <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0,4)}`}</option>
            ))}
          </select>
        )}
        <button 
          onClick={captureFrame}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-xs font-bold transition-colors shadow-lg active:scale-95"
        >
          ANALYSIS SYNC
        </button>
      </div>
      
      <div className="absolute inset-0 pointer-events-none border border-emerald-500/10 group-hover:border-emerald-500/20 transition-all"></div>
    </div>
  );
};
