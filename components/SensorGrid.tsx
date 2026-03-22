
import React from 'react';
import { SensorData, RiskLevel, SludgeHardness } from '../types';

interface SensorGridProps {
  data: SensorData;
  gasRisk: RiskLevel;
  sludgeHardness: SludgeHardness;
}

export const SensorGrid: React.FC<SensorGridProps> = ({ data, gasRisk, sludgeHardness }) => {
  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.HIGH: return 'text-red-500';
      case RiskLevel.MEDIUM: return 'text-amber-500';
      default: return 'text-emerald-500';
    }
  };

  const getHardnessColor = (level: SludgeHardness) => {
    switch (level) {
      case SludgeHardness.HARD: return 'text-red-500';
      case SludgeHardness.MEDIUM: return 'text-amber-500';
      default: return 'text-emerald-500';
    }
  };

  const sludgeThickness = Math.max(0, data.tankDepth - data.ultrasonicReading);

  return (
    <div className="grid grid-cols-2 md:grid-cols-8 gap-2">
      <StatCard 
        label="H₂S Level" 
        value={data.isOffline ? 'ERR' : `${data.h2s.toFixed(1)} ppm`} 
        status={data.isOffline ? 'critical' : data.h2s > 10 ? 'warning' : 'ok'}
      />
      <StatCard 
        label="Methane (CH₄)" 
        value={data.isOffline ? 'ERR' : `${data.methane.toFixed(1)} ppm`} 
        status={data.isOffline ? 'critical' : data.methane > 50 ? 'warning' : 'ok'}
      />
      <StatCard 
        label="Sludge Thickness" 
        value={`${sludgeThickness.toFixed(1)} cm`} 
        status={sludgeThickness > 40 ? 'warning' : 'ok'}
      />
      <StatCard 
        label="Sludge Hardness" 
        value={sludgeHardness} 
        customColor={getHardnessColor(sludgeHardness)}
      />
      <StatCard 
        label="Battery" 
        value={`${data.batteryVoltage.toFixed(1)}V (${Math.round(data.battery)}%)`} 
        status={data.battery < 20 ? 'critical' : data.battery < 40 ? 'warning' : 'ok'}
      />
      <StatCard 
        label="Temperature" 
        value={`${data.temperature.toFixed(1)}°C`} 
        status={data.temperature > 60 ? 'critical' : data.temperature > 45 ? 'warning' : 'ok'}
      />
      <StatCard 
        label="AI Risk" 
        value={gasRisk} 
        customColor={getRiskColor(gasRisk)}
      />
      <StatCard 
        label="Position" 
        value={`${data.position.x.toFixed(1)}, ${data.position.y.toFixed(1)}m`} 
        status="ok"
      />
    </div>
  );
};

const StatCard: React.FC<{ 
  label: string; 
  value: string; 
  status?: 'ok' | 'warning' | 'critical'; 
  customColor?: string;
}> = ({ label, value, status, customColor }) => {
  const colorClass = customColor || (
    status === 'critical' ? 'text-red-500' :
    status === 'warning' ? 'text-amber-500' :
    'text-emerald-500'
  );

  return (
    <div className="bg-gray-800 border border-gray-700 p-2 rounded-lg shadow-lg">
      <div className="text-gray-500 text-[8px] font-bold uppercase tracking-tighter mb-0.5">{label}</div>
      <div className={`text-sm font-black font-mono ${colorClass}`}>
        {value}
      </div>
    </div>
  );
};
