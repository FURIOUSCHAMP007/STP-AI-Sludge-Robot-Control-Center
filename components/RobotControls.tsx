
import React, { useState, useEffect } from 'react';
import { RobotStatus } from '../types';
import { bluetoothService } from '../services/bluetoothService';
import { Bluetooth, BluetoothOff, RefreshCw } from 'lucide-react';

interface RobotControlsProps {
  status: RobotStatus;
  onCommand: (cmd: Partial<RobotStatus>) => void;
}

export const RobotControls: React.FC<RobotControlsProps> = ({ status, onCommand }) => {
  const [isBtConnected, setIsBtConnected] = useState(false);
  const [btDeviceName, setBtDeviceName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    bluetoothService.setCallbacks(
      (data) => {
        console.log('Received from BT:', data);
        // Handle incoming data if needed
      },
      () => {
        setIsBtConnected(false);
        setBtDeviceName('');
      }
    );
  }, []);

  const handleBtConnect = async () => {
    setIsConnecting(true);
    try {
      const name = await bluetoothService.connect();
      setIsBtConnected(true);
      setBtDeviceName(name);
    } catch (error) {
      console.error('BT Connection failed', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleBtDisconnect = async () => {
    await bluetoothService.disconnect();
    setIsBtConnected(false);
    setBtDeviceName('');
  };

  const directions = [
    { label: '', val: null },
    { label: '↑', val: 'forward' as const },
    { label: '', val: null },
    { label: '←', val: 'left' as const },
    { label: 'STOP', val: 'stop' as const, color: 'bg-red-600 hover:bg-red-500' },
    { label: '→', val: 'right' as const },
    { label: '', val: null },
    { label: '↓', val: 'backward' as const },
    { label: '', val: null },
  ];

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-xl overflow-y-auto max-h-full custom-scrollbar">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[10px] font-black uppercase text-gray-400 flex items-center tracking-widest">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
          Tactical Controls
        </h3>
        
        <button
          onClick={isBtConnected ? handleBtDisconnect : handleBtConnect}
          disabled={isConnecting}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
            isBtConnected 
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
              : 'bg-gray-700 text-gray-400 border border-gray-600 hover:border-gray-500'
          }`}
        >
          {isConnecting ? (
            <RefreshCw size={12} className="animate-spin" />
          ) : isBtConnected ? (
            <Bluetooth size={12} />
          ) : (
            <BluetoothOff size={12} />
          )}
          <span>{isConnecting ? 'CONNECTING...' : isBtConnected ? btDeviceName : 'CONNECT BT'}</span>
        </button>
      </div>

      <div className="flex items-center justify-between mb-4 bg-gray-900/50 p-3 rounded-xl border border-gray-700">
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase text-gray-500 tracking-widest">Control Mode</span>
          <span className={`text-[10px] font-bold ${status.isAutonomous ? 'text-blue-400' : 'text-amber-400'}`}>
            {status.isAutonomous ? 'AUTO (AI)' : 'MANUAL'}
          </span>
        </div>
        <button
          onClick={() => onCommand({ isAutonomous: !status.isAutonomous })}
          className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
            status.isAutonomous 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
              : 'bg-gray-700 text-gray-400 border border-gray-600'
          }`}
        >
          {status.isAutonomous ? 'Manual' : 'Auto'}
        </button>
      </div>

      <div className={`${status.isAutonomous ? 'opacity-30 pointer-events-none' : ''} transition-all`}>
        <div className="grid grid-cols-3 gap-1 max-w-[140px] mx-auto mb-3">
        {directions.map((d, i) => (
          d.val ? (
            <button
              key={i}
              onClick={() => onCommand({ direction: d.val })}
              className={`p-2 rounded-lg text-xs font-bold transition-all transform active:scale-95 ${
                status.direction === d.val && d.val !== 'stop' ? 'ring-2 ring-emerald-500 bg-gray-700' : 
                d.color || 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {d.label}
            </button>
          ) : <div key={i} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => onCommand({ bucketPosition: Math.min(1, status.bucketPosition + 0.2) })}
          className="bg-amber-600 hover:bg-amber-500 text-white py-1.5 rounded-lg font-black uppercase text-[7px] tracking-widest transition-all shadow-lg active:scale-95"
        >
          Bucket Up
        </button>
        <button
          onClick={() => onCommand({ bucketPosition: Math.max(-1, status.bucketPosition - 0.2) })}
          className="bg-amber-800 hover:bg-amber-700 text-white py-1.5 rounded-lg font-black uppercase text-[7px] tracking-widest transition-all shadow-lg active:scale-95"
        >
          Bucket Down
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex justify-between items-center bg-gray-900/30 p-1.5 rounded-lg border border-gray-700/30">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Brush</span>
          <button 
            onClick={() => onCommand({ cleaning: !status.cleaning })}
            className={`px-2 py-1 rounded-full text-[9px] font-black transition-colors ${
              status.cleaning ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-400'
            }`}
          >
            {status.cleaning ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="flex justify-between items-center bg-gray-900/30 p-1.5 rounded-lg border border-gray-700/30">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Pump</span>
          <button 
            onClick={() => onCommand({ pumpActive: !status.pumpActive })}
            className={`px-2 py-1 rounded-full text-[9px] font-black transition-colors ${
              status.pumpActive ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
            }`}
          >
            {status.pumpActive ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-[9px] text-gray-600 font-bold uppercase mb-1.5 tracking-widest">
          <span>RPM Control</span>
          <span className="text-emerald-500">{status.brushSpeed}%</span>
        </div>
        <input 
          type="range" 
          min="0" max="100" 
          value={status.brushSpeed}
          onChange={(e) => onCommand({ brushSpeed: parseInt(e.target.value) })}
          className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
        />
      </div>
    </div>
  </div>
  );
};
