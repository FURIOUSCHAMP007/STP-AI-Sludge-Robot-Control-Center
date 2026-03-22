
import { GoogleGenAI, Type } from "@google/genai";
import { SludgeLevel, SludgeHardness, RiskLevel, AIAnalysis, SensorData } from "../types";

// Lazy initialization inside analyzeRobotState

/**
 * Local fallback logic to provide basic insights when the AI API is unavailable (e.g., Quota Exceeded).
 */
function getLocalHeuristicAnalysis(sensors: SensorData[]): AIAnalysis {
  const latest = sensors[sensors.length - 1] || { 
    h2s: 0, methane: 0, motorCurrent: 0.8, battery: 100, ultrasonicReading: 50, tankDepth: 100,
    vibrationFrequency: 10, torqueFeedback: 5, position: { x: 0, y: 0 },
    batteryVoltage: 24, temperature: 35
  };
  
  // Basic heuristics based on sensor thresholds
  let sludgeLevel = SludgeLevel.LOW;
  if (latest.motorCurrent > 1.6) sludgeLevel = SludgeLevel.HIGH;
  else if (latest.motorCurrent > 1.2) sludgeLevel = SludgeLevel.MEDIUM;

  let sludgeHardness = SludgeHardness.SOFT;
  if (latest.torqueFeedback > 15 || latest.vibrationFrequency > 40) sludgeHardness = SludgeHardness.HARD;
  else if (latest.torqueFeedback > 8 || latest.vibrationFrequency > 20) sludgeHardness = SludgeHardness.MEDIUM;

  let gasRisk = RiskLevel.LOW;
  if (latest.h2s > 12 || latest.methane > 90) gasRisk = RiskLevel.HIGH;
  else if (latest.h2s > 6 || latest.methane > 45) gasRisk = RiskLevel.MEDIUM;

  const isStuck = latest.motorCurrent > 2.2;

  // Sludge thickness prediction heuristic
  const predictedSludgeThickness = Math.max(0, latest.tankDepth - latest.ultrasonicReading);
  const sludgeVolumeEstimate = (predictedSludgeThickness / 100) * 50; // assuming 50m2 tank area

  // Adaptive Vibration Control Heuristic
  let targetVibrationFrequency = 15;
  let targetVibrationAmplitude = 30;
  if (sludgeHardness === SludgeHardness.HARD) {
    targetVibrationFrequency = 45;
    targetVibrationAmplitude = 80;
  } else if (sludgeHardness === SludgeHardness.MEDIUM) {
    targetVibrationFrequency = 30;
    targetVibrationAmplitude = 50;
  }

  // Path Optimization Heuristic (Simple spiral out)
  const optimizedPath = [
    { x: 2, y: 2 }, { x: 8, y: 2 }, { x: 8, y: 8 }, { x: 2, y: 8 }, { x: 4, y: 4 }
  ];

  // Predictive Maintenance Heuristic
  let maintenanceScore = 95;
  if (latest.temperature > 50) maintenanceScore -= 20;
  if (latest.motorCurrent > 1.8) maintenanceScore -= 10;
  if (latest.batteryVoltage < 22) maintenanceScore -= 15;
  
  const anomalyDetected = latest.temperature > 60 || latest.motorCurrent > 2.5;

  let recommendation = "Local Heuristic active. Monitoring flow patterns.";
  if (isStuck) recommendation = "CRITICAL: High motor load detected. Reverse immediately.";
  else if (sludgeHardness === SludgeHardness.HARD) recommendation = "WARNING: Hardened sludge detected. Adaptive vibration control activated for deep breakup.";
  else if (gasRisk === RiskLevel.HIGH) recommendation = "DANGER: Gas levels critical. Activate extraction and retreat.";
  else if (latest.battery < 20) recommendation = "Battery low. Return to docking station.";
  else if (anomalyDetected) recommendation = "MAINTENANCE ALERT: Abnormal thermal/load pattern detected. Schedule inspection.";

  return {
    sludgeLevel,
    sludgeHardness,
    gasRisk,
    isStuck,
    recommendation: `[LOCAL ENGINE] ${recommendation}`,
    targetZone: "AUTO LOCAL",
    predictedSludgeThickness,
    sludgeVolumeEstimate,
    highDensityZones: predictedSludgeThickness > 30 ? ["Zone A", "Zone C"] : ["None"],
    targetVibrationFrequency,
    targetVibrationAmplitude,
    optimizedPath,
    coveragePercentage: 45,
    estimatedTimeRemaining: 25,
    maintenanceScore,
    predictedFailureDays: Math.floor(maintenanceScore / 5),
    anomalyDetected,
    confidence: 85
  };
}

export async function analyzeRobotState(
  imageBytes: string | null,
  sensors: SensorData[]
): Promise<AIAnalysis> {
  const apiKey = process.env.APIKEY;
  if (!apiKey) {
    console.warn("Gemini API Key is missing. Falling back to Local Heuristic Engine.");
    return getLocalHeuristicAnalysis(sensors);
  }
  
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";
  
  const sensorContext = sensors.slice(-15).map(s => ({
    h2s: s.isOffline ? 'OFFLINE' : s.h2s,
    ch4: s.isOffline ? 'OFFLINE' : s.methane,
    current: s.motorCurrent,
    tilt: s.tilt,
    battery: s.battery,
    voltage: s.batteryVoltage,
    temp: s.temperature,
    ultrasonic: s.ultrasonicReading,
    vibration: s.vibrationFrequency,
    torque: s.torqueFeedback,
    pos: s.position
  }));

  const systemInstruction = `
    You are an AI decision engine for an autonomous sewage treatment plant (STP) sludge cleaning robot called AquaVortex AI.
    Your role is to analyze real-time sensor data and output structured decisions for robot control and system intelligence.

    SYSTEM CONTEXT:
    - The robot operates inside STP tanks.
    - It floats and moves using DC motors.
    - It breaks sludge using a vibrating plate.
    - It removes sludge using a suction pump.

    AVAILABLE SENSOR INPUTS:
    1. Ultrasonic distance (cm) → sludge depth
    2. Motor current (amps) → resistance / hardness
    3. Vibration feedback (Hz)
    4. Battery voltage (V)
    5. Temperature (°C)
    6. IMU tilt angle (degrees)

    YOUR TASKS:
    1. Analyze sludge condition (LOW, MEDIUM, HIGH density).
    2. Predict sludge thickness and density.
    3. Classify sludge hardness (SOFT, MEDIUM, HARD).
    4. Recommend cleaning actions (movement, vibration, suction).
    5. Detect anomalies or risks (MOTOR OVERLOAD, LOW BATTERY, INSTABILITY).
    6. Intelligent Cleaning Path Optimization: Next 5-8 coordinates (x, y), coverage %, time remaining.
    7. Predictive Maintenance Model: health score (0-100), days until failure, anomaly detection.
    8. Confidence Score: Provide a confidence percentage (0-100) for the overall analysis.

    RULES:
    - If sludge thickness > 40 cm → HIGH density
    - If motor current is high (> 1.6A) → HARD sludge
    - - If battery < 11V → LOW BATTERY alert
    - If tilt angle > 20° → INSTABILITY alert
    - Optimize for minimum energy and maximum cleaning efficiency.
  `;

  const prompt = `
    Visual Data: Current camera frame from the sewage tank.
    Sensor History (last 15 ticks): ${JSON.stringify(sensorContext)}
    
    Current Tank Depth: 100 cm.
  `;

  const maxRetries = 2;
  let retryCount = 0;

  async function attemptAnalysis(): Promise<AIAnalysis> {
    try {
      const contents: any[] = [{ text: prompt }];
      
      if (imageBytes) {
        contents.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBytes
          }
        });
      }

      const response = await ai.models.generateContent({
        model,
        contents: { parts: contents },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sludgeLevel: { type: Type.STRING, enum: Object.values(SludgeLevel) },
              sludgeHardness: { type: Type.STRING, enum: Object.values(SludgeHardness) },
              gasRisk: { type: Type.STRING, enum: Object.values(RiskLevel) },
              isStuck: { type: Type.BOOLEAN },
              recommendation: { type: Type.STRING },
              targetZone: { type: Type.STRING },
              predictedSludgeThickness: { type: Type.NUMBER },
              sludgeVolumeEstimate: { type: Type.NUMBER },
              highDensityZones: { type: Type.ARRAY, items: { type: Type.STRING } },
              targetVibrationFrequency: { type: Type.NUMBER },
              targetVibrationAmplitude: { type: Type.NUMBER },
              optimizedPath: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER }
                  },
                  required: ["x", "y"]
                }
              },
              coveragePercentage: { type: Type.NUMBER },
              estimatedTimeRemaining: { type: Type.NUMBER },
              maintenanceScore: { type: Type.NUMBER },
              predictedFailureDays: { type: Type.NUMBER },
              anomalyDetected: { type: Type.BOOLEAN },
              confidence: { type: Type.NUMBER }
            },
            required: ["sludgeLevel", "sludgeHardness", "gasRisk", "isStuck", "recommendation", "predictedSludgeThickness", "sludgeVolumeEstimate", "highDensityZones", "targetVibrationFrequency", "targetVibrationAmplitude", "optimizedPath", "coveragePercentage", "estimatedTimeRemaining", "maintenanceScore", "predictedFailureDays", "anomalyDetected", "confidence"]
          }
        }
      });

      if (!response.text) {
        throw new Error("Empty response from AI");
      }

      return JSON.parse(response.text) as AIAnalysis;
    } catch (err: any) {
      const errorMessage = err?.message || "";
      const isQuotaError = errorMessage.includes("429") || errorMessage.includes("RESOURCE EXHAUSTED") || errorMessage.includes("quota");

      if (isQuotaError && retryCount < maxRetries) {
        retryCount++;
        const delay = Math.pow(2, retryCount) * 1000; // 2s, 4s
        console.warn(`AI Quota exceeded. Retrying in ${delay}ms (Attempt ${retryCount}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return attemptAnalysis();
      }

      throw err;
    }
  }

  try {
    return await attemptAnalysis();
  } catch (err: any) {
    const errorMessage = err?.message || "";
    const isQuotaError = errorMessage.includes("429") || errorMessage.includes("RESOURCE EXHAUSTED") || errorMessage.includes("quota");

    if (isQuotaError) {
      console.warn("Gemini AI Quota Exceeded. Switching to Local Heuristic Engine.");
    } else {
      console.error("Gemini AI API Error:", err);
    }
    
    // Return local heuristic analysis as a fallback to keep the app functional
    return getLocalHeuristicAnalysis(sensors);
  }
}
