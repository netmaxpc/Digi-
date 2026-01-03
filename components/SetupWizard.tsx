
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { harvestIdentity, speakResponse } from '../services/geminiService';

interface SetupWizardProps {
  onComplete: (profile: UserProfile) => void;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [persona, setPersona] = useState('Analyst');
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [harvestProgress, setHarvestProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Initializing Neural Core...');

  const steps = [
    { id: 1, label: 'Identity' },
    { id: 2, label: 'Footprint' },
    { id: 3, label: 'Archetype' },
    { id: 4, label: 'Fusion' }
  ];

  const handleGoogleConnect = async () => {
    setIsHarvesting(true);
    setStatusMessage('Establishing Google Identity Link...');
    
    // Smooth progress simulation for the harvesting phase
    const interval = setInterval(() => {
      setHarvestProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 0.8;
      });
    }, 50);

    // Actual background harvesting using Gemini
    try {
      const dossier = await harvestIdentity(name);
      setTimeout(() => {
        setIsHarvesting(false);
        setStep(3);
      }, 5000);
    } catch (e) {
      setTimeout(() => {
        setIsHarvesting(false);
        setStep(3);
      }, 5000);
    }
  };

  const finalizeLink = async () => {
    setIsHarvesting(true);
    setStatusMessage('Synthesizing Identity Dossier...');
    try {
      const dossier = await harvestIdentity(name);
      const profile: UserProfile = {
        name,
        voice: 'Kore',
        persona,
        syncLevel: 98,
        googleLinked: true,
        neuralDossier: dossier,
        lastUpdate: new Date().toISOString()
      };
      
      speakResponse(`Neural link complete. Welcome home, ${name}.`);
      setTimeout(() => onComplete(profile), 2000);
    } catch (e) {
      onComplete({
        name,
        voice: 'Kore',
        persona,
        syncLevel: 75,
        googleLinked: true,
        lastUpdate: new Date().toISOString()
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617] p-6 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-xl relative">
        <div className="glass p-10 md:p-12 rounded-[3.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
          
          {/* Progress Indicator */}
          <div className="flex justify-between mb-12 relative z-10">
            {steps.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-2">
                <div className={`h-1.5 w-12 rounded-full transition-all duration-700 ${step >= s.id ? 'bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 'bg-white/5'}`} />
                <span className={`text-[8px] uppercase font-bold tracking-[0.2em] transition-colors ${step >= s.id ? 'text-indigo-400' : 'text-gray-600'}`}>{s.label}</span>
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-8 animate-in slide-in-from-right-12 duration-700">
              <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tight">Ego-Link Alpha</h1>
                <p className="text-gray-400 text-sm font-medium">Please declare your primary identity for core calibration.</p>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em]">Subject Identifier</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter Name..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-xl outline-none focus:border-indigo-500/50 transition-all font-medium text-white placeholder:text-gray-700"
                  autoFocus
                />
              </div>
              <button 
                onClick={() => setStep(2)}
                disabled={!name}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 rounded-3xl font-bold text-lg transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
              >
                Initiate Link
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right-12 duration-700">
              <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tight">Footprint Sync</h1>
                <p className="text-gray-400 text-sm">Integrate your Google life graph to achieve maximum fidelity.</p>
              </div>
              
              <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 text-center space-y-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                {isHarvesting ? (
                  <div className="space-y-6 py-4">
                    <div className="text-5xl font-black text-indigo-400 font-mono tracking-tighter">
                      {Math.round(harvestProgress)}%
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 transition-all duration-300 shadow-[0_0_15px_#6366f1]" style={{ width: `${harvestProgress}%` }} />
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.4em] animate-pulse">{statusMessage}</div>
                      <div className="text-[8px] text-gray-600 uppercase tracking-widest">Scanning Contacts • Parsing History • Building Logic Nodes</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-white rounded-3xl mx-auto flex items-center justify-center shadow-2xl transform group-hover:rotate-12 transition-transform duration-500">
                      <svg className="w-10 h-10" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-bold text-xl">Identity Core Bridge</h3>
                      <p className="text-xs text-gray-500 leading-relaxed px-4">
                        Grants your digital twin permission to replicate your schedule, communication style, and professional focus.
                      </p>
                    </div>
                    <button 
                      onClick={handleGoogleConnect}
                      className="w-full py-5 bg-white text-gray-900 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all shadow-xl active:scale-95"
                    >
                      Sync Google Life
                    </button>
                  </>
                )}
              </div>

              {!isHarvesting && (
                <button 
                  onClick={() => setStep(3)}
                  className="w-full py-2 text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-indigo-400 transition-colors"
                >
                  Skip Integration (Manual Calibration)
                </button>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in slide-in-from-right-12 duration-700">
              <div className="space-y-2 text-center">
                <h1 className="text-4xl font-black tracking-tight">Archetype Selection</h1>
                <p className="text-gray-400 text-sm">Choose the operational logic for your persona.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {['Analyst', 'Creative', 'Guardian', 'Sage'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPersona(p)}
                    className={`p-6 rounded-[2.5rem] border text-left transition-all duration-300 ${persona === p ? 'bg-indigo-600 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.3)]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                  >
                    <div className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${persona === p ? 'text-indigo-200' : 'text-indigo-400'}`}>Protocol</div>
                    <div className="font-bold text-xl">{p}</div>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setStep(4)}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 rounded-3xl font-bold text-lg transition-all"
              >
                Prepare Fusion
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-10 text-center animate-in slide-in-from-right-12 duration-700">
              {!isHarvesting ? (
                <>
                  <div className="relative w-40 h-40 mx-auto">
                    <div className="absolute inset-0 border-[6px] border-indigo-500/10 rounded-full animate-ping"></div>
                    <div className="absolute inset-0 border-[6px] border-indigo-500/30 rounded-full"></div>
                    <div className="absolute inset-0 border-[6px] border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <svg className="w-16 h-16 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0112 3v1m0 16v1m0-1a9.96 9.96 0 01-7.071-2.929m7.071 2.929A9.96 9.96 0 0019.071 17m-7.071 2.93L12 21m0-18v1m0 1a9.96 9.96 0 00-7.071 2.929m7.071-2.929A9.96 9.96 0 0119.071 7m-7.071-2.93L12 3" /></svg>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight">Fusion Finalization</h1>
                    <p className="text-gray-400 text-sm leading-relaxed px-8">Confirming synaptic bridges between your Google footprint and the <strong>{persona}</strong> core.</p>
                  </div>
                  <button 
                    onClick={finalizeLink}
                    className="w-full py-6 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 rounded-[2.5rem] font-black text-xl uppercase tracking-[0.2em] hover:brightness-110 transition-all shadow-[0_20px_50px_rgba(99,102,241,0.3)] active:scale-95"
                  >
                    Initiate Fusion
                  </button>
                </>
              ) : (
                <div className="py-12 space-y-10">
                   <div className="relative w-48 h-48 mx-auto">
                      <div className="absolute inset-0 border-[12px] border-white/5 rounded-full"></div>
                      <div className="absolute inset-0 border-[12px] border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center text-5xl font-black text-indigo-400 font-mono tracking-tighter">
                        SYNC
                      </div>
                   </div>
                   <div className="space-y-3">
                     <p className="text-indigo-400 text-xs font-bold uppercase tracking-[0.6em] animate-pulse">Establishing Synaptic Protocol</p>
                     <p className="text-gray-600 text-[10px] uppercase tracking-widest leading-loose">Encoding Personality • Weighting Neural Nodes • Mapping Archive</p>
                   </div>
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
