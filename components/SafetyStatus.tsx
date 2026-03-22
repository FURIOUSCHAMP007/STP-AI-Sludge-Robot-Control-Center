
import React from 'react';
import { SensorData, SafetyConfig } from '../types';

interface SafetyStatusProps {
  data: SensorData;
  config: SafetyConfig;
  isOverridden: boolean;
  eStopActive: boolean;
}

export const SafetyStatus: React.FC<SafetyStatusProps> = ({ data, config, isOverridden, eStopActive }) => {
  const checks = [
    { label: 'H2S Safe', ok: data.h2s < config.h2sLimit, value: `${data.h2s.toFixed(1)} / ${config.h2sLimit}` },
    { label: 'CH4 Safe', ok: data.methane < config.methaneLimit, value: `${data.methane.toFixed(1)} / ${config.methaneLimit}` },
    { label: 'Current Load', ok: data.motorCurrent < config.maxCurrent, value: `${data.motorCurrent.toFixed(1)} / ${config.maxCurrent}A` },
    { label: 'Chassis Level', ok: Math.abs(data.tilt.x) < config.tiltLimit, value: `${data.tilt.x.toFixed(1)}°` },
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 shadow-xl">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs font-bold uppercase text-gray-500">Security & Safety Matrix</h3>
        <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
          eStopActive ? 'bg-red-600 text-white' : 
          isOverridden ? 'bg-amber-600 text-white' : 
          'bg-emerald-600/20 text-emerald-500 border border-emerald-500/50'
        }`}>
          {eStopActive ? 'HALTED' : isOverridden ? 'AUTO OVERRIDE' : 'NOMINAL'}
        </div>
      </div>

      <div className="space-y-1.5">
        {checks.map((check, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <div className={`w-1.5 h-1.5 rounded-full ${check.ok ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></div>
              <span className="text-gray-400 font-medium">{check.label}</span>
            </div>
            <span className={`font-mono ${check.ok ? 'text-gray-500' : 'text-red-400 font-bold'}`}>{check.value}</span>
          </div>
        ))}
      </div>
      
      {isOverridden && !eStopActive && (
        <div className="mt-4 p-2 bg-red-950/40 border border-red-500/40 rounded text-[10px] text-red-400 font-medium">
          CRITICAL: Manual Override Ignored. Robot entering fail-safe retreat due to sensor thresholds.
        </div>
      )}
    </div>
  );
};
