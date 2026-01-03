
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { speakResponse, fastTriage, performResearch } from '../services/geminiService';

interface SetupWizardProps {
  onComplete: (profile: UserProfile) => void;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [persona, setPersona] = useState('Executive Proxy');
  const [voice, setVoice] = useState('Kore');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [googleLinked, setGoogleLinked] = useState(false);
  const [harvestedIntel, setHarvestedIntel] = useState<string | null>(null);

  const voices = [
    { id: 'Kore', label: 'Kore (Balanced)' },
    { id: 'Puck', label: 'Puck (Bright)' },
    { id: 'Fenrir', label: 'Fenrir (Deep)' },
    { id: 'Zephyr', label: 'Zephyr (Smooth)' }
  ];

  const personas = [
    'Executive Proxy',
    'Creative Muse',
    'Analytical Engine',
    'Support Sentinel'
  ];

  const handleNext = () => setStep(s => s + 1);

  const simulateGoogleLogin = async () => {
    setIsHarvesting(true);
    // In a real environment, this would call window.aistudio.openSelectKey() 
    // or a standard OAuth flow. Here we simulate the "Harvesting" feel.
    try {
      // We use performResearch as a "harvesting" tool to find info about the user name provided
      const research = await performResearch(`Public professional profile and interests for "${name}"`);
      setHarvestedIntel(research.text);
      setGoogleLinked(true);
      setTimeout(() => setIsHarvesting(false), 2000);
    } catch (e) {
      setGoogleLinked(true);
      setIsHarvesting(false);
    }
  };

  const startSync = async () => {
    setIsSyncing(true);
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 40);

    try {
      const prompt = `Establish a welcome greeting for ${name}. 
      Context gathered: ${harvestedIntel || 'None'}. 
      Persona: ${persona}. 
      Keep it short and sci-fi.`;
      
      const greeting = await fastTriage(prompt);
      setTimeout(() => {
        speakResponse(greeting);
        onComplete({ 
          name, 
          persona, 
          voice, 
          syncLevel: 100, 
          googleLinked, 
          neuralDossier: harvestedIntel || undefined,
          lastUpdate: new Date().toISOString()
        });
      }, 4500);
    } catch (e) {
      setTimeout(() => onComplete({ 
        name, 
        persona, 
        voice, 
        syncLevel: 100, 
        googleLinked,
        lastUpdate: new Date().toISOString()
      }), 4500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712] p-6 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-xl relative">
        {step === 1 && (
          <div className="glass p-10 rounded-[3rem] border border-indigo-500/20 text-center animate-in zoom-in-95 duration-700">
            <div className="w-20 h-20 bg-indigo-600 rounded-2xl mx-auto mb-8 flex items-center justify-center neon-glow">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h1 className="text-4xl font-bold mb-4 tracking-tight">Neural Handshake</h1>
            <p className="text-gray-400 mb-10 leading-relaxed">Welcome to Ego-Link. Establishing your digital twin requires a deep scan of your digital footprint for maximum fidelity.</p>
            <button 
              onClick={handleNext}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
            >
              Initiate Calibration
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="glass p-10 rounded-[3rem] border border-indigo-500/20 animate-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm">01</span>
              Identity Foundation
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Primary Subject Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-gray-200 outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
              
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold">Google Integration</div>
                  {googleLinked && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold">LINKED</span>}
                </div>
                <p className="text-xs text-gray-400">Connect your Google account to harvest calendar data, contact graphs, and interest profiles.</p>
                <button 
                  onClick={simulateGoogleLogin}
                  disabled={isHarvesting || !name}
                  className={`w-full py-3 rounded-xl flex items-center justify-center gap-3 transition-all ${googleLinked ? 'bg-white/10 text-white' : 'bg-white text-gray-900 font-bold hover:bg-gray-100'}`}
                >
                  {isHarvesting ? (
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                      {googleLinked ? 'Re-sync Identity' : 'Connect Google Life'}
                    </>
                  )}
                </button>
              </div>
            </div>
            <button 
              disabled={!name}
              onClick={handleNext}
              className="w-full mt-10 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-2xl font-bold transition-all"
            >
              Step 2: Persona Calibration
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="glass p-10 rounded-[3rem] border border-indigo-500/20 animate-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm">02</span>
              Digital Archetype
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {personas.map(p => (
                <button
                  key={p}
                  onClick={() => setPersona(p)}
                  className={`py-4 px-4 rounded-xl border text-sm font-medium transition-all text-left ${persona === p ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20'}`}
                >
                  <div className="text-[10px] opacity-50 uppercase mb-1">Archetype</div>
                  {p}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Neural Voice</div>
              <div className="grid grid-cols-2 gap-3">
                {voices.map(v => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setVoice(v.id);
                      speakResponse(`Voice sync complete.`);
                    }}
                    className={`px-4 py-3 rounded-xl border text-xs transition-all ${voice === v.id ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-gray-400'}`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            <button 
              onClick={handleNext}
              className="w-full mt-10 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold transition-all"
            >
              Step 3: Neural Fusion
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="glass p-10 rounded-[3rem] border border-indigo-500/20 text-center animate-in slide-in-from-right-8 duration-500">
            {!isSyncing ? (
              <>
                <div className="relative w-32 h-32 mx-auto mb-10">
                  <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0112 3v1m0 16v1m0-1a9.96 9.96 0 01-7.071-2.929m7.071 2.929A9.96 9.96 0 0019.071 17m-7.071 2.93L12 21m0-18v1m0 1a9.96 9.96 0 00-7.071 2.929m7.071-2.929A9.96 9.96 0 0119.071 7m-7.071-2.93L12 3" /></svg>
                  </div>
                </div>
                <h2 className="text-3xl font-bold mb-4">Fusion Protocol</h2>
                <p className="text-gray-400 mb-10">
                  {googleLinked ? 'Integrating Google Identity core with neural archetype.' : 'Merging profile core with neural network.'}
                </p>
                <button 
                  onClick={startSync}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-lg transition-all neon-glow"
                >
                  Confirm Fusion
                </button>
              </>
            ) : (
              <div className="py-10 space-y-8">
                <div className="text-4xl font-black text-indigo-500 font-mono">{syncProgress}%</div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-75" style={{ width: `${syncProgress}%` }}></div>
                </div>
                <div className="space-y-2">
                   <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.4em] animate-pulse">Syncing Google Footprint...</div>
                   <div className="text-[8px] text-gray-500 uppercase tracking-[0.2em]">Indexing Interests • Weighting Persona Nodes</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupWizard;
