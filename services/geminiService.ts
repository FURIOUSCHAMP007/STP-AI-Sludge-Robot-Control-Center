
import { GoogleGenAI, Type } from "@google/genai";
import { SludgeLevel, SludgeHardness, RiskLevel, AIAnalysis, SensorData, VisionAnalysis } from "../types";

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
    highDensityZones: predictedSludgeThickness > 30 ? ["A1", "C3", "E5"] : [],
    targetVibrationFrequency,
    targetVibrationAmplitude,
    optimizedPath,
    coveragePercentage: 45,
    estimatedTimeRemaining: 25,
    maintenanceScore,
    predictedFailureDays: Math.floor(maintenanceScore / 5),
    anomalyDetected,
    confidence: 85,
    command: { device: "motors", action: isStuck ? "backward" : "stop", speed: 0.5 }
  };
}

/**
 * Vision Layer: Analyzes the camera frame to understand the environment.
 */
async function analyzeVision(imageBytes: string, apiKey: string): Promise<VisionAnalysis> {
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const systemInstruction = `
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
  `;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: "Analyze this STP tank frame." },
        { inlineData: { mimeType: "image/jpeg", data: imageBytes } }
      ]
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          objects: { type: Type.ARRAY, items: { type: Type.STRING } },
          sludge_level: { type: Type.STRING, enum: ["low", "medium", "high"] },
          environment: { type: Type.STRING },
          risk_level: { type: Type.STRING, enum: ["low", "medium", "high"] }
        },
        required: ["objects", "sludge_level", "environment", "risk_level"]
      }
    }
  });

  return JSON.parse(response.text) as VisionAnalysis;
}

/**
 * Decision Layer: Combines sensor telemetry and vision analysis to decide the next command.
 */
async function makeDecision(
  sensors: SensorData[],
  vision: VisionAnalysis | null,
  apiKey: string
): Promise<AIAnalysis> {
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const systemInstruction = `
    You are the autonomous AI brain of an STP (Sewage Treatment Plant) sludge-clearing robot.
    Your job is to read sensor data and vision analysis to output movement commands.
    
    **Your Sensors:**
    - distance_cm: Distance to the wall/obstacle in front of you. (Stop if < 25cm).
    - ir_left / ir_right: Edge/obstacle detection (0 = clear, 1 = obstacle detected).
    - gas_raw: Combustible gas levels (0.0 to 1.0). If > 0.6, stop immediately and raise bucket.
    
    **Your Commands:**
    You must respond with a JSON object that includes a 'command' field.
    
    *To drive:* {"device": "motors", "action": "forward|backward|left|right|stop", "speed": 0.5} (Speed max is 1.0).
    *To lift bucket:* {"device": "bucket", "angle": 120} (Angle is 0 to 180. 10 is down, 180 is fully up).
    
    Analyze the telemetry and vision to send the safest, most logical next move.
  `;

  const prompt = `
    Sensor Data: ${JSON.stringify(sensors.slice(-5))}
    Vision Analysis: ${JSON.stringify(vision)}
    
    Decide the safest and most efficient action.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
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
          confidence: { type: Type.NUMBER },
          command: {
            type: Type.OBJECT,
            properties: {
              device: { type: Type.STRING },
              action: { type: Type.STRING },
              speed: { type: Type.NUMBER },
              angle: { type: Type.NUMBER }
            },
            required: ["device", "action", "speed"]
          },
          reason: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ["low", "medium", "high"] }
        },
        required: [
          "sludgeLevel", "sludgeHardness", "gasRisk", "isStuck", "recommendation", 
          "predictedSludgeThickness", "sludgeVolumeEstimate", "highDensityZones", 
          "targetVibrationFrequency", "targetVibrationAmplitude", "optimizedPath", 
          "coveragePercentage", "estimatedTimeRemaining", "maintenanceScore", 
          "predictedFailureDays", "anomalyDetected", "confidence", "command", 
          "reason", "priority"
        ]
      }
    }
  });

  const result = JSON.parse(response.text) as AIAnalysis;
  if (vision) result.vision = vision;
  return result;
}

export async function analyzeRobotState(
  imageBytes: string | null,
  sensors: SensorData[]
): Promise<AIAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key is missing. Falling back to Local Heuristic Engine.");
    return getLocalHeuristicAnalysis(sensors);
  }

  try {
    let vision: VisionAnalysis | null = null;
    if (imageBytes) {
      try {
        vision = await analyzeVision(imageBytes, apiKey);
      } catch (vErr) {
        console.error("Vision Analysis failed, continuing with sensors only:", vErr);
      }
    }

    return await makeDecision(sensors, vision, apiKey);
  } catch (err: any) {
    const errorMessage = err?.message || "";
    const isQuotaError = errorMessage.includes("429") || errorMessage.includes("RESOURCE EXHAUSTED") || errorMessage.includes("quota");

    if (isQuotaError) {
      console.warn("Gemini AI Quota Exceeded. Switching to Local Heuristic Engine.");
    } else {
      console.error("Gemini AI API Error:", err);
    }
    
    return getLocalHeuristicAnalysis(sensors);
  }
}
