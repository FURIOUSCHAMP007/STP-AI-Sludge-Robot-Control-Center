
import React, { useState, useEffect } from 'react';

interface HeaderProps {
  isConnected: boolean;
  isDemoMode: boolean;
  isLowPower: boolean;
  eStopActive: boolean;
  onToggleDemo: () => void;
  onToggleLowPower: () => void;
  onEStop: () => void;
}

export const DashboardHeader: React.FC<HeaderProps> = ({ 
  isConnected, 
  isDemoMode, 
  isLowPower,
  eStopActive, 
  onToggleDemo, 
  onToggleLowPower,
  onEStop 
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center space-x-4">
        <div className="p-1.5 bg-emerald-600 rounded-lg">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight leading-none">STP-AI <span className="text-emerald-500">SludgeForce</span></h1>
          <span className="text-[8px] text-gray-500 font-mono tracking-widest uppercase">Safety Tier: Mission Critical</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 mr-2">
          <button 
            onClick={onToggleLowPower}
            className={`px-3 py-1 rounded-md text-[10px] font-bold border transition-colors ${
              isLowPower ? 'bg-blue-600/20 border-blue-500 text-blue-500' : 'bg-gray-700 border-gray-600 text-gray-400'
            }`}
            title="Optimizes UI for low-resource devices like Raspberry Pi Zero 2 W"
          >
            {isLowPower ? 'PI OPTIMIZED ON' : 'STANDARD UI'}
          </button>

          <button 
            onClick={onToggleDemo}
            className={`px-3 py-1 rounded-md text-[10px] font-bold border transition-colors ${
              isDemoMode ? 'bg-amber-600/20 border-amber-500 text-amber-500' : 'bg-gray-700 border-gray-600 text-gray-400'
            }`}
          >
            {isDemoMode ? 'DEMO MODE ACTIVE' : 'LIVE SYSTEM ONLY'}
          </button>
          
          <button 
            onClick={onEStop}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
              eStopActive ? 'bg-red-500 text-white animate-pulse' : 'bg-red-600/20 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white'
            }`}
          >
            {eStopActive ? 'SYSTEM HALTED' : 'EMERGENCY STOP'}
          </button>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${isConnected && !eStopActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
            <span className="text-gray-400 font-medium">Status: {eStopActive ? 'E-STOP' : isConnected ? 'Active' : 'Offline'}</span>
          </div>
          <div className="text-gray-400 font-mono tabular-nums">
            {time.toLocaleTimeString([], { hour12: false })}
          </div>
        </div>
      </div>
    </header>
  );
};
