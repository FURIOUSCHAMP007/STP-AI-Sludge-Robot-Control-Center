import React from 'react';

interface TankMapProps {
  currentPos: { x: number; y: number };
  path: { x: number; y: number }[];
  coverage: number;
}

export const TankMap: React.FC<TankMapProps> = ({ currentPos, path, coverage }) => {
  // Scale 10x10m to 200x200px
  const scale = 20;
  
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col shadow-inner">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Path Optimization Map</h3>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] text-emerald-500 font-mono">{coverage.toFixed(1)}% COVERED</span>
          <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${coverage}%` }}></div>
          </div>
        </div>
      </div>
      
      <div className="relative w-full aspect-square bg-gray-950 rounded border border-gray-800 overflow-hidden flex items-center justify-center">
        {/* Grid lines */}
        <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 opacity-10 pointer-events-none">
          {[...Array(100)].map((_, i) => (
            <div key={i} className="border-[0.5px] border-gray-500"></div>
          ))}
        </div>

        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Path lines */}
          {path.length > 0 && (
            <polyline
              points={`${currentPos.x * scale},${currentPos.y * scale} ${path.map(p => `${p.x * scale},${p.y * scale}`).join(' ')}`}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="4 2"
              className="opacity-50"
            />
          )}

          {/* Path points */}
          {path.map((p, i) => (
            <circle
              key={i}
              cx={p.x * scale}
              cy={p.y * scale}
              r="3"
              fill="#3b82f6"
              className="animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}

          {/* Current Position */}
          <g transform={`translate(${currentPos.x * scale}, ${currentPos.y * scale})`}>
            <circle r="6" fill="#10b981" className="animate-ping opacity-40" />
            <circle r="4" fill="#10b981" />
            <path d="M-6 0 L6 0 M0 -6 L0 6" stroke="#10b981" strokeWidth="1" opacity="0.5" />
          </g>
        </svg>

        <div className="absolute bottom-2 right-2 flex flex-col items-end space-y-1">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-[8px] text-gray-500 uppercase">Robot Pos</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-[8px] text-gray-500 uppercase">AI Optimized Path</span>
          </div>
        </div>
      </div>
      
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="bg-gray-800/30 p-2 rounded border border-gray-700/30">
          <div className="text-[8px] text-gray-600 uppercase">Current X/Y</div>
          <div className="text-xs font-mono text-gray-300">{currentPos.x.toFixed(2)}m / {currentPos.y.toFixed(2)}m</div>
        </div>
        <div className="bg-gray-800/30 p-2 rounded border border-gray-700/30">
          <div className="text-[8px] text-gray-600 uppercase">Next Waypoint</div>
          <div className="text-xs font-mono text-blue-400">
            {path[0] ? `${path[0].x.toFixed(1)}m, ${path[0].y.toFixed(1)}m` : 'NONE'}
          </div>
        </div>
      </div>
    </div>
  );
};
