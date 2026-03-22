
import React from 'react';

export const PresentationView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 py-8 animate-in fade-in duration-700">
      {/* Slide 1: Team Details */}
      <section className="bg-gray-900/50 border border-gray-800 rounded-3xl p-12 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
        <div className="relative z-10">
          <h2 className="text-amber-500 text-[10px] font-bold uppercase tracking-[0.5em] mb-4">AquaVortex AI</h2>
          <h1 className="text-5xl font-black text-white mb-8 tracking-tight">
            AI-Powered Autonomous <br />
            <span className="text-emerald-500">Sludge Removal Robot</span>
          </h1>
          <div className="flex flex-wrap justify-center gap-8 mt-12">
            {['Faizan Ahmed', 'Member 2', 'Member 3', 'Member 4'].map((name, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-12 h-12 bg-gray-800 rounded-full mb-2 flex items-center justify-center border border-gray-700">
                  <span className="text-xs font-bold text-emerald-500">{name[0]}</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Slide 2: Problem Statement */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="bg-red-950/20 border border-red-500/30 p-8 rounded-3xl">
          <h3 className="text-red-400 font-black uppercase text-xs tracking-widest mb-6 flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
            Critical Problem Statement
          </h3>
          <ul className="space-y-4 text-gray-200">
            {[
              'Sludge accumulation reduces STP efficiency significantly.',
              'Manual cleaning is highly hazardous (H₂S, methane exposure).',
              'Lack of real-time sludge thickness monitoring leads to failure.',
              'Cleaning currently reactive, not predictive.'
            ].map((text, i) => (
              <li key={i} className="flex items-start space-x-3">
                <span className="text-red-400 mt-1">●</span>
                <span className="text-sm font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-8">
          <h4 className="text-gray-500 font-bold uppercase text-[10px] mb-4">Total System Impact</h4>
          <div className="grid grid-cols-1 gap-4">
             <ImpactMetric label="Worker Hazard" level="EXTREME" color="text-red-500" />
             <ImpactMetric label="Operational Cost" level="HIGH" color="text-amber-500" />
             <ImpactMetric label="Environmental Risk" level="CRITICAL" color="text-red-500" />
          </div>
        </div>
      </section>

      {/* Slide 3: Solution Overview */}
      <section className="bg-emerald-950/10 border border-emerald-500/20 p-12 rounded-3xl">
        <div className="text-center mb-12">
          <h3 className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-4">Mission Solution</h3>
          <p className="text-3xl font-black text-white italic leading-tight">
            "An AI-enabled floating robotic system that detects, breaks, and removes sludge autonomously inside STP tanks."
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            'AI Sludge Detection',
            'Plate Vibrating Mechanism',
            'High-Power Suction',
            'Autonomous Mobility',
            'Smart Battery MGMT'
          ].map((feature, i) => (
            <div key={i} className="bg-gray-900 border border-gray-700 p-4 rounded-xl text-center shadow-lg">
              <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center mx-auto mb-3 border border-emerald-500/30">
                {i + 1}
              </div>
              <span className="text-[10px] font-black text-gray-300 uppercase leading-tight block tracking-wider">{feature}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Slide 4: AI Features */}
      <section>
        <h3 className="text-center text-blue-500 font-bold text-xs uppercase tracking-[0.5em] mb-12">Core AI Architecture</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <AIFeatureCard title="Thickness Prediction" desc="Ultrasonic + depth mapping depth models." />
          <AIFeatureCard title="Hardness Class" desc="Vibration feedback + motor load analysis." />
          <AIFeatureCard title="Adaptive Vibration" desc="Dynamic frequency adjustment via feedback." />
          <AIFeatureCard title="Path Optimization" desc="RL-based navigation to minimize runtime." />
          <AIFeatureCard title="Predictive Health" desc="Failure prediction via multi-sensor fusion." />
        </div>
      </section>

      {/* Slide 5: Hardware Architecture */}
      <section className="bg-gray-900 border border-gray-800 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px]"></div>
        <div className="relative z-10">
          <h3 className="text-blue-400 font-bold text-xs uppercase tracking-widest mb-8 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Hardware Architecture (Pi 02W)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h4 className="text-white font-bold text-sm uppercase tracking-wider">Control Unit</h4>
              <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl">
                <ul className="text-[10px] text-gray-400 space-y-2 font-mono">
                  <li className="flex justify-between"><span>Processor:</span> <span className="text-blue-400">RPi Zero 2 W</span></li>
                  <li className="flex justify-between"><span>OS:</span> <span className="text-blue-400">Raspberry Pi OS Lite</span></li>
                  <li className="flex justify-between"><span>Comm:</span> <span className="text-blue-400">WiFi / Bluetooth 4.2</span></li>
                  <li className="flex justify-between"><span>Power:</span> <span className="text-blue-400">5V / 2.5A DC</span></li>
                </ul>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-white font-bold text-sm uppercase tracking-wider">GPIO Pin Mapping</h4>
              <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl">
                <ul className="text-[10px] text-gray-400 space-y-2 font-mono">
                  <li className="flex justify-between"><span>Ultrasonic (Trig/Echo):</span> <span className="text-amber-400">GPIO 23 / 24</span></li>
                  <li className="flex justify-between"><span>Motor (L298N IN1/IN2):</span> <span className="text-amber-400">GPIO 17 / 18</span></li>
                  <li className="flex justify-between"><span>Servo (MG995):</span> <span className="text-amber-400">GPIO 25</span></li>
                  <li className="flex justify-between"><span>Relay (Pump):</span> <span className="text-amber-400">GPIO 27</span></li>
                </ul>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-white font-bold text-sm uppercase tracking-wider">Actuators</h4>
              <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl">
                <ul className="text-[10px] text-gray-400 space-y-2 font-mono">
                  <li className="flex justify-between"><span>Movement:</span> <span className="text-emerald-400">DC Geared Motors</span></li>
                  <li className="flex justify-between"><span>Vibration:</span> <span className="text-emerald-400">ERM Plate (PWM)</span></li>
                  <li className="flex justify-between"><span>Suction:</span> <span className="text-emerald-400">Submersible Pump</span></li>
                  <li className="flex justify-between"><span>Bucket:</span> <span className="text-emerald-400">Servo-Actuated Arm</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Slide 6: Firmware Logic */}
      <section className="bg-black border border-gray-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-emerald-400 font-bold text-xs uppercase tracking-widest flex items-center">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
            Robot Firmware (Python 3.9)
          </h3>
          <span className="text-[8px] font-mono text-gray-600">LOCATION: /robot/main.py</span>
        </div>
        <div className="bg-gray-950 rounded-xl p-6 font-mono text-[10px] text-gray-400 overflow-x-auto border border-gray-800">
          <pre className="text-emerald-500/80">
{`# AquaVortex AI - Multi-Mode Control Loop
def run():
    while True:
        # 1. Check Bluetooth for Mode Switch (AUTO/MANUAL)
        cmd = listen_bt_commands()
        if cmd.mode == "MANUAL":
            execute_manual_override(cmd)
            continue

        # 2. Autonomous Mode: Read sensors
        sensor_data = get_telemetry()

        # 3. Get AI decision from Gemini 3 Flash
        ai_response = get_ai_decision(sensor_data)
        
        # 4. Execute actions (Move, Vibrate, Suction, Bucket)
        execute_hardware_commands(ai_response)`}
          </pre>
        </div>
      </section>

      {/* Slides 7-10: Technical Modules */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <TechModuleCard 
          title="Mobility System" 
          icon="🚤" 
          points={['Sealed buoyant chassis', 'Dual DC motor propulsion', 'Differential steering', 'Anti-corrosion coating', 'Stability control using IMU']}
        />
        <TechModuleCard 
          title="Battery System" 
          icon="🔋" 
          points={['Lithium-Ion Pack (24V/12V)', '3–4 hours operational runtime', 'Integrated BMS safety', 'Real-time telemetry', 'Automatic docking support']}
        />
        <TechModuleCard 
          title="Vibrating Plate" 
          icon="⚙" 
          points={['Stainless steel construction', 'Eccentric Rotating Mass (ERM)', 'Breaks hardened sludge layers', 'Loosens compact sediment', 'Prevents suction clogging']}
        />
        <TechModuleCard 
          title="Suction System" 
          icon="💨" 
          points={['Industrial submersible pump', 'Sludge pipe outlet system', 'Anti-clog mesh filter', 'AI-controlled suction intensity', 'Efficiency-optimized timing']}
        />
      </section>

      {/* Slide 9: Workflow */}
      <section className="bg-gray-900 border border-gray-800 p-12 rounded-3xl">
        <h3 className="text-center text-gray-500 font-bold text-xs uppercase tracking-widest mb-12">Deployment Workflow</h3>
        <div className="relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-800 -translate-y-1/2 hidden md:block"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            <WorkflowStep num="01" label="ENTRY" sub="Robot enters tank & initializes sensors" />
            <WorkflowStep num="02" label="ANALYZE" sub="AI predicts density & depth mapping" />
            <WorkflowStep num="03" label="ACTION" sub="Vibrating plate breaks, suction removes" />
            <WorkflowStep num="04" label="SHIFT" sub="Moves to next zone or return home" />
          </div>
        </div>
      </section>

      {/* Slide 10: Impact */}
      <section className="text-center space-y-8 pb-20">
        <h3 className="text-amber-500 font-bold text-xs uppercase tracking-widest">Global Impact & Future</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="text-left space-y-4">
             <h4 className="text-xl font-bold text-white">Impact Matrix</h4>
             <p className="text-gray-400 text-sm">Eliminates human entry, reducing occupational fatalities to zero. Operations costs reduced by 50% through predictive maintenance and optimized cleaning paths.</p>
          </div>
          <div className="text-left space-y-4">
             <h4 className="text-xl font-bold text-emerald-500">Future Roadmap</h4>
             <p className="text-gray-400 text-sm">Swarm robotics for massive STPs, LiDAR-based 3D reconstruction of tank health, and city-wide sludge AI network integration.</p>
          </div>
        </div>
        <div className="pt-12">
          <div className="inline-block px-12 py-4 bg-emerald-600 rounded-full text-white font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20">
            AQUAVORTEX :: MISSION COMPLETE
          </div>
        </div>
      </section>
    </div>
  );
};

const ImpactMetric: React.FC<{ label: string; level: string; color: string }> = ({ label, level, color }) => (
  <div className="flex justify-between items-center bg-gray-800/50 p-3 rounded-lg border border-gray-700">
    <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{label}</span>
    <span className={`text-xs font-black uppercase ${color}`}>{level}</span>
  </div>
);

const AIFeatureCard: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (
  <div className="bg-gray-800/30 border border-gray-700/50 p-6 rounded-2xl hover:border-blue-500/50 transition-all group">
    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mb-4 group-hover:scale-150 transition-transform"></div>
    <h4 className="text-white font-black text-sm mb-2">{title}</h4>
    <p className="text-gray-300 text-[10px] leading-relaxed font-medium">{desc}</p>
  </div>
);

const TechModuleCard: React.FC<{ title: string; icon: string; points: string[] }> = ({ title, icon, points }) => (
  <div className="bg-gray-900 border border-gray-800 p-8 rounded-3xl group hover:border-emerald-500/30 transition-all shadow-xl">
    <div className="text-4xl mb-6">{icon}</div>
    <h4 className="text-white font-black uppercase text-sm mb-4 tracking-widest">{title}</h4>
    <ul className="space-y-2">
      {points.map((p, i) => (
        <li key={i} className="text-xs text-gray-200 font-medium flex items-center">
          <span className="w-1 h-1 bg-emerald-400 rounded-full mr-2"></span>
          {p}
        </li>
      ))}
    </ul>
  </div>
);

const WorkflowStep: React.FC<{ num: string; label: string; sub: string }> = ({ num, label, sub }) => (
  <div className="text-center group">
    <div className="w-12 h-12 rounded-full bg-gray-800 border-4 border-gray-900 mx-auto mb-4 flex items-center justify-center text-xs font-black text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
      {num}
    </div>
    <h5 className="text-white font-black text-xs uppercase tracking-widest mb-2">{label}</h5>
    <p className="text-[10px] text-gray-500 leading-tight">{sub}</p>
  </div>
);
