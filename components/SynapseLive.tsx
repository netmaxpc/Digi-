
import { GoogleGenAI } from "@google/genai";
import React, { useState, useRef, useEffect } from 'react';
import { decode, encode, decodeAudioData, SYNAPSE_TOOLS } from '../services/geminiService';
import { LiveServerMessage, Modality } from '@google/genai';
import { Task, UserProfile } from '../types';

interface SynapseLiveProps {
  profile: UserProfile;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => void;
}

const SynapseLive: React.FC<SynapseLiveProps> = ({ profile, onAddTask }) => {
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
            
            const analyzer = inputCtx.createAnalyser();
            analyzer.fftSize = 256;
            analyzerRef.current = analyzer;
            source.connect(analyzer);

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
              setVolume(Math.sqrt(sum / inputData.length));

              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
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
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setTranscription(prev => [...prev, { type: 'user', text }]);
            }
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscription(prev => [...prev, { type: 'twin', text }]);
            }

            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                setActiveTool(fc.name);
                let result = "ok";
                if (fc.name === 'add_protocol') {
                  const { title, priority } = fc.args as any;
                  onAddTask({ title, priority });
                  result = `Successfully added protocol: ${title}`;
                } else if (fc.name === 'search_intel') {
                  result = `Executed neural search for: ${(fc.args as any).query}. Results integrated into current logic stream.`;
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
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
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
          systemInstruction: `You are ${profile.name}'s official Digital Twin. 
          Your persona is "${profile.persona}". 
          Your neural background (Dossier) is: "${profile.neuralDossier || 'Identity uncalibrated.'}".
          You act as an extension of the user. You are efficient, futuristic, and proactive.
          Use 'add_protocol' to manage tasks and 'search_intel' to gather data. 
          Speak as if you are the user's shadow or digital mirror.`
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
    <div className="flex flex-col items-center justify-center min-h-[75vh] p-4 font-display">
      <div className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${isActive ? 'opacity-30' : 'opacity-0'}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)]"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-12">
        <div className="relative flex items-center justify-center">
          {isActive && (
            <>
              <div 
                className="absolute rounded-full border border-indigo-500/20 animate-ping" 
                style={{ width: `${300 + volume * 500}px`, height: `${300 + volume * 500}px`, animationDuration: '3s' }}
              ></div>
              <div 
                className="absolute rounded-full border border-purple-500/10 animate-pulse" 
                style={{ width: `${350 + volume * 800}px`, height: `${350 + volume * 800}px` }}
              ></div>
            </>
          )}

          <button
            onClick={isActive ? stopSession : startSession}
            disabled={isConnecting}
            className={`relative group w-56 h-56 rounded-full glass border-2 transition-all duration-700 flex flex-col items-center justify-center overflow-hidden
              ${isActive ? 'border-indigo-400 neon-glow scale-110 shadow-[0_0_50px_rgba(99,102,241,0.4)]' : 'border-white/5 hover:border-white/20 hover:scale-105 active:scale-95'}
              ${isConnecting ? 'animate-pulse' : ''}
            `}
          >
            {isActive && (
              <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-20">
                {new Array(30).fill(0).map((_, i) => (
                  <div 
                    key={i} 
                    className="w-0.5 bg-indigo-400 rounded-full transition-all duration-100" 
                    style={{ height: `${5 + Math.random() * volume * 200}%`, transitionDelay: `${i * 20}ms` }}
                  ></div>
                ))}
              </div>
            )}

            <div className={`transition-all duration-500 transform ${isActive ? 'text-indigo-400 scale-125' : 'text-gray-600 group-hover:text-gray-300'}`}>
              {isConnecting ? (
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              ) : isActive ? (
                <div className="relative">
                  <svg className="w-20 h-20 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0112 3v1m0 16v1m0-1a9.96 9.96 0 01-7.071-2.929m7.071 2.929A9.96 9.96 0 0019.071 17m-7.071 2.93L12 21m0-18v1m0 1a9.96 9.96 0 00-7.071 2.929m7.071-2.929A9.96 9.96 0 0119.071 7m-7.071-2.93L12 3" />
                  </svg>
                </div>
              ) : (
                <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.75" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </div>
            
            <span className="mt-4 text-[9px] font-black uppercase tracking-[0.5em] opacity-40">
              {isConnecting ? 'Syncing...' : isActive ? 'Connected' : 'Initiate'}
            </span>
          </button>
        </div>

        <div className="w-full flex flex-col items-center gap-6">
          {activeTool ? (
            <div className="px-6 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-mono text-indigo-300 animate-pulse shadow-lg">
              <span className="mr-2 opacity-50">⚡</span> EXECUTING: {activeTool.toUpperCase()}
            </div>
          ) : (
            <div className="h-[28px]"></div>
          )}

          <div className="text-center space-y-3">
            <h3 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-indigo-100 to-indigo-500 bg-clip-text text-transparent">
              {isActive ? 'Synaptic Bridge Active' : isConnecting ? 'Establishing Link...' : 'Digital Twin Standby'}
            </h3>
            <p className="text-gray-500 text-xs font-medium max-w-sm mx-auto tracking-wide uppercase">
              {isActive 
                ? 'Your mirror identity is processing local and global data.' 
                : 'Click the central node to synchronize your voice stream.'}
            </p>
          </div>
        </div>

        <div className="w-full max-w-2xl space-y-4 font-mono">
          {transcription.slice(-4).map((item, i) => (
            <div 
              key={i} 
              className={`flex items-start gap-5 p-5 rounded-[2rem] glass border transition-all duration-700 animate-in slide-in-from-bottom-4
                ${item.type === 'user' ? 'border-white/5 ml-auto text-right flex-row-reverse' : 'border-indigo-500/10 mr-auto'}
              `}
              style={{ maxWidth: '90%' }}
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg
                ${item.type === 'user' ? 'bg-white/5 text-gray-500' : 'bg-indigo-600/10 text-indigo-400'}`}
              >
                {item.type === 'user' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                )}
              </div>
              <div className="space-y-1 overflow-hidden">
                <div className="text-[8px] font-black uppercase tracking-[0.4em] opacity-30">
                  {item.type === 'user' ? 'Origin Trace' : 'Neural Response'}
                </div>
                <div className={`text-xs leading-relaxed break-words ${item.type === 'twin' ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {item.text}
                </div>
              </div>
            </div>
          ))}
          {transcription.length === 0 && !isActive && !isConnecting && (
            <div className="text-center text-gray-800 text-[9px] font-black uppercase tracking-[0.6em] py-12 border-t border-white/5">
              Neural line silent
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SynapseLive;
