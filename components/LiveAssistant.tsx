
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { Mic, MicOff, Volume2, VolumeX, Camera, CameraOff, X, MessageSquare, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LiveAssistantProps {
  onClose: () => void;
}

export const LiveAssistant: React.FC<LiveAssistantProps> = ({ onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [transcription, setTranscription] = useState<string>("");
  const [modelTranscription, setModelTranscription] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);

  // Initialize Audio Context
  const initAudio = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  };

  // Play audio chunks from the model
  const playQueuedAudio = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0 || !audioContextRef.current) return;

    isPlayingRef.current = true;
    const ctx = audioContextRef.current;

    while (audioQueueRef.current.length > 0) {
      const pcmData = audioQueueRef.current.shift()!;
      const audioBuffer = ctx.createBuffer(1, pcmData.length, 16000);
      const channelData = audioBuffer.getChannelData(0);
      
      // Convert Int16 to Float32
      for (let i = 0; i < pcmData.length; i++) {
        channelData[i] = pcmData[i] / 32768.0;
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      await new Promise<void>((resolve) => {
        source.onended = () => resolve();
        source.start();
      });
    }

    isPlayingRef.current = false;
  }, []);

  const startSession = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      await initAudio();

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });
      
      const session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are the AquaVortex AI Assistant. You help operators manage sludge cleaning robots. You can see through their camera and hear their voice. Be concise, technical, and helpful. If you see sludge, analyze its density and hardness.",
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            startStreaming();
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  const binaryString = atob(part.inlineData.data);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  const pcmData = new Int16Array(bytes.buffer);
                  audioQueueRef.current.push(pcmData);
                  playQueuedAudio();
                }
              }
            }

            // Handle Transcriptions
            if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
               setModelTranscription(prev => prev + " " + message.serverContent?.modelTurn?.parts?.[0]?.text);
            }

            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
              isPlayingRef.current = false;
            }
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setError("Connection error. Please try again.");
            stopSession();
          },
          onclose: () => {
            stopSession();
          }
        }
      });

      sessionRef.current = session;
    } catch (err) {
      console.error("Failed to start session:", err);
      setError("Failed to initialize AI session.");
      setIsConnecting(false);
    }
  };

  const startStreaming = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isCameraOn ? { width: 640, height: 480 } : false,
      });
      streamRef.current = stream;

      if (isCameraOn && videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Audio Processing
      const source = audioContextRef.current!.createMediaStreamSource(stream);
      const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (isMuted || !sessionRef.current) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16 PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        sessionRef.current.sendRealtimeInput({
          audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
        });
      };

      source.connect(processor);
      processor.connect(audioContextRef.current!.destination);
      processorRef.current = processor;

      // Video Streaming Loop
      if (isCameraOn) {
        const sendFrame = () => {
          if (!isActive || !isCameraOn || !sessionRef.current || !canvasRef.current || !videoRef.current) return;
          
          const canvas = canvasRef.current;
          const video = videoRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const base64Data = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
            sessionRef.current.sendRealtimeInput({
              video: { data: base64Data, mimeType: 'image/jpeg' }
            });
          }
          setTimeout(sendFrame, 500); // 2 FPS for vision
        };
        sendFrame();
      }

    } catch (err) {
      console.error("Streaming error:", err);
      setError("Microphone/Camera access denied.");
    }
  };

  const stopSession = () => {
    setIsActive(false);
    setIsConnecting(false);
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed bottom-24 right-8 w-96 bg-gray-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col"
    >
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`} />
          <h3 className="text-sm font-bold text-gray-100 uppercase tracking-widest">AquaVortex Live AI</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 flex flex-col space-y-6 min-h-[300px]">
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-lg text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          {isCameraOn ? (
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-gray-700">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} width={320} height={240} className="hidden" />
            </div>
          ) : (
            <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-emerald-500/20 scale-110' : 'bg-gray-800'}`}>
              <MessageSquare size={40} className={isActive ? 'text-emerald-500' : 'text-gray-600'} />
            </div>
          )}
          
          <div className="text-center">
            <p className="text-gray-300 text-sm font-medium">
              {isConnecting ? "Establishing secure link..." : isActive ? "AI Link Active" : "Ready for voice/vision analysis"}
            </p>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-1">
              {isActive ? "Streaming 16kHz PCM / 2FPS Vision" : "Click start to begin session"}
            </p>
          </div>
        </div>

        {/* Transcriptions */}
        {(transcription || modelTranscription) && (
          <div className="bg-black/40 rounded-xl p-4 max-h-32 overflow-y-auto custom-scrollbar space-y-2">
            {transcription && (
              <p className="text-xs text-gray-400 italic">You: {transcription}</p>
            )}
            {modelTranscription && (
              <p className="text-xs text-emerald-400">AI: {modelTranscription}</p>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => setIsMuted(!isMuted)}
            disabled={!isActive}
            className={`p-3 rounded-full transition-all ${isMuted ? 'bg-red-900/40 text-red-500' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          
          <button
            onClick={isActive ? stopSession : startSession}
            disabled={isConnecting}
            className={`px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs transition-all flex items-center space-x-2 ${
              isActive 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isConnecting ? <Loader2 className="animate-spin" size={16} /> : isActive ? "End Session" : "Start Live Link"}
          </button>

          <button
            onClick={() => setIsCameraOn(!isCameraOn)}
            className={`p-3 rounded-full transition-all ${isCameraOn ? 'bg-blue-900/40 text-blue-500' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            {isCameraOn ? <Camera size={20} /> : <CameraOff size={20} />}
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-gray-950 p-3 text-[8px] text-gray-600 flex justify-between uppercase tracking-tighter">
        <span>Model: Gemini 2.5 Flash Live</span>
        <span>Latency: ~250ms</span>
      </div>
    </motion.div>
  );
};
