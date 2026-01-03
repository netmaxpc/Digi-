
import { GoogleGenAI } from "@google/genai";
import React, { useState, useRef, useEffect } from 'react';
import { decode, encode, decodeAudioData, SYNAPSE_TOOLS, fastTriage } from '../services/geminiService';
import { LiveServerMessage, Modality } from '@google/genai';
import { Task, UserProfile } from '../types';

interface ActivityLog {
  id: string;
  type: 'protocol' | 'intel' | 'sync';
  title: string;
  detail: string;
  time: string;
}

interface SynapseLiveProps {
  profile: UserProfile;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
}

const SynapseLive: React.FC<SynapseLiveProps> = ({ profile, onAddTask, onUpdateProfile }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState<{ type: 'user' | 'twin', text: string }[]>([]);
  const [volume, setVolume] = useState(0);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const currentConversationRef = useRef<string[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  const startSession = async () => {
    if (isConnecting || isActive) return;
    setIsConnecting(true);
    currentConversationRef.current = [];
    setTranscription([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      inputAudioContextRef.current = inputCtx;
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
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Simple volume meter
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
            // Handle Transcriptions
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setTranscription(prev => [...prev, { type: 'user', text }]);
              currentConversationRef.current.push(`User: ${text}`);
            }
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscription(prev => [...prev, { type: 'twin', text }]);
              currentConversationRef.current.push(`Twin: ${text}`);
            }

            // Handle Tool Calls
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                let result = "ok";
                if (fc.name === 'add_protocol') {
                  const { title, priority } = fc.args as any;
                  onAddTask({ title, priority });
                  result = `Task "${title}" added to your list.`;
                  
                  // Detailed Activity Log
                  setActivityLogs(prev => [{
                    id: fc.id,
                    type: 'protocol',
                    title: 'New Protocol Active',
                    detail: `Added: "${title}" (Priority Level ${priority})`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }, ...prev]);
                } else if (fc.name === 'search_intel') {
                  const { query } = fc.args as any;
                  result = `I've started searching for information about "${query}".`;
                  setActivityLogs(prev => [{
                    id: fc.id,
                    type: 'intel',
                    title: 'Neural Web Search',
                    detail: `Query: "${query}"`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }, ...prev]);
                }
                
                sessionPromise.then(session => {
                  session.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result } }
                  });
                });
              }
            }

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const buffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              
              const now = outputCtx.currentTime;
              const playTime = Math.max(nextStartTimeRef.current, now);
              source.start(playTime);
              nextStartTimeRef.current = playTime + buffer.duration;
              
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            // Handle Interruptions
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error("Voice link error:", e);
            stopSession();
          },
          onclose: () => {
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: profile.voice || 'Zephyr' } }
          },
          tools: [{ functionDeclarations: SYNAPSE_TOOLS }],
          systemInstruction: `You are ${profile.name}'s Digital Twin. 
          Your persona: "${profile.persona}". 
          Personal memories: "${profile.memories?.join('; ') || 'No memories yet.'}".
          Identity context: "${profile.neuralDossier || 'No profile data yet.'}".
          ${profile.isVoiceCloned ? "I am using your cloned voice profile to speak with you." : ""}
          Always speak like ${profile.name}'s helpful reflection. Be natural, casual, and supportive. 
          Observe and learn from this conversation to adapt to ${profile.name}'s life patterns. 
          Use 'add_protocol' to save tasks or reminders discussed. If the user gives a command, execute it immediately using available tools.`
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      console.error("Could not start voice session:", err);
      setIsConnecting(false);
    }
  };

  const stopSession = async () => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close());
      sessionPromiseRef.current = null;
    }
    
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }

    setIsActive(false);
    setIsConnecting(false);
    setVolume(0);

    if (currentConversationRef.current.length > 2) {
      try {
        const memoryPrompt = `Analyze this conversation between ${profile.name} and their Digital Twin. 
        Extract any new facts, preferences, or tasks learned about ${profile.name}.
        Respond with 1-2 short bullet points representing "New Memories".
        CONVERSATION:
        ${currentConversationRef.current.join('\n')}`;
        
        const summary = await fastTriage(memoryPrompt);
        if (summary && summary.length > 5) {
          onUpdateProfile({ 
            memories: [...(profile.memories || []), summary.trim()]
          });
          setActivityLogs(prev => [{
            id: Math.random().toString(),
            type: 'sync',
            title: 'Neural Update Complete',
            detail: `Synced new memories: "${summary.trim()}"`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }, ...prev]);
        }
      } catch (e) {
        console.warn("Learning cycle skipped", e);
      }
    }
  };

  const suggestedCommands = [
    "Add a task: Plan my weekend",
    "What do you remember about our last chat?",
    "Give me advice on my project",
    "Remind me to call the dentist tomorrow"
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center min-h-[70vh] p-4 font-display">
      
      {/* Left Column: Interaction & Transcription */}
      <div className="flex-1 w-full max-w-2xl flex flex-col items-center gap-10">
        <div className="relative">
          {isActive && (
            <div 
              className="absolute rounded-full border border-indigo-500/20 animate-ping" 
              style={{ width: `${240 + volume * 900}px`, height: `${240 + volume * 900}px`, animationDuration: '1.5s' }}
            ></div>
          )}

          <button
            onClick={isActive ? stopSession : startSession}
            disabled={isConnecting}
            className={`relative w-48 h-48 rounded-full glass border-2 transition-all duration-500 flex flex-col items-center justify-center overflow-hidden z-20
              ${isActive ? 'border-indigo-400 scale-105 shadow-[0_0_50px_rgba(99,102,241,0.3)]' : 'border-white/10 hover:border-white/30 hover:scale-105 active:scale-95'}
              ${isConnecting ? 'animate-pulse opacity-50' : ''}
            `}
          >
            {profile.avatar ? (
              <img src={profile.avatar} className={`absolute inset-0 w-full h-full object-cover rounded-full opacity-30 transition-opacity ${isActive ? 'opacity-60' : ''}`} />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10"></div>
            )}
            
            <div className={`z-10 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
              <svg className={`w-16 h-16 ${isActive ? 'text-indigo-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <span className="mt-3 text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400 z-10">
              {isActive ? 'Active' : isConnecting ? 'Linking' : 'Speak'}
            </span>
          </button>
        </div>

        <div className="text-center space-y-3">
          <h3 className="text-3xl font-bold tracking-tight">
            {isActive ? "Ready for Commands" : isConnecting ? "Establishing Neural Link..." : "Voice Command Hub"}
          </h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Speak naturally to your twin. I can manage tasks, search for info, and learn your habits.
          </p>
        </div>

        <div className="w-full space-y-3 mt-4">
          {transcription.slice(-4).map((item, i) => (
            <div 
              key={i} 
              className={`flex flex-col p-5 rounded-[1.5rem] glass border animate-in slide-in-from-bottom-3 duration-300
                ${item.type === 'user' ? 'border-white/5 ml-12 items-end text-right' : 'border-indigo-500/10 mr-12 items-start'}
              `}
            >
              <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">
                {item.type === 'user' ? 'Input Stream' : 'Neural Response'}
              </div>
              <div className={`text-sm leading-relaxed ${item.type === 'twin' ? 'text-indigo-200' : 'text-gray-200'}`}>
                {item.text}
              </div>
            </div>
          ))}
          {transcription.length === 0 && !isActive && !isConnecting && (
            <div className="text-center text-gray-800 text-[10px] font-black uppercase tracking-[0.5em] py-12 border border-dashed border-white/5 rounded-[2rem]">
              Awaiting Neural Input
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Neural Activity Log & Status */}
      <div className="w-full lg:w-80 space-y-6">
        <div className="glass rounded-[2rem] p-6 border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Neural Activity Log</h4>
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
          </div>
          
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {activityLogs.map((log) => (
              <div key={log.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 animate-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between items-start mb-1">
                  <div className={`text-[9px] font-black uppercase tracking-widest ${
                    log.type === 'protocol' ? 'text-green-400' : log.type === 'intel' ? 'text-indigo-400' : 'text-purple-400'
                  }`}>
                    {log.title}
                  </div>
                  <div className="text-[8px] text-gray-600">{log.time}</div>
                </div>
                <div className="text-xs text-gray-300 leading-tight">{log.detail}</div>
              </div>
            ))}
            {activityLogs.length === 0 && (
              <div className="text-center py-10">
                <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest italic">No session activity yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass rounded-[2rem] p-6 border border-white/5 space-y-6">
          <div className="flex items-center gap-3 text-indigo-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h4 className="text-xs font-bold uppercase tracking-widest">Voice Prompts</h4>
          </div>
          <div className="space-y-3">
            {suggestedCommands.map((cmd, i) => (
              <button 
                key={i} 
                onClick={() => {
                   if (!isActive) startSession();
                }}
                className="w-full text-left p-4 bg-white/5 border border-white/5 rounded-2xl text-[11px] text-gray-400 hover:text-white hover:border-indigo-500/30 hover:bg-white/10 transition-all leading-tight group"
              >
                <span className="block text-indigo-400/50 mb-1 group-hover:text-indigo-400 transition-colors">Prompt {i + 1}</span>
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default SynapseLive;
