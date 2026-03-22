
import React from 'react';
import { SensorData } from '../types';

interface DemoPanelProps {
  currentSensors: SensorData;
  onUpdate: (data: Partial<SensorData>) => void;
}

export const DemoPanel: React.FC<DemoPanelProps> = ({ currentSensors, onUpdate }) => {
  return (
    <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 mb-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[10px] font-bold uppercase text-amber-500 tracking-widest flex items-center">
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2 animate-pulse"></span>
          Hackathon Simulation Controls
        </h3>
        <span className="text-[10px] font-mono text-amber-600">INJECT MODE v1.1</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-3">
          <label className="block">
            <div className="flex justify-between text-[10px] text-amber-600 uppercase mb-1">
              <span>H2S Level (ppm)</span>
              <span>{currentSensors.isOffline ? 'OFFLINE' : currentSensors.h2s.toFixed(1)}</span>
            </div>
            <input 
              type="range" min="0" max="30" step="0.1"
              disabled={currentSensors.isOffline}
              value={currentSensors.h2s}
              onChange={(e) => onUpdate({ h2s: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-30"
            />
          </label>
          <label className="block">
            <div className="flex justify-between text-[10px] text-amber-600 uppercase mb-1">
              <span>Battery (%)</span>
              <span>{currentSensors.battery.toFixed(0)}</span>
            </div>
            <input 
              type="range" min="0" max="100" step="1"
              value={currentSensors.battery}
              onChange={(e) => onUpdate({ battery: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </label>
        </div>

        <div className="space-y-3">
          <label className="block">
            <div className="flex justify-between text-[10px] text-amber-600 uppercase mb-1">
              <span>Motor Current (A)</span>
              <span>{currentSensors.motorCurrent.toFixed(2)}</span>
            </div>
            <input 
              type="range" min="0" max="3" step="0.01"
              value={currentSensors.motorCurrent}
              onChange={(e) => onUpdate({ motorCurrent: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </label>
          <div className="flex space-x-2">
            <button 
              onClick={() => onUpdate({ h2s: 18, methane: 120 })}
              className="flex-1 bg-red-900/40 border border-red-500/50 text-red-500 text-[9px] font-bold py-1.5 rounded uppercase hover:bg-red-900/60"
            >
              Gas Leak
            </button>
            <button 
              onClick={() => onUpdate({ motorCurrent: 2.8 })}
              className="flex-1 bg-amber-900/40 border border-amber-500/50 text-amber-500 text-[9px] font-bold py-1.5 rounded uppercase hover:bg-amber-900/60"
            >
              Trigger Jam
            </button>
          </div>
        </div>

        <div className="space-y-2 border-l border-amber-500/20 pl-4">
          <div className="text-[10px] text-amber-600 uppercase mb-2 font-bold">Failure Modes</div>
          <button 
            onClick={() => onUpdate({ isOffline: !currentSensors.isOffline })}
            className={`w-full text-[9px] font-bold py-1.5 rounded uppercase border transition-colors ${
              currentSensors.isOffline ? 'bg-red-600 border-red-400 text-white' : 'bg-gray-800 border-gray-600 text-gray-400'
            }`}
          >
            {currentSensors.isOffline ? 'SENSOR OFFLINE FAIL' : 'Toggle Sensor Health'}
          </button>
          <button 
            onClick={() => onUpdate({ battery: 8 })}
            className="w-full bg-gray-800 border border-gray-600 text-gray-400 text-[9px] font-bold py-1.5 rounded uppercase hover:bg-gray-700"
          >
            Force Low Battery
          </button>
          <button 
            onClick={() => onUpdate({ motorCurrent: 2.9, tilt: { x: 0, y: 0, z: 9.8 } })}
            className="w-full bg-gray-800 border border-gray-600 text-gray-400 text-[9px] font-bold py-1.5 rounded uppercase hover:bg-gray-700"
          >
            Simulate Stuck
          </button>
        </div>
      </div>
    </div>
  );
};
