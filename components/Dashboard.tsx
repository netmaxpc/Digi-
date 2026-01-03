
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Task, UserProfile } from '../types';
import { fastTriage, speakResponse, harvestIdentity } from '../services/geminiService';

interface DashboardProps {
  profile: UserProfile;
  tasks: Task[];
  onUpdateProfile: (p: Partial<UserProfile>) => void;
}

const chartData = [
  { name: '00:00', sync: 65 }, { name: '04:00', sync: 72 }, { name: '08:00', sync: 88 },
  { name: '12:00', sync: 94 }, { name: '16:00', sync: 91 }, { name: '20:00', sync: 98 }, { name: '23:59', sync: 95 },
];

const Dashboard: React.FC<DashboardProps> = ({ profile, tasks, onUpdateProfile }) => {
  const [summary, setSummary] = useState('Syncing rapid brief...');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      setIsSyncing(true);
      try {
        const text = await fastTriage(`Generate a 1-sentence futuristic status brief for ${profile.name}. 
        Twin Archetype: ${profile.persona}. 
        Neural Data: ${profile.neuralDossier?.substring(0, 200) || 'None'}. 
        Current Tasks: ${tasks.length}.`);
        setSummary(text);
      } catch (e) {
        setSummary("System status nominal. Neural link stable.");
      } finally {
        setIsSyncing(false);
      }
    };
    fetchSummary();

    // Daily Update check
    const lastUpdate = profile.lastUpdate ? new Date(profile.lastUpdate).getTime() : 0;
    const now = new Date().getTime();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    
    if (now - lastUpdate > TWENTY_FOUR_HOURS && profile.googleLinked) {
      handleNeuralRefresh();
    }
  }, [tasks]);

  const handleNeuralRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Use harvestIdentity to refresh the dossier based on latest footprint
      const dossier = await harvestIdentity(profile.name);
      onUpdateProfile({ 
        neuralDossier: dossier,
        lastUpdate: new Date().toISOString()
      });
      speakResponse("Daily neural refresh complete. Twin intelligence updated.");
    } catch (e) {
      console.error("Refresh failed", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Welcome back, {profile.name}</h2>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-gray-400 italic text-sm">{summary}</p>
            {!isSyncing && (
              <button onClick={() => speakResponse(summary)} className="text-indigo-400 hover:text-indigo-300 p-1 transition-transform active:scale-90">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeWidth="2" /></svg>
              </button>
            )}
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="px-5 py-2 glass rounded-2xl border border-indigo-500/20 flex flex-col items-center shadow-lg">
            <div className="text-[9px] text-indigo-400 font-bold uppercase tracking-[0.2em] mb-1">Identity Sync</div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
               <span className="text-lg font-bold">{profile.syncLevel}%</span>
            </div>
          </div>
          
          <button 
            onClick={handleNeuralRefresh}
            disabled={isRefreshing}
            className={`px-6 py-2 glass rounded-2xl border transition-all flex flex-col items-center group
              ${isRefreshing ? 'border-purple-500/50 cursor-wait' : 'border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/5'}
            `}
          >
            <div className="text-[9px] text-purple-400 font-bold uppercase tracking-[0.2em] mb-1 group-hover:text-purple-300">Neural Refresh</div>
            {isRefreshing ? (
               <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
               <span className="text-sm font-bold flex items-center gap-2">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                 Sync Life
               </span>
            )}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass rounded-[2.5rem] p-8 border border-indigo-500/10 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <svg className="w-32 h-32 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
            </div>
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h3 className="font-bold text-xl text-indigo-300">Synchronization Fidelity</h3>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Real-time Neural Pulse</p>
              </div>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full font-bold">STABLE LINK</span>
            </div>
            <div className="h-64 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSync" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                  <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '16px', fontSize: '12px' }}
                    itemStyle={{ color: '#818cf8' }}
                  />
                  <Area type="monotone" dataKey="sync" stroke="#6366f1" fill="url(#colorSync)" strokeWidth={4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {profile.neuralDossier && (
            <div className="glass rounded-[2.5rem] p-8 border border-purple-500/10 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-xl text-purple-300 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </div>
                  Current Identity Dossier
                </h3>
                {profile.googleLinked && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09zM12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/></svg>
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Google Sync Active</span>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-300 leading-relaxed max-h-56 overflow-y-auto pr-4 custom-scrollbar whitespace-pre-wrap font-medium">
                {profile.neuralDossier}
              </div>
              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-widest">
                <span>Last Intelligence Refresh: {profile.lastUpdate ? new Date(profile.lastUpdate).toLocaleString() : 'Pending'}</span>
                <span>Security Tier 4 Active</span>
              </div>
            </div>
          )}
        </div>

        <div className="glass rounded-[2.5rem] p-8 border border-purple-500/10 flex flex-col shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-xl text-purple-300">Pending Protocols</h3>
            <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            </button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center gap-5 p-4 rounded-3xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer group hover:bg-white/10">
                <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${task.status === 'urgent' ? 'bg-red-500 shadow-red-500/50' : 'bg-indigo-500 shadow-indigo-500/50'}`}></div>
                <div className="flex-1">
                  <div className="text-sm font-bold group-hover:text-purple-300 transition-colors">{task.title}</div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Priority Level {task.priority}</div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="1" /></svg>
                <div className="text-[10px] uppercase tracking-[0.3em] font-bold">No active protocols detected</div>
              </div>
            )}
          </div>
          <button className="w-full mt-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all font-bold text-sm shadow-lg shadow-purple-600/20 active:scale-[0.98]">
            Deploy New Protocol
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
