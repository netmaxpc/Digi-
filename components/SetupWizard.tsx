
import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { harvestIdentity, speakResponse, generateCreativeImage } from '../services/geminiService';

interface SetupWizardProps {
  onComplete: (profile: UserProfile) => void;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [persona, setPersona] = useState('Assistant');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarMode, setAvatarMode] = useState<'upload' | 'generate'>('upload');
  const [avatarPrompt, setAvatarPrompt] = useState('');
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  
  // Voice Cloning State
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [voiceMode, setVoiceMode] = useState<'preset' | 'clone'>('preset');
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const voices = [
    { id: 'Kore', label: 'Professional' },
    { id: 'Zephyr', label: 'Casual' },
    { id: 'Puck', label: 'Energetic' },
    { id: 'Charon', label: 'Calm' }
  ];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setRecordedBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!avatarPrompt.trim()) return;
    setIsGeneratingAvatar(true);
    try {
      const img = await generateCreativeImage(`A friendly, high-quality, professional face for a digital personal twin: ${avatarPrompt}`);
      if (img) setAvatar(img);
    } catch (err) {
      console.error("Avatar generation failed", err);
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleStartSync = async () => {
    setIsSyncing(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 1.5;
      if (progress >= 100) {
        clearInterval(interval);
        setSyncProgress(100);
      } else {
        setSyncProgress(progress);
      }
    }, 50);

    try {
      const dossier = await harvestIdentity(name);
      setTimeout(() => {
        const profile: UserProfile = {
          name,
          avatar: avatar || undefined,
          voice: selectedVoice,
          persona,
          syncLevel: recordedBlob ? 98 : 95,
          googleLinked: true,
          neuralDossier: dossier,
          lastUpdate: new Date().toISOString(),
          memories: [],
          isVoiceCloned: !!recordedBlob
        };
        speakResponse(`All set, ${name}. Your digital twin is ready and synced.`);
        onComplete(profile);
      }, 4000);
    } catch (e) {
      setTimeout(() => setIsSyncing(false), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0f] p-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#312e81_0%,transparent_50%)] opacity-20"></div>
      
      <div className="w-full max-w-xl relative">
        <div className="glass p-10 rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden">
          
          {step === 1 && (
            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
              <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">Create Your Digital Twin</h1>
                <p className="text-gray-400">Let's start with your name.</p>
              </div>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should I call you?"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-xl outline-none focus:border-indigo-500/50 transition-all text-center"
                autoFocus
              />
              <button 
                onClick={() => setStep(2)}
                disabled={!name}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-indigo-500/10"
              >
                Next Step
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Personalize Your Twin</h1>
                <p className="text-gray-400">Give your twin a look and a voice.</p>
              </div>
              
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-6">
                <div className="relative w-32 h-32 rounded-full border-2 border-indigo-500/20 bg-white/5 overflow-hidden flex items-center justify-center group shadow-xl shadow-indigo-500/10">
                  {avatar ? (
                    <img src={avatar} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  )}
                  {isGeneratingAvatar && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                <div className="w-full space-y-4">
                  <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                    <button 
                      onClick={() => setAvatarMode('upload')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${avatarMode === 'upload' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                      Upload Photo
                    </button>
                    <button 
                      onClick={() => setAvatarMode('generate')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${avatarMode === 'generate' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                      AI Create
                    </button>
                  </div>

                  {avatarMode === 'upload' ? (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all text-gray-300"
                    >
                      Choose from Files
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={avatarPrompt}
                        onChange={(e) => setAvatarPrompt(e.target.value)}
                        placeholder="Describe a look..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-indigo-500/50"
                      />
                      <button 
                        onClick={handleGenerateAvatar}
                        disabled={isGeneratingAvatar || !avatarPrompt.trim()}
                        className="px-4 py-2 bg-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-500 disabled:opacity-50 transition-all"
                      >
                        Create
                      </button>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                </div>
              </div>

              {/* Voice Cloning Section */}
              <div className="space-y-4 border-t border-white/5 pt-6">
                <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                  <button 
                    onClick={() => setVoiceMode('preset')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${voiceMode === 'preset' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'}`}
                  >
                    Select Voice
                  </button>
                  <button 
                    onClick={() => setVoiceMode('clone')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${voiceMode === 'clone' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'}`}
                  >
                    Clone My Voice
                  </button>
                </div>

                {voiceMode === 'preset' ? (
                  <div className="grid grid-cols-2 gap-3">
                    {voices.map(v => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVoice(v.id)}
                        className={`py-3 rounded-xl border text-sm font-medium transition-all ${selectedVoice === v.id ? 'bg-indigo-600 border-indigo-500' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center space-y-4">
                    <div className="flex flex-col items-center gap-3">
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'}`}
                      >
                        {isRecording ? (
                          <div className="w-4 h-4 bg-white rounded-sm"></div>
                        ) : (
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                        )}
                      </button>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        {isRecording ? `Recording... 00:${recordingTime.toString().padStart(2, '0')}` : recordedBlob ? 'Voice Sample Captured' : 'Record 5s of audio to clone'}
                      </div>
                    </div>
                    {recordedBlob && !isRecording && (
                      <div className="flex items-center justify-center gap-2">
                        <div className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-green-500/20">Cloning Successful</div>
                        <button onClick={() => setRecordedBlob(null)} className="text-[10px] text-gray-600 hover:text-gray-400 underline font-bold uppercase">Reset</button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button 
                onClick={() => setStep(3)}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-indigo-500/10"
              >
                Almost Done
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Link Your Life</h1>
                <p className="text-gray-400">We'll use your Google info to help your twin learn about you.</p>
              </div>
              
              {isSyncing ? (
                <div className="py-12 space-y-6 text-center">
                  <div className="text-5xl font-bold text-indigo-400">{Math.round(syncProgress)}%</div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${syncProgress}%` }} />
                  </div>
                  <p className="text-sm text-gray-500 animate-pulse uppercase tracking-widest font-bold">Syncing neural patterns...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-8 bg-white/5 rounded-3xl border border-white/10 text-center space-y-4">
                    <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center">
                      <svg className="w-8 h-8" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Connect Google</h3>
                      <p className="text-xs text-gray-500">I'll sync with your calendar and mail to stay updated.</p>
                    </div>
                    <button 
                      onClick={handleStartSync}
                      className="w-full py-4 bg-white text-gray-900 rounded-2xl font-bold hover:bg-gray-100 transition-all shadow-lg"
                    >
                      Connect & Finish
                    </button>
                  </div>
                  <button onClick={() => onComplete({ name, persona: 'Assistant', voice: selectedVoice, syncLevel: 50, googleLinked: false, lastUpdate: new Date().toISOString() })} className="w-full text-center text-xs text-gray-500 underline uppercase font-bold tracking-widest">Skip for now</button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
