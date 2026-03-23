# 🤖 AquaVortex AI: STP Sludge Robot Control Center (v6.0)

AquaVortex AI is a **real-time autonomous robotic control system** for hazardous Sewage Treatment Plant (STP) sludge management. It integrates **Google AI Studio (Gemini 1.5 Flash Vision + Decision Engine)** as a dual-layer AI brain to enable **perception-driven navigation, risk detection, and autonomous cleaning actions** on a Raspberry Pi-powered robotic platform.

---

# 🏗️ System Architecture (Upgraded)

The system follows a **Low-Latency Distributed Intelligence Architecture** using WebSockets + AI inference pipeline.

```
[Android Camera / Pi Cam]
        ↓ (WebRTC / IP Stream)
[Node.js Relay Server (WebSocket Hub)]
        ↓
 ┌────────────────────┬────────────────────┐
 │                    │                    │
[React Dashboard]  [Gemini Vision AI]  [Raspberry Pi Bot]
                         ↓                    ↓
                 Scene Understanding     Motor Execution
                         ↓
                 Decision Engine (Gemini)
                         ↓
                Command JSON → Bot
```

---

# 🧠 AI BRAIN (CRITICAL UPGRADE)

## 🔥 Dual AI Layer (Winning Architecture)

### 1. Vision Layer (Gemini Vision)

* Input: Live camera frame
* Output:
  * Objects detected (sludge, pipes, obstacles, humans)
  * Environment understanding
  * Risk level

### 2. Decision Layer (Gemini Reasoning)

* Input:
  * Sensor telemetry
  * Vision output
* Output:
  * Final robot command

---

## ⚙️ Model Used

* **Primary:** `gemini-1.5-flash` ✅ (fast, real-time)
* Optional: `gemini-1.5-pro` (high accuracy mode)

---

# 🧠 AI PROMPTS (UPDATED FOR MAX SCORE)

## 🔹 Vision Prompt
```text
You are an AI vision system for a sewage cleaning robot.
Analyze the image and detect:
- sludge presence and density
- obstacles (pipes, walls, humans)
- hazardous conditions
Return STRICT JSON:
{
  "objects": [],
  "sludge_level": "low/medium/high",
  "environment": "",
  "risk_level": "low/medium/high"
}
```

## 🔹 Decision Prompt
```text
You are the autonomous AI brain of a sludge-cleaning robot.
Inputs:
1. Sensor Data
2. Vision Analysis
Decide the safest and most efficient action.
Return ONLY JSON:
{
  "command": "forward|backward|left|right|stop|clean|lift_bucket",
  "speed": 0.0-1.0,
  "reason": "",
  "priority": "low|medium|high"
}
```

---

# 🛠️ Hardware Setup (Raspberry Pi)

### 🔧 Components
* Raspberry Pi 4B / Zero 2W
* L298N Motor Driver / PCA9685
* 2x DC Motors
* 3x MG996R Servos
* Pi Camera / External Camera

### 📡 Sensors
* HC-SR04 (Distance)
* IR Sensors (Edge detection)
* MQ-2 / MQ-135 (Gas detection)
* MPU6050 (Tilt / Stability)

---

# 🐍 Raspberry Pi Software

### Install dependencies:
```bash
pip install websocket-client gpiozero adafruit-circuitpython-pca9685 adafruit-circuitpython-motor opencv-python
```

---

# 📡 WebSocket Protocol (REFINED)

## 🔹 Telemetry (Pi → Server)
```json
{
  "type": "telemetry",
  "sensors": {
    "distance_cm": 45,
    "ir_left": 0,
    "ir_right": 0,
    "gas_raw": 0.12,
    "motorCurrent": 0.8,
    "battery": 85,
    "tilt": {"x": 2, "y": 1, "z": 9.8}
  },
  "vision": {
    "sludge_level": "medium",
    "risk_level": "low"
  }
}
```

## 🔹 Commands (Server → Pi)

### Movement:
```json
{"device": "motors", "action": "forward", "speed": 0.7}
```

### Bucket:
```json
{"device": "bucket", "angle": 120}
```

### Camera:
```json
{"device": "camera", "pan": 90, "tilt": 45}
```

---

# 🌐 Node.js Relay Server (Enhanced Role)

Acts as:
* WebSocket Hub
* AI Request Manager
* Safety Controller

### New Responsibilities:
* Frame throttling (avoid API overload)
* AI response validation
* Failover handling

---

# ⚡ AI PROCESSING PIPELINE
```
Frame → Compress → Send to Gemini Vision
        ↓
Vision JSON → Merge with Sensor Data
        ↓
Send to Gemini Decision Model
        ↓
Command JSON → Validate → Send to Bot
```

---

# 🚀 Dashboard (React)

### Features:
* Live camera stream
* Real-time telemetry charts
* AI decision logs
* Manual override controls
* Emergency stop button

---

# 📱 Mobile Camera Integration & Android Deployment (v2.0)

Integrating your **Android phone camera** into AquaVortex AI enables a **real-time vision pipeline** where live video is streamed to the dashboard and processed by **Google AI Studio (Gemini Vision)** for intelligent robot control.

---

## 🎥 1. Connecting Your Phone Camera (Primary Vision Source)

The fastest and most reliable method is using your phone browser as a **WebRTC camera node**.

### ✅ Steps

#### 1. Open the Application
On your Android device (Chrome recommended):
`https://ais-dev-hd4xpiii7hv4fajokawto7-27223459147.asia-southeast1.run.app`

#### 2. Grant Permissions
* Allow **Camera Access**
* (Optional) Allow Microphone if needed for future upgrades

#### 3. Select Camera
Inside the **Tactical Hub → Camera Feed section**:
* Use dropdown (bottom-right of video)
* Switch between:
  * Rear Camera (recommended for robot vision)
  * Front Camera

#### 4. Mounting Setup (Critical for AI Accuracy)
* Fix phone rigidly on robot chassis
* Align camera angle slightly downward (~15–25°)
* Avoid vibration (use foam/3D mount)

---

## ⚡ What Happens Internally

```
Phone Camera → WebRTC Stream → Node.js Server
                  ↓
            Gemini Vision AI
                  ↓
        Scene Understanding JSON
                  ↓
        Robot Decision Engine
                  ↓
            Commands → Bot
```

---

## 🤖 2. Gemini AI Integration (Behind the Scenes)

Your phone camera feed is:
1. Captured via WebRTC
2. Frames sampled (every ~300ms)
3. Sent to **Gemini 1.5 Flash**
4. Converted into structured intelligence:

### Example AI Output
```json
{
  "objects": ["sludge", "pipe"],
  "sludge_level": "high",
  "risk_level": "medium",
  "action": "clean"
}
```

---

## 📲 3. Android App Creation Options

### 🟢 Option A: PWA (Recommended – Fastest)
1. Open app in Chrome
2. Tap **⋮ (menu)**
3. Select **"Add to Home Screen"**
* **Result:** Fullscreen experience, app icon created, no browser UI, uses native camera APIs.

### 🔵 Option B: Native APK (Capacitor Wrapper)
Use this if you need background execution, Bluetooth / Serial integration, or offline fallback.

#### ⚙️ Setup
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init
npx cap add android
npm run build
npx cap copy
npx cap open android
```
* Build APK in Android Studio and install on device.

---

## 📡 4. Hardware Integration (Robot + Phone + Cloud)

### 🔗 Communication Model
```
[Raspberry Pi] ←→ [Node.js Server] ←→ [Phone Dashboard]
         ↑                                  ↓
   Sensor Data                     Camera Stream
         ↓                                  ↓
       Gemini AI ← ← ← ← ← ← ← ← ← ← ← ← ←
```

### 🌐 Network Modes
* **🟢 Same WiFi:** Best for testing, low latency, direct communication.
* **🔵 Cloud Mode:** Uses Google Cloud Run URL, works over 4G / 5G, enables remote monitoring.

---

## 🚀 5. Performance Optimization (VERY IMPORTANT)
* **Limit frame rate:** 2–3 FPS for AI
* **Resize frames:** 640x480
* **Compress JPEG:** ~70% quality
* **Avoid sending raw video to AI**

---

## 🛡️ 6. Stability & Safety Tips
* Lock screen orientation (landscape)
* Disable battery saver (prevents camera kill)
* Keep phone cool (avoid overheating in field)
* Use power bank for long runs

---

# 🛡️ Safety Protocols (UPGRADED)

## 🔴 1. Emergency Stop
* Hard kill switch (software + hardware)

## 🟠 2. AI Guardrails
Before executing AI command:
```js
if (gas_raw > 0.6) → FORCE STOP
if (distance_cm < 20) → AUTO BACKWARD
if (tilt unstable) → STOP
```

## 🟡 3. Fallback Mode
If Gemini fails:
* Local rule-based navigation
* Obstacle avoidance using ultrasonic + IR

---

# 📊 PERFORMANCE OPTIMIZATION

## 🔥 MUST DO
* Process **1 frame every 300–500ms**
* Resize image before sending (e.g., 640x480)
* Use JPEG compression (70%)

---

# 🔑 ENV VARIABLES
```
GEMINI_API_KEY=your_api_key
PORT=3000
WS_URL=wss://your-server-url
```

---

# 🧩 FILE STRUCTURE (UPDATED)
```
/server
  ├── index.js
  ├── websocket.js
  ├── aiVision.js
  ├── aiDecision.js

/pi
  ├── main_bot.py
  ├── sensors.py
  ├── motor_control.py

/client
  ├── dashboard.jsx
```

---

# 🏆 WHY THIS VERSION WINS HACKATHONS
* ✅ Real-time AI + robotics integration
* ✅ Multi-layer intelligence (Vision + Decision)
* ✅ Strong safety system
* ✅ Scalable architecture
* ✅ Industry-relevant (STP automation)
* ✅ Clear AI explainability (JSON reasoning)

---

# 🚀 OPTIONAL ADVANCED FEATURES
* AI sludge volume estimation
* Predictive maintenance (motor load analysis)
* Autonomous path planning
* Digital twin simulation

---

# 🎯 FINAL SUMMARY

AquaVortex AI is not just a robot — it's a **distributed intelligent system** combining:
* Real-time sensing
* Vision-based AI
* Autonomous decision-making
* Safe robotic execution

---

**Documentation v6.0.0 // AquaVortex AI // 2026**
