
import { GoogleGenAI } from "@google/genai";
import React, { useState, useRef, useEffect } from 'react';
import { decode, encode, decodeAudioData, SYNAPSE_TOOLS } from '../services/geminiService';
import { LiveServerMessage, Modality } from '@google/genai';
import { Task } from '../types';

interface SynapseLiveProps {
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => void;
}

const SynapseLive: React.FC<SynapseLiveProps> = ({ onAddTask }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState<{ type: 'user' | 'twin', text: string }[]>([]);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const analyzerRef = useRef<AnalyserNode | null>(null);

  const startSession = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            // Setup volume analyzer
            const analyzer = inputCtx.createAnalyser();
            analyzer.fftSize = 256;
            analyzerRef.current = analyzer;
            source.connect(analyzer);

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Simple volume calculation for UI
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              setVolume(Math.sqrt(sum / inputData.length));

              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcription
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setTranscription(prev => [...prev, { type: 'user', text }]);
            }
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscription(prev => [...prev, { type: 'twin', text }]);
            }

            // Handle Tool Calls
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                setActiveTool(fc.name);
                let result = "ok";
                
                if (fc.name === 'add_protocol') {
                  const { title, priority } = fc.args as any;
                  onAddTask({ title, priority });
                  result = `Protocol "${title}" initialized in control center.`;
                } else if (fc.name === 'search_intel') {
                  result = `Neural search completed for query: ${ (fc.args as any).query }`;
                }

                sessionPromise.then(session => {
                  session.sendToolResponse({
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: { result },
                    }
                  });
                });
                
                setTimeout(() => setActiveTool(null), 3000);
              }
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const buffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              
              const playTime = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              source.start(playTime);
              nextStartTimeRef.current = playTime + buffer.duration;
              sourcesRef.current.add(source);
              
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error("Synapse error:", e);
            setIsActive(false);
            setIsConnecting(false);
          },
          onclose: () => {
            setIsActive(false);
            setIsConnecting(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          tools: [{ functionDeclarations: SYNAPSE_TOOLS }],
          systemInstruction: "You are the user's Digital Twin. You manage their tasks and research. Be concise, intelligent, and highly efficient. When the user asks to add something, use the add_protocol tool. When they ask for news or info, use search_intel."
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to connect to Synapse:", err);
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsActive(false);
    setVolume(0);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] p-4">
      {/* Background Pulse Effect */}
      <div className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${isActive ? 'opacity-20' : 'opacity-0'}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 to-transparent"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-12">
        {/* Interaction Orbit */}
        <div className="relative flex items-center justify-center">
          {/* Audio Rings */}
          {isActive && (
            <>
              <div 
                className="absolute rounded-full border border-indigo-500/30 animate-ping" 
                style={{ width: `${280 + volume * 400}px`, height: `${280 + volume * 400}px`, animationDuration: '2s' }}
              ></div>
              <div 
                className="absolute rounded-full border border-purple-500/20 animate-pulse" 
                style={{ width: `${320 + volume * 600}px`, height: `${320 + volume * 600}px` }}
              ></div>
            </>
          )}

          {/* Main Voice Input Button */}
          <button
            onClick={isActive ? stopSession : startSession}
            disabled={isConnecting}
            className={`relative group w-48 h-48 rounded-full glass border-2 transition-all duration-500 flex flex-col items-center justify-center overflow-hidden
              ${isActive ? 'border-indigo-400 neon-glow scale-110' : 'border-white/10 hover:border-white/30 hover:scale-105 active:scale-95'}
              ${isConnecting ? 'animate-pulse cursor-wait' : ''}
            `}
          >
            {/* Visualizer Background */}
            {isActive && (
              <div className="absolute inset-0 opacity-20 flex items-end justify-center gap-1 px-4 pb-8">
                {new Array(12).fill(0).map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1.5 bg-indigo-400 rounded-full transition-all duration-75" 
                    style={{ height: `${10 + Math.random() * volume * 100}%` }}
                  ></div>
                ))}
              </div>
            )}

            <div className={`transition-all duration-300 ${isActive ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
              {isConnecting ? (
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              ) : isActive ? (
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              ) : (
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
                </svg>
              )}
            </div>
            
            <span className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
              {isConnecting ? 'Syncing...' : isActive ? 'Active' : 'Speak'}
            </span>
          </button>
        </div>

        {/* Dynamic Context Panel */}
        <div className="w-full flex flex-col items-center gap-4">
          {activeTool && (
            <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-mono text-indigo-300 animate-bounce">
              <span className="mr-2 opacity-50">⚡</span> EXECUTING: {activeTool.toUpperCase()}
            </div>
          )}

          <div className="text-center space-y-2">
            <h3 className="text-xl font-medium tracking-tight">
              {isActive ? 'Neural Link Established' : isConnecting ? 'Initializing Synapse...' : 'Digital Twin Standby'}
            </h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              {isActive 
                ? 'Managing your protocols and intelligence streams in real-time.' 
                : 'Click the mic to begin voice-commanded life management.'}
            </p>
          </div>
        </div>

        {/* Transmission Feed */}
        <div className="w-full max-w-2xl space-y-3">
          {transcription.slice(-3).map((item, i) => (
            <div 
              key={i} 
              className={`flex items-start gap-4 p-4 rounded-2xl glass border transition-all duration-500 animate-in slide-in-from-bottom-2
                ${item.type === 'user' ? 'border-white/5 ml-auto text-right flex-row-reverse' : 'border-indigo-500/10 mr-auto'}
              `}
              style={{ maxWidth: '85%' }}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 
                ${item.type === 'user' ? 'bg-white/5 text-gray-400' : 'bg-indigo-600/20 text-indigo-400'}`}
              >
                {item.type === 'user' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                )}
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-30">
                  {item.type === 'user' ? 'Origin' : 'Twin Output'}
                </div>
                <div className={`text-sm leading-relaxed ${item.type === 'twin' ? 'text-indigo-100' : 'text-gray-400'}`}>
                  {item.text}
                </div>
              </div>
            </div>
          ))}
          {transcription.length === 0 && !isActive && !isConnecting && (
            <div className="text-center text-gray-600 text-[10px] uppercase tracking-widest py-8 border-t border-white/5">
              No recent transmissions
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SynapseLive;
