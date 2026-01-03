
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
  const [summary, setSummary] = useState('Checking in on things...');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      setIsSyncing(true);
      try {
        const text = await fastTriage(`Generate a 1-sentence friendly morning summary for ${profile.name}. 
        Personality: ${profile.persona}. 
        Memories so far: ${profile.memories?.join(', ') || 'None'}.
        Tasks on hand: ${tasks.length}.`);
        setSummary(text);
      } catch (e) {
        setSummary("Good to see you! Everything looks smooth today.");
      } finally {
        setIsSyncing(false);
      }
    };
    fetchSummary();

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
      const dossier = await harvestIdentity(profile.name);
      onUpdateProfile({ 
        neuralDossier: dossier,
        lastUpdate: new Date().toISOString()
      });
      speakResponse("I've finished catching up on your latest updates. I'm all set.");
    } catch (e) {
      console.error("Catch-up failed", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-5">
           {profile.avatar && (
             <img src={profile.avatar} className="w-16 h-16 rounded-3xl object-cover border border-indigo-500/20 shadow-xl" />
           )}
           <div>
            <h2 className="text-3xl font-bold tracking-tight">Hey {profile.name},</h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-gray-400 italic text-sm">{summary}</p>
              {!isSyncing && (
                <button onClick={() => speakResponse(summary)} className="text-indigo-400 hover:text-indigo-300 p-1 transition-all active:scale-90">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeWidth="2" /></svg>
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="px-5 py-3 glass rounded-2xl border border-indigo-500/10 flex flex-col items-center justify-center shadow-lg">
            <div className="text-[9px] text-indigo-400 font-bold uppercase tracking-[0.2em] mb-1">Mirror Level</div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-green-500"></div>
               <span className="text-xl font-bold">{profile.syncLevel}%</span>
            </div>
          </div>
          
          <button 
            onClick={handleNeuralRefresh}
            disabled={isRefreshing}
            className={`px-6 py-3 glass rounded-2xl border transition-all flex flex-col items-center justify-center group
              ${isRefreshing ? 'border-indigo-500/50 cursor-wait' : 'border-white/10 hover:border-indigo-500/30 hover:bg-white/5'}
            `}
          >
            <div className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1 group-hover:text-indigo-400">Sync My Life</div>
            {isRefreshing ? (
               <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
               <span className="text-sm font-bold flex items-center gap-2">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                 Update
               </span>
            )}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass rounded-[2.5rem] p-8 border border-white/5 shadow-2xl overflow-hidden relative">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-bold text-xl">How I'm learning</h3>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Real-time attention tracker</p>
              </div>
              <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-widest">Mirroring Active</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSync" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                  <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', fontSize: '12px' }}
                    itemStyle={{ color: '#818cf8' }}
                  />
                  <Area type="monotone" dataKey="sync" stroke="#6366f1" fill="url(#colorSync)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass rounded-[2rem] p-8 border border-white/5 space-y-4">
               <h3 className="font-bold text-lg">New Memories</h3>
               <div className="space-y-3">
                 {profile.memories?.slice(-3).map((m, i) => (
                   <div key={i} className="text-sm text-gray-400 p-4 bg-white/5 rounded-2xl italic border border-white/5 leading-relaxed">
                     "{m}"
                   </div>
                 ))}
                 {(!profile.memories || profile.memories.length === 0) && (
                   <p className="text-xs text-gray-600">No memories yet. Talk to me in Voice Chat to start my learning process.</p>
                 )}
               </div>
            </div>

            <div className="glass rounded-[2rem] p-8 border border-white/5 space-y-4">
              <h3 className="font-bold text-lg">What I Know About You</h3>
              <div className="text-sm text-gray-400 leading-relaxed line-clamp-6">
                {profile.neuralDossier || "Still building your digital profile. Connect Google or perform a sync to help me catch up."}
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-[2.5rem] p-8 border border-white/5 flex flex-col shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-xl">My To-Do List</h3>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{tasks.length} items</div>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center gap-4 p-5 rounded-[2rem] bg-white/5 border border-white/5 hover:border-indigo-500/20 transition-all cursor-pointer group hover:bg-white/10">
                <div className={`w-3 h-3 rounded-full ${task.status === 'urgent' ? 'bg-red-500' : 'bg-indigo-500'}`}></div>
                <div className="flex-1">
                  <div className="text-sm font-bold group-hover:text-indigo-300 transition-colors">{task.title}</div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Level {task.priority}</div>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                <svg className="w-10 h-10 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="1" /></svg>
                <div className="text-[10px] uppercase tracking-[0.3em] font-bold">Nothing on the list</div>
              </div>
            )}
          </div>
          <button className="w-full mt-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition-all font-bold text-sm shadow-lg shadow-indigo-600/20 active:scale-[0.98]">
            Add Something Else
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
