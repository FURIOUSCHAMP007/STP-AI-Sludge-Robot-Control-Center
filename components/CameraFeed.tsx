
import React, { useRef, useEffect, useState } from 'react';
import { AIAnalysis } from '../types';

interface CameraFeedProps {
  onCapture: (base64: string) => void;
  isSimulated: boolean;
  isLowPower: boolean;
  aiResult?: AIAnalysis;
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

export const CameraFeed: React.FC<CameraFeedProps> = ({ onCapture, isSimulated, isLowPower, aiResult }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const simVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [cameraActive, setCameraActive] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<SimulatedScenario>(SCENARIOS[1]);
  const [forceLive, setForceLive] = useState(false);

  useEffect(() => {
    async function initDevices() {
      try {
        // Request initial permission to get labels
        await navigator.mediaDevices.getUserMedia({ video: true });
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0) setSelectedDevice(videoDevices[0].deviceId);
      } catch (err) {
        console.warn("Could not list devices or permission denied", err);
        // Still try to enumerate even if getUserMedia fails
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
        setDevices(videoDevices);
      }
    }
    initDevices();
  }, []);

  useEffect(() => {
    if (!selectedDevice) {
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
  }, [selectedDevice]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setIsAnalyzing(false);
  }, [aiResult]);

  const [flash, setFlash] = useState(false);

  const captureFrame = async () => {
    if (canvasRef.current && !isAnalyzing) {
      setFlash(true);
      setTimeout(() => setFlash(false), 100);
      setIsAnalyzing(true);
      const context = canvasRef.current.getContext('2d');
      if (!context) {
        setIsAnalyzing(false);
        return;
      }

      if (cameraActive && videoRef.current && (!isSimulated || forceLive)) {
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
  }, [cameraActive, isSimulated, currentScenario, isLowPower, forceLive]);

  return (
    <div className="bg-black rounded-xl overflow-hidden relative border border-gray-700 shadow-2xl group">
      {/* Real Video Feed */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className={`w-full aspect-video object-cover ${(cameraActive && (!isSimulated || forceLive)) ? 'block' : 'hidden'}`}
      />

      {/* Simulated Feed / Video Loops */}
      {(!cameraActive || (isSimulated && !forceLive)) && (
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
          <div className="z-10 text-center">
            <div className="inline-block animate-pulse mb-2 px-3 py-1 bg-emerald-600/20 border border-emerald-500 rounded text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
              {isSimulated ? 'AI Simulation Stream' : 'Camera Feed Inactive'}
            </div>
            <p className="text-gray-400 text-[10px] font-mono opacity-50 mb-4">NODE ID: SLUDGE BOT SIM 001</p>
            
            {(!cameraActive || (isSimulated && !forceLive)) && (
              <button 
                onClick={() => {
                  if (!cameraActive) setSelectedDevice(devices[0]?.deviceId || '');
                  setForceLive(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
              >
                Start Laptop Camera
              </button>
            )}
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

      {/* AI Intelligence Overlay */}
      {aiResult && (
        <div className="absolute inset-0 pointer-events-none z-30">
          {/* Bounding Box Simulation */}
          <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-2 border-emerald-500/50 rounded-lg">
            <div className="absolute -top-6 left-0 bg-emerald-500 text-black text-[10px] font-black px-2 py-0.5 uppercase">
              {aiResult.sludgeLevel} DENSITY SLUDGE Detected
            </div>
            <div className="absolute -bottom-6 right-0 text-emerald-500 text-[8px] font-mono">
              CONFIDENCE: {aiResult.confidence}%
            </div>
          </div>

          {/* HUD Elements */}
          <div className="absolute top-16 left-4 space-y-1">
             <div className="flex items-center space-x-2 bg-black/40 px-2 py-0.5 rounded border border-emerald-500/20">
                <span className="text-[9px] text-emerald-500 font-bold uppercase">AI_STATE:</span>
                <span className="text-[9px] text-white font-mono">{aiResult.recommendation.slice(0, 30)}...</span>
             </div>
             <div className="flex items-center space-x-2 bg-black/40 px-2 py-0.5 rounded border border-blue-500/20">
                <span className="text-[9px] text-blue-400 font-bold uppercase">TARGET:</span>
                <span className="text-[9px] text-white font-mono">{aiResult.targetZone}</span>
             </div>
          </div>

          <div className="absolute bottom-16 left-4">
             <div className="bg-black/60 border border-emerald-500/30 p-2 rounded backdrop-blur-sm">
                <div className="text-[8px] text-emerald-500 font-bold uppercase mb-1">Vision Analysis</div>
                <div className="flex flex-wrap gap-1">
                   {aiResult.vision?.objects.map((obj, i) => (
                      <span key={i} className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1 rounded border border-emerald-500/30">
                         {obj.toUpperCase()}
                      </span>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} width={640} height={480} className="hidden" />
      
      <div className="absolute top-4 left-4 bg-gray-900/80 px-3 py-1.5 rounded-md text-xs font-mono border border-gray-700 backdrop-blur-sm flex items-center space-x-2 z-20">
        <span className={`w-2 h-2 rounded-full ${cameraActive && !isSimulated ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
        <span>{cameraActive && !isSimulated ? 'LIVE CAM FEED' : 'VIRTUAL SENSOR STREAM'}</span>
      </div>

      <div className="absolute bottom-4 right-4 flex space-x-2 z-20">
        {devices.length > 0 && (
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
          disabled={isAnalyzing}
          className={`bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center space-x-2 ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isAnalyzing ? (
            <>
              <div className="w-2 h-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>ANALYZING...</span>
            </>
          ) : (
            <span>ANALYSIS SYNC</span>
          )}
        </button>
      </div>
      
      <div className="absolute inset-0 pointer-events-none border border-emerald-500/10 group-hover:border-emerald-500/20 transition-all"></div>
      
      {/* Flash Effect */}
      {flash && <div className="absolute inset-0 bg-white z-50 pointer-events-none"></div>}
    </div>
  );
};
