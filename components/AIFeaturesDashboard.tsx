
import React from 'react';
import { motion } from 'motion/react';
import { 
  Eye, 
  Layers, 
  Zap, 
  Navigation, 
  Activity,
  ChevronRight,
  Cpu,
  Database,
  ShieldAlert
} from 'lucide-react';

const FEATURES = [
  {
    id: 'vision',
    title: 'Visual Sludge Density Detection',
    icon: <Eye className="text-emerald-500" size={32} />,
    color: 'emerald',
    desc: 'Leverages Gemini 3 Flash multimodal vision to analyze real-time camera feeds from the STP tank.',
    details: [
      'Categorizes sludge into Low, Medium, or High density zones.',
      'Identifies visual obstructions and effluent flow patterns.',
      'Provides context for sensor data validation (Visual vs. Ultrasonic).',
      'Detects surface crusting and floating debris in real-time.'
    ],
    tech: 'Gemini 3 Flash Vision + OpenCV Pre-processing'
  },
  {
    id: 'hardness',
    title: 'Sensor-Fusion Hardness Classification',
    icon: <Layers className="text-blue-500" size={32} />,
    color: 'blue',
    desc: 'Combines multiple physical data points to determine the structural integrity of the sludge layer.',
    details: [
      'Fuses Motor Current (Amps), Vibration Frequency (Hz), and Torque Feedback (Nm).',
      'Classifies sludge as Soft, Medium, or Hard.',
      'Detects "Sinking Risk" when vibration is too high for soft sediment.',
      'Adjusts cleaning intensity based on physical resistance.'
    ],
    tech: 'Multi-Sensor Fusion + Heuristic Logic'
  },
  {
    id: 'vibration',
    title: 'Adaptive Vibration Control',
    icon: <Zap className="text-amber-500" size={32} />,
    color: 'amber',
    desc: 'A real-time tuning system for the Eccentric Rotating Mass (ERM) vibrating plate.',
    details: [
      'Dynamically adjusts frequency (10-60 Hz) based on sludge hardness.',
      'Modulates amplitude (0-100%) to prevent robot instability.',
      'Optimizes energy consumption by reducing power in soft zones.',
      'Prevents suction clogging by pre-loosening compact sediment.'
    ],
    tech: 'PID Control + AI-Driven Setpoints'
  },
  {
    id: 'path',
    title: 'Intelligent Path Optimization',
    icon: <Navigation className="text-purple-500" size={32} />,
    color: 'purple',
    desc: 'Calculates the most efficient cleaning route across the 10x10m tank grid.',
    details: [
      'Uses a Reinforcement Learning mindset to minimize redundant movement.',
      'Prioritizes high-density zones identified by visual and ultrasonic sensors.',
      'Calculates real-time coverage percentage and estimated time remaining.',
      'Optimizes battery drain by planning paths with minimal resistance.'
    ],
    tech: 'A* Search + RL-Inspired Heuristics'
  },
  {
    id: 'maintenance',
    title: 'Predictive Maintenance Model',
    icon: <Activity className="text-red-500" size={32} />,
    color: 'red',
    desc: 'Analyzes time-series data to predict mechanical and electrical failures before they occur.',
    details: [
      'Monitors thermal patterns (Temp) vs. electrical load (Current/Voltage).',
      'Detects early signs of motor bearing wear or pump degradation.',
      'Calculates a System Health Score (0-100) and Days Until Failure.',
      'Flags anomalies using LSTM-style pattern recognition on sensor history.'
    ],
    tech: 'Time-Series Anomaly Detection + Health Scoring'
  }
];

export const AIFeaturesDashboard: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-4 py-1 rounded-full">
          <Cpu size={14} className="text-blue-400" />
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Intelligence Layer v4.0 // RPi 02W Optimized</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">
          AI-Driven <span className="text-emerald-500">Autonomous Capabilities</span>
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
          The STP Sludge Robot is powered by a sophisticated multi-modal AI architecture that fuses visual intelligence with high-fidelity sensor telemetry, optimized for low-latency execution on Raspberry Pi Zero 2 W.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {FEATURES.map((feature, index) => (
          <motion.div 
            key={feature.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-900 border border-gray-800 rounded-3xl p-8 hover:border-gray-700 transition-all group relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 bg-${feature.color}-500/5 blur-[80px] group-hover:bg-${feature.color}-500/10 transition-all duration-700`}></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className={`p-4 bg-${feature.color}-500/10 rounded-2xl border border-${feature.color}-500/20 shadow-lg shadow-${feature.color}-500/5`}>
                  {feature.icon}
                </div>
                <span className="text-[10px] font-mono text-gray-600 font-bold uppercase tracking-widest">Feature 0{index + 1}</span>
              </div>

              <h3 className="text-xl font-black text-white mb-3 group-hover:text-emerald-400 transition-colors">{feature.title}</h3>
              <p className="text-gray-200 text-sm leading-relaxed mb-6">
                {feature.desc}
              </p>

              <div className="space-y-3 mb-8">
                {feature.details.map((detail, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <ChevronRight size={14} className={`text-${feature.color}-400 mt-1 flex-shrink-0`} />
                    <span className="text-xs text-gray-300 leading-tight font-medium">{detail}</span>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database size={12} className="text-gray-400" />
                  <span className="text-[10px] font-mono text-gray-400 uppercase font-bold tracking-wider">{feature.tech}</span>
                </div>
                <div className={`px-2 py-1 rounded bg-${feature.color}-500/10 border border-${feature.color}-500/20 text-[8px] font-black text-${feature.color}-500 uppercase tracking-widest`}>
                  Active
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* System Architecture Summary */}
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-3xl p-8 flex flex-col justify-center items-center text-center space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent"></div>
          </div>
          
          <div className="p-6 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <Cpu size={48} className="text-emerald-500 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white">Gemini 3 Flash Core</h3>
            <p className="text-gray-300 text-sm max-w-sm font-medium">
              The central nervous system of the robot, processing multi-modal inputs to make split-second decisions in high-risk zones.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-center">
              <span className="text-xl font-mono font-bold text-white">15Hz</span>
              <span className="text-[8px] text-gray-400 uppercase font-black tracking-widest">Inference Rate</span>
            </div>
            <div className="w-px h-8 bg-gray-800"></div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-mono font-bold text-white">99.9%</span>
              <span className="text-[8px] text-gray-400 uppercase font-black tracking-widest">Safety Uptime</span>
            </div>
            <div className="w-px h-8 bg-gray-800"></div>
            <div className={`flex flex-col items-center`}>
              <span className="text-xl font-mono font-bold text-emerald-400">LOW</span>
              <span className="text-[8px] text-gray-400 uppercase font-black tracking-widest">Latency</span>
            </div>
          </div>

          <div className="w-full pt-4">
            <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">
              <span>Neural Load</span>
              <span className="text-white">42%</span>
            </div>
            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
              <div className="w-[42%] h-full bg-emerald-500"></div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <ShieldAlert className="text-amber-400" size={20} />
          <span className="text-xs text-gray-300 font-bold">Safety-First Architecture: All AI decisions are validated by a hard-coded local heuristic layer.</span>
        </div>
        <div className="text-[10px] font-mono text-gray-400 uppercase font-black tracking-widest">
          Documentation v4.0.2 // AquaVortex AI
        </div>
      </footer>
    </div>
  );
};
