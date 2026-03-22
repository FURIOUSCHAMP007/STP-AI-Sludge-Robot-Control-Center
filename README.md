# STP-AI SludgeForce Control Center

An advanced, AI-driven autonomous robotic control system designed for Sewage Treatment Plant (STP) sludge management. This application serves as the central command and intelligence hub for the AquaVortex robotic fleet.

## 🚀 Overview

The STP-AI SludgeForce is a cutting-edge solution for the hazardous task of STP tank cleaning. By leveraging **Gemini 3 Flash** multimodal AI, the system autonomously detects, breaks down, and removes sludge while ensuring maximum safety for human operators.

## ✨ Key Features

### 1. Tactical Hub
*   **Real-time Telemetry**: Monitor Motor Load, H2S Gas Levels, Vibration, and Temperature.
*   **Live Tank Map**: 10x10m grid visualization of the robot's current position and cleaning progress.
*   **Safety Overrides**: Emergency Stop and Manual/Autonomous toggle.

### 2. Mission Intelligence
*   **Data Analytics**: Visual representation of sensor trends and historical performance.
*   **Sludge Density Heatmaps**: AI-generated maps showing high-density zones for prioritized cleaning.
*   **Efficiency Metrics**: Real-time calculation of cleaning speed and battery optimization.

### 3. AI Deep Dive
*   **Visual Sludge Density Detection**: Multimodal vision analysis for sludge categorization.
*   **Sensor-Fusion Hardness Classification**: Fusing electrical and mechanical data to determine sludge structural integrity.
*   **Adaptive Vibration Control**: Dynamic tuning of the ERM vibrating plate for optimal breakup.
*   **Intelligent Path Optimization**: Reinforcement learning-inspired route planning.

### 4. Simulations
*   **Operational Scenarios**: Test the AI's response to Heavy Sludge, Gas Emergencies, Sinking Risks, and Predictive Maintenance alerts.
*   **Real-time Visualizer**: Interactive simulation environment showing sensor reactions and AI decision logic.

### 5. Technical Spec (Presentation)
*   **Problem Statement**: Highlighting the hazards of manual STP cleaning.
*   **Solution Architecture**: Deep dive into the hardware and software stack.
*   **AI Roadmap**: Future capabilities and scaling strategy.

## 🛠 Tech Stack

*   **Frontend**: React 19, TypeScript, Vite
*   **Styling**: Tailwind CSS (Mobile-first, high-contrast design)
*   **Animations**: Motion (formerly Framer Motion)
*   **Icons**: Lucide React
*   **AI Engine**: Gemini 3 Flash (via `@google/genai`)
*   **Data Visualization**: Recharts / D3.js

## 📦 Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd stp-ai-sludge-robot-control-center
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up environment variables**:
    Create a `.env` file and add your Gemini API key:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```

4.  **Start the development server**:
    ```bash
    npm run dev
    ```

## 📂 Project Structure

*   `/src/components`: Reusable UI components and dashboard pages.
*   `/src/services`: AI integration and telemetry processing logic.
*   `/src/types.ts`: Global TypeScript definitions and enums.
*   `/src/App.tsx`: Main application entry point and navigation logic.
*   `/src/index.css`: Global styles and Tailwind configuration.

## 🛡 Safety Notice

This application is a control interface for industrial robotics. All AI-driven decisions are validated by a hard-coded local heuristic safety layer to prevent mechanical failure or hazardous exposure.

---
**Documentation v4.0.2 // AquaVortex AI**
