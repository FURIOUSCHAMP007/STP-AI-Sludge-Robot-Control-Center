
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
import { LiveAssistant } from './components/LiveAssistant';
import { analyzeRobotState } from './services/geminiService';
import { bluetoothService } from './services/bluetoothService';
import { io, Socket } from "socket.io-client";
import { 
  SensorData, RobotStatus, AIAnalysis, 
  SludgeLevel, SludgeHardness, RiskLevel, DEFAULTSAFETYCONFIG 
} from './types';

type TabType = 'tactical' | 'intelligence' | 'ai_deep_dive' | 'simulations' | 'presentation';

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
    isAutonomous: false
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
    anomalyDetected: false
  });
  const [logs, setLogs] = useState<{msg: string, type: 'info'|'warn'|'err'}[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to the Socket.IO server
    const socket = io();
    socketRef.current = socket;

    socket.on("connect", () => {
      addLog("Connected to Command Center Server", 'info');
    });

    socket.on("sensor_update", (data: any) => {
      // Handle telemetry from the bot
      if (data) {
        setSensors(prev => {
          const last = prev[prev.length - 1] || { 
            h2s: 0, methane: 0, motorCurrent: 0, tilt: {x:0,y:0,z:0}, timestamp: 0, battery: 100, isOffline: false,
            ultrasonicReading: 100, tankDepth: 100, vibrationFrequency: 0, torqueFeedback: 0,
            position: { x: 0, y: 0 }, batteryVoltage: 24, temperature: 30
          };
          
          // Map new sensor data to existing structure
          const newData = { 
            ...last, 
            ultrasonicReading: data.distance || last.ultrasonicReading,
            h2s: data.gas === 'DANGER' ? 15 : 2, // Map gas status to a value
            timestamp: Date.now() 
          };
          
          checkSafetyViolations(newData);
          return [...prev.slice(-59), newData];
        });

        if (data.front_blocked || data.side_blocked) {
          addLog(`ROBOT ALERT: ${data.front_blocked ? 'Front' : 'Side'} Blocked!`, 'warn');
        }
      }
    });

    socket.on("disconnect", () => {
      addLog("Disconnected from Command Center Server", 'warn');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

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
          
          if (bluetoothService.isConnected()) {
            const hwCmd = {
              movement: aiUpdate.direction?.toUpperCase(),
              vibration_level: aiUpdate.cleaning ? 'HIGH' : 'LOW',
              suction: aiUpdate.pumpActive ? 'ON' : 'OFF',
              mode: 'AUTO'
            };
            bluetoothService.sendCommand(JSON.stringify(hwCmd));
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
      
      // Send command via Socket.IO
      if (socketRef.current) {
        if (cmd.direction) {
          socketRef.current.emit("bot_move", { direction: cmd.direction });
        }
        if (cmd.bucketPosition !== undefined) {
          socketRef.current.emit("bot_bucket", { action: cmd.bucketPosition > 0 ? 'scoop' : 'dump' });
        }
      }

      // Send command via Bluetooth if connected
      if (bluetoothService.isConnected()) {
        const hwCmd: any = {};
        if (cmd.direction) hwCmd.movement = cmd.direction.toUpperCase();
        if (cmd.cleaning !== undefined) hwCmd.vibration_level = cmd.cleaning ? 'HIGH' : 'LOW';
        if (cmd.pumpActive !== undefined) hwCmd.suction = cmd.pumpActive ? 'ON' : 'OFF';
        if (cmd.bucketPosition !== undefined) hwCmd.bucket = cmd.bucketPosition;
        if (cmd.isAutonomous !== undefined) hwCmd.mode = cmd.isAutonomous ? 'AUTO' : 'MANUAL';
        
        if (Object.keys(hwCmd).length > 0) {
          bluetoothService.sendCommand(JSON.stringify(hwCmd));
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
        if (bluetoothService.isConnected()) {
          bluetoothService.sendCommand(JSON.stringify({ eStopActive: true, direction: 'stop', cleaning: false, pumpActive: false }));
        }
        return stopStatus;
      } else {
        addLog("System reset. Safety check required.", 'info');
        if (bluetoothService.isConnected()) {
          bluetoothService.sendCommand(JSON.stringify({ eStopActive: false }));
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
    <div className="flex flex-col h-screen overflow-hidden bg-gray-950 font-sans selection:bg-emerald-500/30">
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
      <div className="bg-gray-900 border-b border-gray-800 px-4 flex items-center justify-between">
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
      
      <main className="flex-1 flex overflow-hidden p-4 gap-4">
        {activeTab === 'tactical' ? (
          <>
            <div className="flex-[2] flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
              {isDemoMode && <DemoPanel currentSensors={latestSensor} onUpdate={updateDemoSensors} />}
              
              <CameraFeed onCapture={handleCapture} isSimulated={isDemoMode} isLowPower={isLowPower} />
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

            <div className="flex-1 flex flex-col gap-4 max-w-sm overflow-y-auto pr-2 custom-scrollbar">
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
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex-1 flex flex-col shadow-inner overflow-hidden">
                <h3 className="text-[10px] font-bold uppercase text-gray-600 mb-3 tracking-widest flex justify-between">
                  <span>Mission Telemetry</span>
                  <button onClick={() => setLogs([])} className="hover:text-gray-400">CLEAR</button>
                </h3>
                <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1.5 pr-2 custom-scrollbar">
                  {logs.length === 0 && <div className="text-gray-800 italic mt-4 text-center">Awaiting log initiation...</div>}
                  {logs.map((log, i) => (
                    <div key={i} className={`p-1.5 rounded border-l-2 ${
                      log.type === 'err' ? 'bg-red-900/10 border-red-500 text-red-300' :
                      log.type === 'warn' ? 'bg-amber-900/10 border-amber-500 text-amber-300' :
                      'bg-gray-800/30 border-gray-700 text-gray-500'
                    }`}>
                      {log.msg}
                    </div>
                  ))}
                </div>
              </div>
              <TankMap 
                currentPos={latestSensor.position} 
                path={aiResult.optimizedPath} 
                coverage={aiResult.coveragePercentage} 
              />
            </div>
          </>
        ) : activeTab === 'intelligence' ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4">
            <AnalyticsDashboard sensors={sensors} />
          </div>
        ) : activeTab === 'ai_deep_dive' ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4">
            <AIFeaturesDashboard />
          </div>
        ) : activeTab === 'simulations' ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4">
            <SimulationCases />
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
