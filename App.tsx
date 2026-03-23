
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardHeader } from './components/DashboardHeader';
import { CameraFeed } from './components/CameraFeed';
import { SensorGrid } from './components/SensorGrid';
import { RobotControls } from './components/RobotControls';
import { DemoPanel } from './components/DemoPanel';
import { SafetyStatus } from './components/SafetyStatus';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { PresentationView } from './components/PresentationView';
import { AIFeaturesDashboard } from './components/AIFeaturesDashboard';
import { SimulationCases } from './components/SimulationCases';
import { TankMap } from './components/TankMap';
import { TankMap3D } from './components/TankMap3D';
import { LiveAssistant } from './components/LiveAssistant';
import { Navigation } from 'lucide-react';
import { analyzeRobotState } from './services/geminiService';
import { 
  SensorData, RobotStatus, AIAnalysis, 
  SludgeLevel, SludgeHardness, RiskLevel, DEFAULTSAFETYCONFIG 
} from './types';

type TabType = 'tactical' | 'intelligence' | 'ai_deep_dive' | 'simulations' | 'presentation' | 'spatial';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('tactical');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showLiveAssistant, setShowLiveAssistant] = useState(false);
  const [isLowPower, setIsLowPower] = useState(false);
  const [isAiThrottled, setIsAiThrottled] = useState(false);
  const [sensors, setSensors] = useState<SensorData[]>([]);
  const [robotStatus, setRobotStatus] = useState<RobotStatus>({
    connected: true,
    cleaning: false,
    brushSpeed: 30,
    pumpActive: false,
    direction: 'stop',
    eStopActive: false,
    vibrationFrequency: 10,
    vibrationAmplitude: 20,
    bucketPosition: 0,
    isAutonomous: false,
    cameraPan: 90,
    cameraTilt: 90,
    motorSpeed: 50
  });
  const [aiResult, setAiResult] = useState<AIAnalysis>({
    sludgeLevel: SludgeLevel.LOW,
    sludgeHardness: SludgeHardness.SOFT,
    gasRisk: RiskLevel.LOW,
    isStuck: false,
    recommendation: "System initializing. Monitoring environment.",
    targetZone: "N/A",
    predictedSludgeThickness: 0,
    sludgeVolumeEstimate: 0,
    highDensityZones: [],
    targetVibrationFrequency: 10,
    targetVibrationAmplitude: 20,
    optimizedPath: [],
    coveragePercentage: 0,
    estimatedTimeRemaining: 0,
    maintenanceScore: 100,
    predictedFailureDays: 30,
    anomalyDetected: false,
    confidence: 100
  });
  const [logs, setLogs] = useState<{msg: string, type: 'info'|'warn'|'err'}[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to the standard WebSocket server
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      addLog("Connected to Hardware Relay Server", 'info');
      setRobotStatus(prev => ({ ...prev, connected: true }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Handle camera frames from the Android phone
        if (data.type === 'camera_frame' && data.image) {
          handleCapture(data.image);
        }

        // Handle telemetry from the bot
        if (data.type === 'telemetry' || data.device === 'sensors') {
          const sensorData = data.sensors || data;
          const latestData: SensorData = {
            h2s: sensorData.h2s || 0,
            methane: sensorData.methane || 0,
            motorCurrent: sensorData.motorCurrent || 0,
            tilt: sensorData.tilt || { x: 0, y: 0, z: 0 },
            timestamp: Date.now(),
            battery: sensorData.battery || 100,
            batteryVoltage: sensorData.batteryVoltage || 24,
            temperature: sensorData.temperature || 30,
            isOffline: false,
            ultrasonicReading: sensorData.distance_cm || sensorData.ultrasonicReading || 100,
            tankDepth: 100,
            vibrationFrequency: sensorData.vibrationFrequency || 0,
            torqueFeedback: sensorData.torqueFeedback || 0,
            position: sensorData.position || { x: 0, y: 0 },
            distance_cm: sensorData.distance_cm,
            ir_left: sensorData.ir_left,
            ir_right: sensorData.ir_right,
            gas_raw: sensorData.gas_raw
          };

          setSensors(prev => [...prev.slice(-59), latestData]);
          
          if (robotStatus.isAutonomous && !robotStatus.eStopActive) {
            triggerAutoAI(latestData);
          }
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    };

    ws.onclose = () => {
      addLog("Disconnected from Hardware Relay Server", 'warn');
      setRobotStatus(prev => ({ ...prev, connected: false }));
      // Reconnect logic
      setTimeout(() => {
        addLog("Attempting to reconnect...", 'info');
        // This will trigger the effect again if we used a state for URL, 
        // but here we just wait for manual refresh or implement a better retry
      }, 5000);
    };

    return () => {
      ws.close();
    };
  }, []);

  const lastAiTriggerTime = useRef<number>(0);
  const triggerAutoAI = useCallback(async (currentData: SensorData) => {
    const now = Date.now();
    // Throttle AI calls to once every 10 seconds in auto mode
    if (now - lastAiTriggerTime.current < 10000) return;
    
    lastAiTriggerTime.current = now;
    addLog("AUTO-AI: Initiating Dual-Layer Analysis (Vision + Decision)...", 'info');
    
    try {
      // Capture frame from video feed if available
      let frameData: string | null = null;
      const video = document.querySelector('video');
      if (video) {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frameData = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
        }
      }

      const result = await analyzeRobotState(frameData, [currentData]);
      setAiResult(result);
      
      if (!robotStatus.eStopActive && !isOverriddenBySafety.current) {
        const aiUpdate: Partial<RobotStatus> = {
          vibrationFrequency: result.targetVibrationFrequency,
          vibrationAmplitude: result.targetVibrationAmplitude,
          direction: result.command?.action as any || (result.isStuck ? 'backward' : (result.sludgeLevel === SludgeLevel.HIGH ? 'forward' : 'stop')),
          cleaning: result.sludgeHardness === SludgeHardness.HARD || result.sludgeLevel === SludgeLevel.HIGH,
          pumpActive: result.sludgeLevel === SludgeLevel.HIGH
        };
        
        setRobotStatus(prev => ({ ...prev, ...aiUpdate }));
        
        // RELAY TO ROBOT
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          if (result.command) {
            wsRef.current.send(JSON.stringify(result.command));
          } else {
            wsRef.current.send(JSON.stringify({ 
              device: "motors", 
              action: aiUpdate.direction,
              speed: result.command?.speed || 0.6
            }));
          }
        }
        
        addLog(`AUTO-AI DECISION [${result.priority?.toUpperCase()}]: ${result.recommendation}`, 'info');
        if (result.vision) {
          addLog(`VISION: Detected ${result.vision.objects.join(', ')}. Risk: ${result.vision.risk_level}`, 'info');
        }
      }
    } catch (err) {
      console.error("Auto AI failed:", err);
    }
  }, [robotStatus.eStopActive, robotStatus.isAutonomous]);

  const safetyConfig = DEFAULTSAFETYCONFIG;
  const isOverriddenBySafety = useRef(false);

  // Safety logic check
  const latestSensor = sensors[sensors.length - 1] || { 
    h2s: 0, methane: 0, motorCurrent: 0, tilt: {x:0,y:0,z:0}, timestamp: 0, battery: 100, isOffline: false,
    ultrasonicReading: 100, tankDepth: 100, vibrationFrequency: 0, torqueFeedback: 0,
    position: { x: 0, y: 0 }, batteryVoltage: 24, temperature: 30
  };

  const checkSafetyViolations = useCallback((data: SensorData) => {
    if (robotStatus.eStopActive) return true;
    
    const h2sViolated = !data.isOffline && data.h2s > safetyConfig.h2sLimit;
    const ch4Violated = !data.isOffline && data.methane > safetyConfig.methaneLimit;
    const currentViolated = data.motorCurrent > safetyConfig.maxCurrent;
    const tiltViolated = Math.abs(data.tilt.x) > safetyConfig.tiltLimit;
    const batteryViolated = data.battery < safetyConfig.batteryCritical;

    if (h2sViolated || ch4Violated || currentViolated || tiltViolated || batteryViolated) {
      if (!isOverriddenBySafety.current) {
        let reason = "Threshold Exceeded";
        if (batteryViolated) reason = "CRITICAL BATTERY";
        addLog(`SAFETY OVERRIDE: ${reason}. Forcing Recovery Mode.`, 'err');
        setRobotStatus(prev => ({ 
          ...prev, 
          direction: 'backward', 
          cleaning: false, 
          pumpActive: false 
        }));
        isOverriddenBySafety.current = true;
      }
      return true;
    }

    if (isOverriddenBySafety.current) {
      addLog("SAFETY STATUS: Levels normalized. AI control restored.", 'info');
      isOverriddenBySafety.current = false;
    }
    return false;
  }, [safetyConfig, robotStatus.eStopActive]);

  // Simulate or maintain sensor data stream
  useEffect(() => {
    const intervalTime = isLowPower ? 3000 : 1000;
    const interval = setInterval(() => {
      setSensors(prev => {
        const last = prev[prev.length - 1] || { 
          h2s: 5, methane: 10, motorCurrent: 0.8, 
          tilt: {x: 0, y: 0, z: 9.8}, timestamp: Date.now(),
          battery: 85, isOffline: false,
          ultrasonicReading: 80, tankDepth: 100,
          vibrationFrequency: 12, torqueFeedback: 4,
          position: { x: 5, y: 5 },
          batteryVoltage: 24.2, temperature: 32
        };
        
        let newData: SensorData;

        if (isDemoMode) {
          const batteryDrain = robotStatus.cleaning ? 0.05 : 0.01;
          // Sinking risk simulation: if vibration is too high for soft sludge
          const sinkingRisk = (robotStatus.vibrationAmplitude > 60 && last.ultrasonicReading < 40) ? 0.5 : 0;
          
          // Movement simulation
          let newX = last.position.x;
          let newY = last.position.y;
          if (robotStatus.direction !== 'stop') {
            const speed = 0.1;
            if (robotStatus.direction === 'forward') newY = Math.min(10, last.position.y + speed);
            if (robotStatus.direction === 'backward') newY = Math.max(0, last.position.y - speed);
            if (robotStatus.direction === 'left') newX = Math.max(0, last.position.x - speed);
            if (robotStatus.direction === 'right') newX = Math.min(10, last.position.x + speed);
          }

          newData = {
            ...last,
            h2s: last.isOffline ? 0 : Math.max(0, last.h2s + (Math.random() - 0.5) * 0.1),
            methane: last.isOffline ? 0 : Math.max(0, last.methane + (Math.random() - 0.5) * 0.5),
            battery: Math.max(0, last.battery - batteryDrain),
            batteryVoltage: Math.max(18, 24 * (last.battery / 100) + (Math.random() - 0.5) * 0.1),
            temperature: Math.min(85, 30 + (robotStatus.cleaning ? 15 : 0) + (Math.random() - 0.5) * 2),
            ultrasonicReading: Math.max(20, Math.min(100, last.ultrasonicReading + (Math.random() - 0.5) * 2 + sinkingRisk)),
            vibrationFrequency: Math.max(5, Math.min(60, last.vibrationFrequency + (Math.random() - 0.5) * 2)),
            torqueFeedback: Math.max(2, Math.min(25, last.torqueFeedback + (Math.random() - 0.5) * 1)),
            position: { x: newX, y: newY },
            timestamp: Date.now()
          };
        } else {
          // Real-world simulation: vibration responds to robot status
          const targetFreq = robotStatus.cleaning ? robotStatus.vibrationFrequency : 5;
          const targetAmp = robotStatus.cleaning ? robotStatus.vibrationAmplitude : 0;
          
          // Movement simulation towards target if cleaning
          let newX = last.position.x;
          let newY = last.position.y;
          if (robotStatus.direction !== 'stop') {
            const speed = 0.05;
            if (robotStatus.direction === 'forward') newY = Math.min(10, last.position.y + speed);
            if (robotStatus.direction === 'backward') newY = Math.max(0, last.position.y - speed);
            if (robotStatus.direction === 'left') newX = Math.max(0, last.position.x - speed);
            if (robotStatus.direction === 'right') newX = Math.min(10, last.position.x + speed);
          } else if (robotStatus.cleaning && aiResult.optimizedPath.length > 0) {
            // Auto-move towards first waypoint
            const target = aiResult.optimizedPath[0];
            const dx = target.x - last.position.x;
            const dy = target.y - last.position.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > 0.1) {
              newX += (dx / dist) * 0.05;
              newY += (dy / dist) * 0.05;
            }
          }

          newData = {
            h2s: Math.max(0, last.h2s + (Math.random() - 0.5) * 0.5),
            methane: Math.max(0, last.methane + (Math.random() - 0.5) * 2),
            motorCurrent: robotStatus.cleaning ? 1.2 + (Math.random() - 0.5) * 0.4 : 0.8 + (Math.random() - 0.5) * 0.1,
            tilt: {
              x: last.tilt.x + (Math.random() - 0.5) * 0.1,
              y: last.tilt.y + (Math.random() - 0.5) * 0.1,
              z: 9.8 + (Math.random() - 0.5) * 0.2
            },
            battery: Math.max(0, last.battery - (robotStatus.cleaning ? 0.02 : 0.005)),
            batteryVoltage: Math.max(18, 24 * (last.battery / 100) + (Math.random() - 0.5) * 0.05),
            temperature: Math.min(85, 32 + (robotStatus.cleaning ? 10 : 0) + (Math.random() - 0.5) * 1),
            ultrasonicReading: Math.max(20, Math.min(100, last.ultrasonicReading + (Math.random() - 0.5) * 5)),
            tankDepth: 100,
            vibrationFrequency: last.vibrationFrequency + (targetFreq - last.vibrationFrequency) * 0.2 + (Math.random() - 0.5),
            torqueFeedback: robotStatus.cleaning ? 12 + (Math.random() - 0.5) * 5 : 4 + (Math.random() - 0.5) * 1,
            position: { x: newX, y: newY },
            timestamp: Date.now(),
            isOffline: false
          };
        }

        checkSafetyViolations(newData);
        return [...prev.slice(-59), newData];
      });
    }, intervalTime);
    return () => clearInterval(interval);
  }, [isDemoMode, robotStatus.cleaning, checkSafetyViolations, isLowPower]);

  const handleCapture = async (base64: string) => {
    if (robotStatus.eStopActive) return;
    try {
      const result = await analyzeRobotState(base64, sensors);
      
      // Detect if the result is from the fallback engine
      const isFallback = result.recommendation.startsWith("[LOCAL_ENGINE]");
      if (isFallback && !isAiThrottled) {
        setIsAiThrottled(true);
        addLog("AI QUOTA REACHED: System switched to Local Heuristic Fallback.", 'warn');
      } else if (!isFallback && isAiThrottled) {
        setIsAiThrottled(false);
      }

      if (isOverriddenBySafety.current) {
        setAiResult({
          ...result,
          recommendation: "⚠️ EMERGENCY PROTOCOL: " + result.recommendation
        });
      } else {
        setAiResult(result);
        // Adaptive Control: Apply AI recommendations to robot status if in Autonomous mode
        if (robotStatus.isAutonomous && !robotStatus.eStopActive) {
          const aiUpdate: Partial<RobotStatus> = {
            vibrationFrequency: result.targetVibrationFrequency,
            vibrationAmplitude: result.targetVibrationAmplitude,
            direction: result.isStuck ? 'backward' : 'forward',
            cleaning: result.sludgeHardness === SludgeHardness.HARD,
            pumpActive: result.sludgeLevel === SludgeLevel.HIGH
          };
          
          setRobotStatus(prev => ({ ...prev, ...aiUpdate }));
          
          // RELAY TO ROBOT VIA WEBSOCKET
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            if (result.command) {
              wsRef.current.send(JSON.stringify(result.command));
            } else {
              wsRef.current.send(JSON.stringify({ 
                device: "motors", 
                action: aiUpdate.direction,
                speed: result.command?.speed || 0.6
              }));
            }
          }
        }
      }
      
      if (result.isStuck) {
        setLogs(prev => [{ msg: "ALERT: AI detected possible collision or stall!", type: 'warn' }, ...prev]);
      }
    } catch (err) {
      console.error("AI Analysis failed:", err);
      addLog("AI SYSTEM ERROR: Fallback triggered.", 'err');
    }
  };

  const addLog = (msg: string, type: 'info'|'warn'|'err' = 'info') => {
    setLogs(prev => [{ msg: `[${new Date().toLocaleTimeString()}] ${msg}`, type }, ...prev.slice(0, 49)]);
  };

  const handleCommand = (cmd: Partial<RobotStatus>) => {
    if (robotStatus.eStopActive) return;
    if (isOverriddenBySafety.current && (cmd.direction === 'forward' || cmd.direction === 'left' || cmd.direction === 'right')) {
      addLog("COMMAND BLOCKED: Safety protocol active. Only RETREAT allowed.", 'err');
      return;
    }
    setRobotStatus(prev => {
      const newStatus = { ...prev, ...cmd };
      
      // Send command via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        if (cmd.direction) {
          wsRef.current.send(JSON.stringify({ 
            device: "motors", 
            action: cmd.direction,
            speed: newStatus.motorSpeed / 100
          }));
        }
        if (cmd.motorSpeed !== undefined) {
          wsRef.current.send(JSON.stringify({ 
            device: "motors", 
            action: "set_speed",
            speed: newStatus.motorSpeed / 100
          }));
        }
        if (cmd.cameraPan !== undefined || cmd.cameraTilt !== undefined) {
          wsRef.current.send(JSON.stringify({
            device: "camera",
            pan: cmd.cameraPan ?? prev.cameraPan,
            tilt: cmd.cameraTilt ?? prev.cameraTilt
          }));
        }
        if (cmd.isAutonomous !== undefined) {
          wsRef.current.send(JSON.stringify({
            type: 'mode_change',
            mode: cmd.isAutonomous ? 'AUTO' : 'MANUAL'
          }));
          addLog(`SYSTEM: Switched to ${cmd.isAutonomous ? 'AUTONOMOUS' : 'MANUAL'} mode`, 'info');
        }
        if (cmd.cleaning !== undefined) {
          wsRef.current.send(JSON.stringify({
            device: "vibration",
            action: cmd.cleaning ? "on" : "off",
            frequency: newStatus.vibrationFrequency,
            amplitude: newStatus.vibrationAmplitude
          }));
        }
        if (cmd.pumpActive !== undefined) {
          wsRef.current.send(JSON.stringify({
            device: "suction",
            action: cmd.pumpActive ? "on" : "off"
          }));
        }
      }

      return newStatus;
    });
    if (cmd.direction) addLog(`Manual control: ${cmd.direction.toUpperCase()}`);
    if (cmd.cleaning !== undefined) addLog(`Manual toggle: Brush ${cmd.cleaning ? 'ON' : 'OFF'}`);
  };

  const toggleEStop = () => {
    setRobotStatus(prev => {
      const active = !prev.eStopActive;
      if (active) {
        addLog("!!! EMERGENCY STOP ACTIVATED !!!", 'err');
        const stopStatus = { ...prev, eStopActive: true, direction: 'stop' as const, cleaning: false, pumpActive: false };
        
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'emergency_stop',
            active: true,
            timestamp: new Date().toISOString()
          }));
        }
        
        return stopStatus;
      } else {
        addLog("System reset. Safety check required.", 'info');
        
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'emergency_stop',
            active: false,
            timestamp: new Date().toISOString()
          }));
        }
        
        return { ...prev, eStopActive: false };
      }
    });
  };

  const updateDemoSensors = (data: Partial<SensorData>) => {
    setSensors(prev => {
      const last = prev[prev.length - 1];
      const updated = { ...last, ...data, timestamp: Date.now() };
      return [...prev.slice(0, -1), updated];
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 font-sans selection:bg-emerald-500/30">
      <DashboardHeader 
        isConnected={robotStatus.connected} 
        isDemoMode={isDemoMode}
        isLowPower={isLowPower}
        eStopActive={robotStatus.eStopActive}
        onToggleDemo={() => setIsDemoMode(!isDemoMode)}
        onToggleLowPower={() => setIsLowPower(!isLowPower)}
        onEStop={toggleEStop}
      />

      {/* Tab Navigation */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex">
          <button 
            onClick={() => setActiveTab('tactical')}
            className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
              activeTab === 'tactical' 
                ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Tactical Hub
          </button>
          <button 
            onClick={() => setActiveTab('intelligence')}
            className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
              activeTab === 'intelligence' 
                ? 'border-blue-500 text-blue-500 bg-blue-500/5' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Mission Intelligence
          </button>
          <button 
            onClick={() => setActiveTab('ai_deep_dive')}
            className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
              activeTab === 'ai_deep_dive' 
                ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            AI Deep Dive
          </button>
          <button 
            onClick={() => setActiveTab('spatial')}
            className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
              activeTab === 'spatial' 
                ? 'border-purple-500 text-purple-500 bg-purple-500/5' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Spatial Map
          </button>
          <button 
            onClick={() => setActiveTab('simulations')}
            className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
              activeTab === 'simulations' 
                ? 'border-amber-500 text-amber-500 bg-amber-500/5' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Simulations
          </button>
          <button 
            onClick={() => setActiveTab('presentation')}
            className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
              activeTab === 'presentation' 
                ? 'border-amber-500 text-amber-500 bg-amber-500/5' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Technical Spec
          </button>
        </div>

        {isAiThrottled && activeTab !== 'presentation' && (
          <div className="flex items-center space-x-2 bg-amber-950/40 border border-amber-500/30 px-3 py-1 rounded text-[10px] text-amber-500 font-bold uppercase tracking-widest animate-pulse">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span>AI Quota Throttled - Local Heuristics Active</span>
          </div>
        )}
      </div>
      
      <main className="flex-1 flex flex-col lg:flex-row p-4 gap-4">
        {activeTab === 'tactical' ? (
          <>
            <div className="flex-[2] flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
              {isDemoMode && <DemoPanel currentSensors={latestSensor} onUpdate={updateDemoSensors} />}
              
              <CameraFeed 
                onCapture={handleCapture} 
                isSimulated={isDemoMode} 
                isLowPower={isLowPower} 
                aiResult={aiResult}
              />
              <div className="relative">
                <SensorGrid data={latestSensor} gasRisk={aiResult.gasRisk} sludgeHardness={aiResult.sludgeHardness} />
              </div>
              
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex-1 shadow-inner relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/30"></div>
                <h3 className="text-sm font-bold uppercase text-gray-500 mb-4 flex justify-between items-center">
                  <span>AI Intelligent Analysis</span>
                  <span className="text-[10px] font-mono text-emerald-700">
                    {isAiThrottled ? 'FALLBACK: LOCAL_HEURISTICS' : 'MODEL: GEMINI_3_FLASH'}
                  </span>
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${aiResult.isStuck || isOverriddenBySafety.current ? 'bg-red-900/40' : 'bg-emerald-900/40'}`}>
                      {aiResult.isStuck || isOverriddenBySafety.current ? (
                        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      ) : (
                        <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-200 flex items-center">
                        Control Recommendation
                        {isOverriddenBySafety.current && <span className="ml-2 text-[10px] bg-red-600 px-1 rounded text-white animate-pulse">OVERRIDDEN</span>}
                      </h4>
                      <p className="text-gray-400 text-sm leading-relaxed mt-1 italic">
                        "{aiResult.recommendation}"
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/50">
                      <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Visual Density</span>
                      <span className={`text-lg font-bold ${
                        aiResult.sludgeLevel === SludgeLevel.HIGH ? 'text-red-400' :
                        aiResult.sludgeLevel === SludgeLevel.MEDIUM ? 'text-amber-400' :
                        'text-emerald-400'
                      }`}>{aiResult.sludgeLevel}</span>
                    </div>
                    <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/50">
                      <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Sludge Hardness</span>
                      <span className={`text-lg font-bold ${
                        aiResult.sludgeHardness === SludgeHardness.HARD ? 'text-red-400' :
                        aiResult.sludgeHardness === SludgeHardness.MEDIUM ? 'text-amber-400' :
                        'text-emerald-400'
                      }`}>{aiResult.sludgeHardness}</span>
                    </div>
                    <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/50">
                      <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Optimum Target</span>
                      <span className="text-lg font-bold text-blue-400 uppercase tracking-tighter">{aiResult.targetZone || 'SCANNING...'}</span>
                    </div>
                    <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/50">
                      <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Est. Volume</span>
                      <span className="text-lg font-bold text-amber-500">{aiResult.sludgeVolumeEstimate.toFixed(1)} m³</span>
                    </div>
                    <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/50">
                      <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Path Coverage</span>
                      <span className="text-lg font-bold text-emerald-500">{aiResult.coveragePercentage.toFixed(0)}%</span>
                    </div>
                    <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/50">
                      <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Est. Time</span>
                      <span className="text-lg font-bold text-blue-400">{aiResult.estimatedTimeRemaining}m</span>
                    </div>
                    <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/50">
                      <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">System Health</span>
                      <span className={`text-lg font-bold ${aiResult.maintenanceScore < 70 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {aiResult.maintenanceScore}%
                      </span>
                    </div>
                    <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/50">
                      <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Next Service</span>
                      <span className="text-lg font-bold text-purple-400">{aiResult.predictedFailureDays}d</span>
                    </div>
                    <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/50">
                      <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">AI Confidence</span>
                      <span className={`text-lg font-bold ${aiResult.confidence > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {aiResult.confidence}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-blue-900/10 border border-blue-500/20 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Adaptive Vibration Control</span>
                      <span className="text-[10px] font-mono text-blue-500 animate-pulse">RL_TUNING_ACTIVE</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[8px] text-gray-600 uppercase mb-1">Target Frequency</div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-500" 
                              style={{ width: `${(aiResult.targetVibrationFrequency / 60) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-mono text-blue-300">{aiResult.targetVibrationFrequency.toFixed(0)}Hz</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[8px] text-gray-600 uppercase mb-1">Target Amplitude</div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 transition-all duration-500" 
                              style={{ width: `${aiResult.targetVibrationAmplitude}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-mono text-indigo-300">{aiResult.targetVibrationAmplitude.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-4 max-w-md overflow-y-auto pr-2 custom-scrollbar">
              <div className="flex-shrink-0">
                <SafetyStatus 
                  data={latestSensor} 
                  config={safetyConfig} 
                  isOverridden={isOverriddenBySafety.current}
                  eStopActive={robotStatus.eStopActive}
                />
              </div>
              
              <div className={`flex-shrink-0 ${robotStatus.eStopActive ? 'opacity-40 grayscale pointer-events-none' : ''} transition-all`}>
                <RobotControls status={robotStatus} onCommand={handleCommand} />
              </div>

              <div className="flex-shrink-0">
                <TankMap3D 
                  sensors={sensors}
                  aiResult={aiResult}
                  robotPosition={latestSensor.position}
                />
              </div>

              {/* MISSION TELEMETRY - TERMINAL STYLE */}
              <div className="flex-shrink-0 min-h-[400px] flex flex-col bg-gray-950 border border-emerald-500/20 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="bg-gray-900/50 border-b border-emerald-500/10 px-4 py-2 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-emerald-500/70 uppercase tracking-[0.2em]">Mission_Telemetry_v4.2</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-[9px] font-mono text-gray-600">SYS_OK</span>
                    <button 
                      onClick={() => setLogs([])} 
                      className="text-[9px] font-mono text-gray-500 hover:text-emerald-400 transition-colors"
                    >
                      [FLUSH]
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.05)_0%,transparent_70%)]">
                  {logs.length === 0 ? (
                    <div className="h-full min-h-[300px] flex flex-col items-center justify-center opacity-20 grayscale">
                      <div className="w-12 h-12 border border-dashed border-emerald-500 rounded-full animate-spin-slow mb-4"></div>
                      <span className="text-[9px] font-mono uppercase tracking-widest">Awaiting_Uplink...</span>
                    </div>
                  ) : (
                    <div className="divide-y divide-emerald-500/5">
                      {logs.map((log, i) => (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          key={i} 
                          className={`group px-4 py-3 font-mono text-[11px] transition-colors hover:bg-emerald-500/[0.02] flex items-start space-x-3 ${
                            log.type === 'err' ? 'text-red-400 bg-red-500/[0.02]' :
                            log.type === 'warn' ? 'text-amber-400 bg-amber-500/[0.02]' :
                            'text-emerald-400/80'
                          }`}
                        >
                          <span className="opacity-30 shrink-0">[{log.msg.split(']')[0].replace('[', '')}]</span>
                          <span className="flex-1 leading-relaxed">
                            <span className="opacity-50 mr-2">{">>" }</span>
                            {log.msg.includes(']') ? log.msg.split(']')[1].trim() : log.msg}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'intelligence' ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4">
            <AnalyticsDashboard sensors={sensors} aiResult={aiResult} robotPosition={latestSensor.position} />
          </div>
        ) : activeTab === 'ai_deep_dive' ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4">
            <AIFeaturesDashboard />
          </div>
        ) : activeTab === 'simulations' ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4">
            <SimulationCases />
          </div>
        ) : activeTab === 'spatial' ? (
          <div className="flex-1 flex flex-col px-4 py-4">
            <div className="flex-1 bg-gray-900/50 border border-gray-800 rounded-3xl overflow-hidden relative">
              <div className="absolute inset-0">
                <TankMap3D 
                  sensors={sensors}
                  aiResult={aiResult}
                  robotPosition={latestSensor.position}
                />
              </div>
              <div className="absolute top-6 left-6 z-20 pointer-events-none">
                <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 rounded-full mb-4">
                  <Navigation size={14} className="text-purple-400" />
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Full-Scale Spatial Reconstruction</span>
                </div>
                <h2 className="text-4xl font-black text-white tracking-tight mb-2">3D Path Optimization Map</h2>
                <p className="text-gray-400 text-sm max-w-md">Real-time digital twin of the STP tank environment, visualizing AI-calculated cleaning vectors and sludge density zones.</p>
              </div>
              
              <div className="absolute bottom-6 left-6 z-20 grid grid-cols-2 gap-4">
                <div className="bg-gray-950/80 backdrop-blur border border-gray-800 p-4 rounded-2xl">
                  <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest block mb-2">Coverage Efficiency</span>
                  <div className="flex items-end space-x-2">
                    <span className="text-2xl font-mono font-bold text-white">{aiResult.coveragePercentage}%</span>
                    <span className="text-[10px] text-emerald-500 mb-1 font-bold">↑ 12%</span>
                  </div>
                </div>
                <div className="bg-gray-950/80 backdrop-blur border border-gray-800 p-4 rounded-2xl">
                  <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest block mb-2">Est. Time Remaining</span>
                  <div className="flex items-end space-x-2">
                    <span className="text-2xl font-mono font-bold text-white">{aiResult.estimatedTimeRemaining}m</span>
                    <span className="text-[10px] text-gray-500 mb-1 font-bold">MIN</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4">
            <PresentationView />
          </div>
        )}
      </main>

      <footer className="bg-gray-900 border-t border-gray-800 px-6 py-2 text-[10px] text-gray-600 flex justify-between items-center">
        <div className="flex space-x-6 items-center">
          <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>GPS: 12.971°N 77.594°E</span>
          <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-2"></span>LINK: 5.8GHz / AES-256</span>
          <span className="bg-gray-800 px-2 py-0.5 rounded text-gray-400">ESP32_STP_V3.1</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setShowLiveAssistant(!showLiveAssistant)}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-full border transition-all ${
              showLiveAssistant 
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' 
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${showLiveAssistant ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`}></span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Live AI Link</span>
          </button>

          <div className="flex space-x-1">
             {[...Array(5)].map((_, i) => <div key={i} className={`w-1 h-3 rounded-full ${i < 4 ? 'bg-emerald-800' : 'bg-gray-800'}`}></div>)}
          </div>
          <span className="uppercase font-bold tracking-[0.2em] text-gray-700">Project SludgeForce</span>
        </div>
      </footer>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}} />

      <AnimatePresence>
        {showLiveAssistant && (
          <LiveAssistant onClose={() => setShowLiveAssistant(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
