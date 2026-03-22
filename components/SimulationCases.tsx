
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  Zap, 
  Wind, 
  Thermometer, 
  ArrowRight, 
  Play, 
  RotateCcw,
  ShieldCheck,
  Activity,
  Droplets
} from 'lucide-react';

interface SimulationState {
  id: string;
  title: string;
  description: string;
  sensors: {
    motorCurrent: number;
    h2s: number;
    vibration: number;
    temperature: number;
    batteryVoltage: number;
  };
  aiRecommendation: string;
  outcome: string;
  status: 'idle' | 'running' | 'completed';
}

const CASES: SimulationState[] = [
  {
    id: 'heavy-sludge',
    title: 'Case 1: Heavy Sludge Breakup',
    description: 'Robot encounters a dense, hardened sludge layer that resists standard suction.',
    sensors: {
      motorCurrent: 2.4,
      h2s: 5,
      vibration: 55,
      temperature: 42,
      batteryVoltage: 23.8
    },
    aiRecommendation: 'HARD SLUDGE DETECTED. Activating Adaptive Vibration (45Hz) to liquefy sediment.',
    outcome: 'Sludge layer successfully broken. Suction efficiency increased by 80%.',
    status: 'idle'
  },
  {
    id: 'gas-emergency',
    title: 'Case 2: Gas Risk Emergency',
    description: 'Sudden release of trapped Hydrogen Sulfide (H2S) during deep cleaning.',
    sensors: {
      motorCurrent: 1.2,
      h2s: 18.5,
      vibration: 10,
      temperature: 32,
      batteryVoltage: 24.1
    },
    aiRecommendation: 'CRITICAL GAS LEVELS. Safety Override: Immediate retreat to Zone 0. Extraction active.',
    outcome: 'Robot safely evacuated. Gas extraction system triggered. No human exposure risk.',
    status: 'idle'
  },
  {
    id: 'sinking-risk',
    title: 'Case 3: Sinking Risk Detection',
    description: 'Robot enters a zone with extremely soft, low-density sludge causing loss of buoyancy.',
    sensors: {
      motorCurrent: 0.6,
      h2s: 2,
      vibration: 5,
      temperature: 30,
      batteryVoltage: 24.2
    },
    aiRecommendation: 'SINKING RISK DETECTED. Reducing vibration amplitude. Moving to coordinates (4,4) for stability.',
    outcome: 'Robot regained buoyancy. Path recalculated to avoid soft-sediment pockets.',
    status: 'idle'
  },
  {
    id: 'predictive-failure',
    title: 'Case 4: Predictive Maintenance Alert',
    description: 'AI detects abnormal thermal rise in motor bearings despite constant load.',
    sensors: {
      motorCurrent: 1.1,
      h2s: 4,
      vibration: 22,
      temperature: 68,
      batteryVoltage: 21.5
    },
    aiRecommendation: 'MAINTENANCE ALERT: Bearing thermal anomaly. Predicted failure in 48 hours. Schedule service.',
    outcome: 'Preventative maintenance performed. Motor saved from total burnout. Downtime avoided.',
    status: 'idle'
  }
];

export const SimulationCases: React.FC = () => {
  const [activeCase, setActiveCase] = useState<SimulationState | null>(null);
  const [progress, setProgress] = useState(0);

  const runSimulation = (simCase: SimulationState) => {
    setActiveCase({ ...simCase, status: 'running' });
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setActiveCase({ ...simCase, status: 'completed' });
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  const reset = () => {
    setActiveCase(null);
    setProgress(0);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-12 animate-in fade-in duration-700">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 px-4 py-1 rounded-full">
          <Activity size={14} className="text-amber-400" />
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">Simulation Environment v2.1</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">
          Operational <span className="text-amber-500">Case Simulations</span>
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
          Explore how the AquaVortex AI handles complex, high-risk scenarios in real-time. These simulations demonstrate the fusion of sensor data and AI decision-making.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {CASES.map((c) => (
          <button
            key={c.id}
            onClick={() => runSimulation(c)}
            disabled={activeCase?.status === 'running'}
            className={`p-6 rounded-2xl border text-left transition-all ${
              activeCase?.id === c.id 
                ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/5' 
                : 'bg-gray-900 border-gray-800 hover:border-gray-700'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
              activeCase?.id === c.id ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400'
            }`}>
              {c.id === 'heavy-sludge' && <Droplets size={20} />}
              {c.id === 'gas-emergency' && <Wind size={20} />}
              {c.id === 'sinking-risk' && <ShieldCheck size={20} />}
              {c.id === 'predictive-failure' && <Thermometer size={20} />}
            </div>
            <h3 className={`text-sm font-black uppercase tracking-tight mb-2 ${activeCase?.id === c.id ? 'text-white' : 'text-gray-200'}`}>
              {c.title}
            </h3>
            <p className={`text-[10px] leading-tight line-clamp-2 ${activeCase?.id === c.id ? 'text-gray-300' : 'text-gray-400'}`}>
              {c.description}
            </p>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeCase ? (
          <motion.div
            key={activeCase.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3">
              {/* Left: Simulation Visualizer */}
              <div className="lg:col-span-2 p-8 bg-black/40 relative min-h-[400px] flex flex-col">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${activeCase.status === 'running' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                    <span className="text-xs font-mono text-gray-200 uppercase tracking-widest font-bold">
                      {activeCase.status === 'running' ? 'SIMULATION IN PROGRESS' : 'SIMULATION COMPLETE'}
                    </span>
                  </div>
                  <button onClick={reset} className="text-gray-400 hover:text-white transition-colors">
                    <RotateCcw size={16} />
                  </button>
                </div>

                {/* Visual Representation */}
                <div className="flex-1 flex items-center justify-center relative">
                  {/* Robot Mockup */}
                  <motion.div 
                    animate={activeCase.status === 'running' ? { 
                      x: [0, 5, -5, 0],
                      y: [0, -2, 2, 0],
                      rotate: activeCase.id === 'heavy-sludge' ? [0, 1, -1, 0] : 0
                    } : {}}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="w-48 h-32 bg-gray-800 border-2 border-gray-700 rounded-2xl relative flex items-center justify-center shadow-2xl shadow-emerald-500/10"
                  >
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-gray-700 rounded-full border-2 border-gray-600 flex items-center justify-center">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                    </div>
                    <Zap className={activeCase.status === 'running' ? 'text-amber-500 animate-pulse' : 'text-gray-600'} size={48} />
                    
                    {/* Effects based on case */}
                    {activeCase.status === 'running' && activeCase.id === 'gas-emergency' && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 2 }}
                        className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full"
                      />
                    )}
                    {activeCase.status === 'running' && activeCase.id === 'heavy-sludge' && (
                      <div className="absolute -bottom-8 w-full flex justify-center space-x-2">
                        {[...Array(3)].map((_, i) => (
                          <motion.div 
                            key={i}
                            animate={{ y: [0, 10], opacity: [1, 0] }}
                            transition={{ repeat: Infinity, delay: i * 0.2 }}
                            className="w-1 h-4 bg-blue-500/40 rounded-full"
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>

                  {/* Sensor Overlay */}
                  <div className="absolute top-0 right-0 space-y-2">
                    <SensorMetric label="Motor Load" value={activeCase.sensors.motorCurrent} unit="A" color="blue" />
                    <SensorMetric label="H2S Level" value={activeCase.sensors.h2s} unit="ppm" color="red" />
                    <SensorMetric label="Vibration" value={activeCase.sensors.vibration} unit="Hz" color="amber" />
                    <SensorMetric label="Temp" value={activeCase.sensors.temperature} unit="°C" color="orange" />
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-8">
                  <div className="flex justify-between text-[10px] font-bold text-gray-600 uppercase mb-2">
                    <span>Processing Telemetry</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-amber-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Right: AI Explanation */}
              <div className="p-8 border-l border-gray-800 space-y-8">
                <div>
                  <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">AI Decision Logic</h4>
                  <h3 className="text-2xl font-black text-white leading-tight">{activeCase.title}</h3>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-800/80 border border-gray-700 p-5 rounded-xl shadow-inner">
                    <div className="flex items-center space-x-2 mb-3">
                      <AlertTriangle size={14} className="text-amber-400" />
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-wider">AI Recommendation</span>
                    </div>
                    <p className="text-sm text-white font-medium leading-relaxed">
                      "{activeCase.aiRecommendation}"
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Case Outcome</h5>
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-500/30">
                        <ArrowRight size={12} className="text-emerald-400" />
                      </div>
                      <p className="text-sm text-gray-200 leading-relaxed font-medium">
                        {activeCase.outcome}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-800">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[8px] text-gray-600 uppercase font-bold">Safety Level</span>
                        <div className="flex space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full ${i < 4 ? 'bg-emerald-500' : 'bg-gray-800'}`}></div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] text-gray-600 uppercase font-bold">AI Confidence</span>
                        <div className="flex space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full ${i < 5 ? 'bg-blue-500' : 'bg-gray-800'}`}></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="bg-gray-900/50 border-2 border-dashed border-gray-800 rounded-3xl p-20 text-center space-y-6">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
              <Play size={24} className="text-gray-600 ml-1" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-400">Select a Case to Begin</h3>
              <p className="text-gray-600 text-sm max-w-xs mx-auto">
                Choose one of the operational scenarios above to see the AI's real-time response and decision logic.
              </p>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SensorMetric: React.FC<{ label: string; value: number; unit: string; color: string }> = ({ label, value, unit, color }) => (
  <div className="bg-gray-900/90 border border-gray-700 p-2.5 rounded-lg min-w-[110px] backdrop-blur-md shadow-lg">
    <span className="text-[9px] text-gray-300 uppercase font-black block mb-1 tracking-wider">{label}</span>
    <div className="flex items-baseline space-x-1">
      <span className={`text-base font-mono font-black text-${color}-400`}>{value}</span>
      <span className="text-[9px] text-gray-400 font-mono font-bold">{unit}</span>
    </div>
  </div>
);
