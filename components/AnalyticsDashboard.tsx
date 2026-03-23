
import React from 'react';
import { SensorData, AIAnalysis } from '../types';
import { TankMap3D } from './TankMap3D';

interface AnalyticsDashboardProps {
  sensors: SensorData[];
  aiResult: AIAnalysis;
  robotPosition: { x: number; y: number };
}

const ChartCard: React.FC<{
  title: string;
  data: number[];
  color: string;
  unit: string;
  min?: number;
  max?: number;
}> = ({ title, data, color, unit, min: minProp, max: maxProp }) => {
  const chartHeight = 100;
  const chartWidth = 400;

  const min = minProp !== undefined ? minProp : Math.min(...data, 0);
  const max = maxProp !== undefined ? maxProp : Math.max(...data, 1);
  const range = max - min || 1;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1 || 1)) * chartWidth;
      const y = chartHeight - ((val - min) / range) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  const lastValue = data.length > 0 ? data[data.length - 1] : 0;

  return (
    <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl shadow-lg flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{title}</h4>
          <div className="text-2xl font-mono font-bold mt-1">
            {lastValue.toFixed(1)}
            <span className="text-xs text-gray-600 ml-1">{unit}</span>
          </div>
        </div>
        <div className={`w-2 h-2 rounded-full mt-2 animate-pulse ${color.replace('text-', 'bg-')}`}></div>
      </div>
      
      <div className="relative flex-1 min-h-[120px] mt-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Grid Lines */}
          <line x1="0" y1="0" x2={chartWidth} y2="0" stroke="#374151" strokeWidth="0.5" strokeDasharray="4" />
          <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#374151" strokeWidth="0.5" strokeDasharray="4" />
          <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#374151" strokeWidth="1" />

          {/* Data Path */}
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            points={points}
            className={color}
          />
          
          {/* Gradient Area */}
          <polyline
            fill="currentColor"
            fillOpacity="0.1"
            points={`${chartWidth},${chartHeight} 0,${chartHeight} ${points}`}
            className={color}
          />
        </svg>
      </div>
      
      <div className="flex justify-between mt-4 text-[8px] text-gray-600 font-mono uppercase">
        <span>History (60s)</span>
        <span>Peak: {max.toFixed(1)}</span>
      </div>
    </div>
  );
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ sensors, aiResult, robotPosition }) => {
  if (sensors.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 font-mono italic">
        Awaiting telemetry synchronization...
      </div>
    );
  }

  const sludgeThicknessData = sensors.map(s => Math.max(0, s.tankDepth - s.ultrasonicReading));

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/80">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-300">Spatial Intelligence Engine</h3>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-[10px] font-mono text-gray-600">SECTOR: ALPHA-09</span>
            <span className="text-[10px] font-mono text-blue-500/70">VIRTUAL_RECON_ACTIVE</span>
          </div>
        </div>
        <TankMap3D sensors={sensors} aiResult={aiResult} robotPosition={robotPosition} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard 
          title="Hydrogen Sulfide (H2S)" 
          data={sensors.map(s => s.h2s)} 
          color="text-amber-500" 
          unit="ppm" 
          max={20}
        />
        <ChartCard 
          title="Vibration Frequency" 
          data={sensors.map(s => s.vibrationFrequency)} 
          color="text-purple-500" 
          unit="Hz" 
          max={60}
        />
        <ChartCard 
          title="Sludge Thickness Prediction" 
          data={sludgeThicknessData} 
          color="text-emerald-500" 
          unit="cm" 
          max={100}
        />
        <ChartCard 
          title="Torque Feedback" 
          data={sensors.map(s => s.torqueFeedback)} 
          color="text-red-500" 
          unit="Nm" 
          max={30}
        />
        <ChartCard 
          title="Battery Voltage" 
          data={sensors.map(s => s.batteryVoltage)} 
          color="text-emerald-400" 
          unit="V" 
          min={18}
          max={26}
        />
        <ChartCard 
          title="System Temperature" 
          data={sensors.map(s => s.temperature)} 
          color="text-orange-500" 
          unit="°C" 
          max={100}
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl flex flex-col md:flex-row gap-8 items-center justify-around">
        <div className="text-center">
          <div className="text-[10px] text-gray-600 font-bold uppercase mb-2">System Reliability</div>
          <div className="text-3xl font-mono text-emerald-600">99.98%</div>
          <div className="text-[8px] text-gray-700 mt-1 uppercase">Mission Uptime</div>
        </div>
        <div className="h-12 w-[1px] bg-gray-800 hidden md:block"></div>
        <div className="text-center">
          <div className="text-[10px] text-gray-600 font-bold uppercase mb-2">AI Reasoning Latency</div>
          <div className="text-3xl font-mono text-blue-500">240ms</div>
          <div className="text-[8px] text-gray-700 mt-1 uppercase">Local Processing</div>
        </div>
        <div className="h-12 w-[1px] bg-gray-800 hidden md:block"></div>
        <div className="text-center">
          <div className="text-[10px] text-gray-600 font-bold uppercase mb-2">Battery Efficiency</div>
          <div className="text-3xl font-mono text-emerald-500">+18%</div>
          <div className="text-[8px] text-gray-700 mt-1 uppercase">AI Path Optimized</div>
        </div>
        <div className="h-12 w-[1px] bg-gray-800 hidden md:block"></div>
        <div className="text-center">
          <div className="text-[10px] text-gray-600 font-bold uppercase mb-2">Total Effluent Cleared</div>
          <div className="text-3xl font-mono text-amber-500">12.4m³</div>
          <div className="text-[8px] text-gray-700 mt-1 uppercase">Current Mission</div>
        </div>
      </div>
    </div>
  );
};
