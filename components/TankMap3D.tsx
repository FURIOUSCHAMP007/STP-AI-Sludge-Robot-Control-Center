import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Float, Text, Line, MeshDistortMaterial, GradientTexture } from '@react-three/drei';
import * as THREE from 'three';
import { SensorData, AIAnalysis } from '../types';

interface TankMap3DProps {
  sensors: SensorData[];
  aiResult: AIAnalysis;
  robotPosition: { x: number; y: number };
}

const RobotModel = ({ position, direction }: { position: [number, number, number], direction: string }) => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      
      // Rotate based on direction (simplified)
      let targetRotation = 0;
      if (direction === 'left') targetRotation = Math.PI / 2;
      if (direction === 'right') targetRotation = -Math.PI / 2;
      if (direction === 'backward') targetRotation = Math.PI;
      
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotation, 0.1);
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Robot Body */}
      <mesh castShadow>
        <boxGeometry args={[0.6, 0.3, 0.8]} />
        <meshStandardMaterial color="#10b981" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Tracks */}
      <mesh position={[0.35, -0.1, 0]}>
        <boxGeometry args={[0.15, 0.2, 0.9]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[-0.35, -0.1, 0]}>
        <boxGeometry args={[0.15, 0.2, 0.9]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {/* Sensor Head */}
      <mesh position={[0, 0.25, 0.2]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
      </mesh>
      {/* Light Beam */}
      <mesh position={[0, 0.25, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.2, 1, 32]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.2} />
      </mesh>
    </group>
  );
};

const SludgeZone = ({ position, density, size }: { position: [number, number, number], density: string, size: [number, number, number] }) => {
  const color = density === 'HIGH' ? '#ef4444' : density === 'MEDIUM' ? '#f59e0b' : '#10b981';
  
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <MeshDistortMaterial 
        color={color} 
        speed={2} 
        distort={0.3} 
        radius={1} 
        transparent 
        opacity={0.4} 
      />
    </mesh>
  );
};

const OptimizedPath = ({ path }: { path: { x: number, y: number }[] }) => {
  const points = useMemo(() => {
    return path.map(p => new THREE.Vector3(p.x - 5, 0.05, p.y - 5));
  }, [path]);

  if (points.length < 2) return null;

  return (
    <group>
      <Line
        points={points}
        color="#10b981"
        lineWidth={2}
        dashed={false}
      />
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
      ))}
    </group>
  );
};

const TankEnvironment = () => {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} metalness={0.2}>
          <GradientTexture
            stops={[0, 1]}
            colors={['#1e293b', '#0f172a']}
          />
        </meshStandardMaterial>
      </mesh>
      
      {/* Grid Lines */}
      <gridHelper args={[10, 10, 0x334155, 0x1e293b]} position={[0, -0.19, 0]} />

      {/* Walls */}
      <mesh position={[0, 1, -5.1]}>
        <boxGeometry args={[10.2, 2.5, 0.1]} />
        <meshStandardMaterial color="#1e293b" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, 1, 5.1]}>
        <boxGeometry args={[10.2, 2.5, 0.1]} />
        <meshStandardMaterial color="#1e293b" transparent opacity={0.3} />
      </mesh>
      <mesh position={[-5.1, 1, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[10.2, 2.5, 0.1]} />
        <meshStandardMaterial color="#1e293b" transparent opacity={0.3} />
      </mesh>
      <mesh position={[5.1, 1, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[10.2, 2.5, 0.1]} />
        <meshStandardMaterial color="#1e293b" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

export const TankMap3D: React.FC<TankMap3DProps> = ({ sensors, aiResult, robotPosition }) => {
  const latestSensor = sensors[sensors.length - 1];
  
  return (
    <div className="w-full h-[400px] bg-gray-950 rounded-xl overflow-hidden border border-gray-800 relative group">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-1">3D Path Optimization Map</h3>
        <p className="text-[10px] text-gray-500 font-mono">REAL-TIME SPATIAL RECONSTRUCTION</p>
      </div>
      
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <div className="flex items-center space-x-2 bg-gray-900/80 backdrop-blur border border-gray-800 px-3 py-1.5 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">AI Path Active</span>
        </div>
      </div>

      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[8, 8, 8]} fov={40} />
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          maxPolarAngle={Math.PI / 2.1} 
          minDistance={5}
          maxDistance={15}
        />
        
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <spotLight position={[-10, 10, -10]} angle={0.15} penumbra={1} intensity={0.5} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <TankEnvironment />
        
        {/* Robot */}
        <RobotModel 
          position={[robotPosition.x - 5, 0.15, robotPosition.y - 5]} 
          direction={aiResult.command?.action || 'stop'} 
        />
        
        {/* Path */}
        <OptimizedPath path={aiResult.optimizedPath || []} />
        
        {/* Sludge Zones (Simulated based on AI result) */}
        {aiResult.highDensityZones.map((zone, idx) => {
          // Map zone names like "A1", "B2" to coordinates
          const col = zone.charCodeAt(0) - 65; // A=0, B=1...
          const row = parseInt(zone.substring(1)) - 1;
          return (
            <SludgeZone 
              key={idx}
              position={[col - 4.5, 0, row - 4.5]}
              density={aiResult.sludgeLevel}
              size={[1, 0.2, 1]}
            />
          );
        })}

        {/* Floating Labels */}
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
          <Text
            position={[0, 3, 0]}
            fontSize={0.4}
            color="#10b981"
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKbxmcZVE.woff"
          >
            AQUAVORTEX MISSION SECTOR
          </Text>
        </Float>
      </Canvas>
      
      {/* Overlay for UI hints */}
      <div className="absolute inset-0 pointer-events-none border border-emerald-500/10 group-hover:border-emerald-500/30 transition-colors duration-500"></div>
      <div className="absolute top-0 right-0 p-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="text-[8px] font-mono text-emerald-500/50 text-right">
          DRAG TO ROTATE<br/>
          SCROLL TO ZOOM
        </div>
      </div>
    </div>
  );
};
