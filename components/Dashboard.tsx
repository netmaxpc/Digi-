
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Task, UserProfile } from '../types';
import { fastTriage, speakResponse, performResearch } from '../services/geminiService';

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
    if (now - lastUpdate > 24 * 60 * 60 * 1000 && profile.googleLinked) {
      handleNeuralRefresh();
    }
  }, [tasks]);

  const handleNeuralRefresh = async () => {
    setIsRefreshing(true);
    try {
      const research = await performResearch(`Latest professional updates and focus for "${profile.name}"`);
      onUpdateProfile({ 
        neuralDossier: research.text,
        lastUpdate: new Date().toISOString()
      });
      speakResponse("Neural refresh complete. Digital twin updated with latest footprint data.");
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
              <button onClick={() => speakResponse(summary)} className="text-indigo-400 hover:text-indigo-300 p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeWidth="2" /></svg>
              </button>
            )}
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="px-4 py-2 glass rounded-lg border border-indigo-500/20 flex flex-col items-center">
            <div className="text-[9px] text-indigo-400 font-bold uppercase tracking-[0.2em] mb-1">Identity Sync</div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
               <span className="text-lg font-bold">{profile.syncLevel}%</span>
            </div>
          </div>
          
          <button 
            onClick={handleNeuralRefresh}
            disabled={isRefreshing}
            className="px-6 py-2 glass rounded-lg border border-purple-500/20 hover:border-purple-500/50 transition-all flex flex-col items-center group"
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
          <div className="glass rounded-2xl p-6 border border-indigo-500/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-indigo-300">Synchronization Fidelity</h3>
              <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded">Real-time Pulse</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSync" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="sync" stroke="#6366f1" fill="url(#colorSync)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {profile.neuralDossier && (
            <div className="glass rounded-2xl p-6 border border-purple-500/10">
              <h3 className="font-bold text-lg text-purple-300 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                Current Identity Dossier
              </h3>
              <div className="text-sm text-gray-400 leading-relaxed max-h-40 overflow-y-auto pr-2 custom-scrollbar italic">
                {profile.neuralDossier}
              </div>
              <div className="mt-4 text-[10px] text-gray-600 uppercase tracking-widest">
                Last Intelligence Refresh: {profile.lastUpdate ? new Date(profile.lastUpdate).toLocaleString() : 'Pending'}
              </div>
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-6 border border-purple-500/10 flex flex-col">
          <h3 className="font-bold text-lg text-purple-300 mb-6">Pending Protocols</h3>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-96 pr-2">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/20 transition-all cursor-pointer group">
                <div className={`w-2 h-2 rounded-full ${task.status === 'urgent' ? 'bg-red-500' : 'bg-indigo-500'}`}></div>
                <div className="flex-1">
                  <div className="text-sm font-medium group-hover:text-purple-300 transition-colors">{task.title}</div>
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-tighter">Level {task.priority}</div>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="text-center text-xs text-gray-600 py-10 uppercase tracking-widest">No active protocols</div>
            )}
          </div>
          <button className="w-full mt-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 transition-colors font-bold text-sm">Deploy Protocol</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
